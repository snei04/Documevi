import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css'; // Asegúrate de que el CSS esté importado

const GestionCamposPersonalizados = () => {
    const [oficinas, setOficinas] = useState([]);
    const [selectedOficina, setSelectedOficina] = useState('');
    const [campos, setCampos] = useState([]);
    const [newCampo, setNewCampo] = useState({
        nombre_campo: '',
        tipo_campo: 'texto',
        es_obligatorio: false,
        validar_duplicidad: false
    });

    useEffect(() => {
        const fetchOficinas = async () => {
            try {
                const res = await api.get('/oficinas');
                setOficinas(res.data);
            } catch (err) {
                toast.error('No se pudieron cargar las oficinas.');
            }
        };
        fetchOficinas();
    }, []);

    const fetchCampos = useCallback(async () => {
        if (!selectedOficina) {
            setCampos([]);
            return;
        }
        try {
            const res = await api.get(`/campos-personalizados/oficina/${selectedOficina}`);
            setCampos(res.data);
        } catch (err) {
            toast.error('Error al cargar los campos para esta oficina.');
        }
    }, [selectedOficina]);

    useEffect(() => {
        fetchCampos();
    }, [fetchCampos]);

    const handleNewCampoChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewCampo(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCreateCampo = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/campos-personalizados/oficina/${selectedOficina}`, newCampo);
            toast.success('Campo personalizado creado con éxito.');
            setNewCampo({ nombre_campo: '', tipo_campo: 'texto', es_obligatorio: false, validar_duplicidad: false });
            fetchCampos();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear el campo.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Gestionar Campos Personalizados por Oficina</h1>
            </div>

            <div className="content-box">
                <div style={{ marginBottom: '20px' }}>
                    <label>Seleccione una Oficina Productora:</label>
                    <select value={selectedOficina} onChange={(e) => setSelectedOficina(e.target.value)} style={{marginLeft: '10px'}}>
                        <option value="">-- Seleccione --</option>
                        {oficinas.map(ofi => (
                            <option key={ofi.id} value={ofi.id}>{ofi.nombre_oficina}</option>
                        ))}
                    </select>
                </div>

                {selectedOficina && (
                    <>
                        <form onSubmit={handleCreateCampo} className="action-bar" style={{borderTop: '1px solid #eee', paddingTop: '20px', flexWrap: 'wrap', gap: '10px'}}>
                            <input type="text" name="nombre_campo" placeholder="Nombre del Campo (ej. Cédula Paciente)" value={newCampo.nombre_campo} onChange={handleNewCampoChange} required />
                            <select name="tipo_campo" value={newCampo.tipo_campo} onChange={handleNewCampoChange}>
                                <option value="texto">Texto</option>
                                <option value="numero">Número</option>
                                <option value="fecha">Fecha</option>
                            </select>
                            <label style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                <input type="checkbox" name="es_obligatorio" checked={newCampo.es_obligatorio} onChange={handleNewCampoChange} />
                                ¿Es obligatorio?
                            </label>
                            <label style={{display: 'flex', alignItems: 'center', gap: '5px'}} title="Si está marcado, el sistema validará que no exista otro expediente con el mismo valor en este campo">
                                <input type="checkbox" name="validar_duplicidad" checked={newCampo.validar_duplicidad} onChange={handleNewCampoChange} />
                                🔍 Validar duplicidad
                            </label>
                            <button type="submit" className="button button-primary">Añadir Campo</button>
                        </form>
                    </>
                )}
            </div>

            {selectedOficina && (
                <>
                    <h3>Campos Definidos para esta Oficina</h3>
                    <table className="styled-table">
                       <thead>
                           <tr>
                               <th>Nombre del Campo</th>
                               <th>Tipo</th>
                               <th>Obligatorio</th>
                               <th>Validar Duplicidad</th>
                           </tr>
                       </thead>
                       <tbody>
                           {campos.map(campo => (
                               <tr key={campo.id}>
                                   <td>{campo.nombre_campo}</td>
                                   <td>{campo.tipo_campo}</td>
                                   <td>{campo.es_obligatorio ? 'Sí' : 'No'}</td>
                                   <td>{campo.validar_duplicidad ? '🔍 Sí' : 'No'}</td>
                               </tr>
                           ))}
                       </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default GestionCamposPersonalizados;