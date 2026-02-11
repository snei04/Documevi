import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';

/**
 * Componente para generar documentos automáticamente a partir de plantillas predefinidas.
 * Renderiza un formulario dinámico basado en los campos requeridos por la plantilla seleccionada.
 *
 * @param {Object} expediente - Objeto del expediente actual donde se guardará el documento generado.
 * @param {Function} onDataChange - Callback para refrescar los datos del expediente padre.
 * @param {Array} plantillas - Lista de plantillas disponibles para la oficina/serie actual.
 */
const GenerateFromTemplate = ({ expediente, onDataChange, plantillas }) => {
    const [selectedPlantilla, setSelectedPlantilla] = useState(null);
    const [plantillaData, setPlantillaData] = useState({});

    const handleSelectPlantilla = (plantillaId) => {
        if (!plantillaId) {
            setSelectedPlantilla(null);
            setPlantillaData({});
            return;
        }
        const plantilla = plantillas.find(p => p.id === parseInt(plantillaId));
        setSelectedPlantilla(plantilla);
        setPlantillaData({});
    };

    const handlePlantillaDataChange = (e) => {
        setPlantillaData({ ...plantillaData, [e.target.name]: e.target.value });
    };

    const handleGenerateDocument = async (e) => {
        e.preventDefault();
        if (!expediente || !expediente.id_serie || !selectedPlantilla) return toast.error("Faltan datos de la plantilla o el expediente.");

        try {
            await api.post(`/expedientes/${expediente.id}/documentos-desde-plantilla`, {
                id_plantilla: selectedPlantilla.id,
                datos_rellenados: plantillaData,
                id_serie: expediente.id_serie,
                id_subserie: expediente.id_subserie,
                id_oficina_productora: expediente.id_oficina_productora
            });
            toast.success('Documento generado y añadido al expediente.');
            setSelectedPlantilla(null);
            setPlantillaData({});
            onDataChange();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al generar el documento.');
        }
    };

    if (expediente.estado !== 'En trámite' || !plantillas || plantillas.length === 0) return null;

    return (
        <div className="content-box">
            <h3>Generar Documento desde Plantilla</h3>
            <select onChange={(e) => handleSelectPlantilla(e.target.value)} style={{ marginBottom: '15px' }} value={selectedPlantilla?.id || ''}>
                <option value="">-- Seleccione una Plantilla --</option>
                {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>

            {/* Renderizado dinámico de campos según la plantilla seleccionada */}
            {selectedPlantilla && Array.isArray(selectedPlantilla.campos) && (
                <form onSubmit={handleGenerateDocument}>
                    {selectedPlantilla.campos.sort((a, b) => a.orden - b.orden).map(campo => (
                        <div key={campo.id} style={{ marginBottom: '10px' }}>
                            <label>{campo.nombre_campo}:
                                <input
                                    type={campo.tipo_campo === 'fecha' ? 'date' : campo.tipo_campo === 'numero' ? 'number' : 'text'}
                                    name={campo.nombre_campo}
                                    value={plantillaData[campo.nombre_campo] || ''}
                                    onChange={handlePlantillaDataChange}
                                    required
                                    style={{ marginLeft: '10px', width: '300px' }}
                                />
                            </label>
                        </div>
                    ))}
                    <button type="submit" className="button button-primary" style={{ marginTop: '10px' }}>Generar y Añadir</button>
                </form>
            )}
        </div>
    );
};

export default GenerateFromTemplate;
