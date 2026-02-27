import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import PermissionGuard from '../../auth/PermissionGuard';
import FileUpload from '../../FileUpload';

/**
 * Componente para radicar y crear un nuevo documento directamente en el expediente.
 * Maneja la subida de archivos (Soporte Electrónico) y la captura de ubicación física (Soporte Físico).
 * Requiere el permiso `expedientes_crear`.
 *
 * @param {Object} expediente - Objeto del expediente actual.
 * @param {Function} onDataChange - Callback para refrescar los datos del expediente padre.
 */
const CreateNewDocument = ({ expediente, onDataChange }) => {
    const [showCrearDocForm, setShowCrearDocForm] = useState(false);
    const [nuevoDocData, setNuevoDocData] = useState({
        tipo_soporte: 'Electrónico',
        asunto: '',
        id_carpeta: '',
        tomo: '',
        modulo: '',
        estante: '',
        entrepaño: '',
        otro: '',
        remitente_nombre: '',
        remitente_identificacion: '',
        remitente_direccion: ''
    });
    const [carpetasDisponibles, setCarpetasDisponibles] = useState([]);
    const [archivo, setArchivo] = useState(null);
    const [creandoDoc, setCreandoDoc] = useState(false);
    const fileInputRef = useRef(null);

    // Cargar carpetas cuando se abre el formulario de crear doc o cambia la oficina
    useEffect(() => {
        if (showCrearDocForm && expediente?.id_oficina_productora) {
            const fetchCarpetas = async () => {
                try {
                    const res = await api.get('/carpetas', {
                        params: {
                            id_oficina: expediente.id_oficina_productora,
                            estado: 'Abierta'
                        }
                    });
                    setCarpetasDisponibles(Array.isArray(res.data) ? res.data : (res.data.data || []));
                } catch (err) {
                    console.error("Error cargando carpetas", err);
                }
            };
            fetchCarpetas();
        }
    }, [showCrearDocForm, expediente]);

    const handleCarpetaChange = (e) => {
        const carpetaId = e.target.value;
        const carpeta = carpetasDisponibles.find(c => c.id === parseInt(carpetaId));

        if (carpeta) {
            setNuevoDocData(prev => ({
                ...prev,
                id_carpeta: carpetaId,
                modulo: carpeta.ubicacion_modulo || '',
                estante: carpeta.ubicacion_estante || '',
                entrepaño: carpeta.ubicacion_entrepaño || '',
                otro: ''
            }));
        } else {
            setNuevoDocData(prev => ({ ...prev, id_carpeta: '' }));
        }
    };

    const handleCrearDocumento = async (e) => {
        e.preventDefault();
        if (!nuevoDocData.asunto.trim()) {
            return toast.error('El asunto del documento es obligatorio.');
        }
        if (nuevoDocData.tipo_soporte === 'Electrónico' && !archivo) {
            return toast.error('Debe adjuntar un archivo para documentos electrónicos.');
        }

        if ((nuevoDocData.tipo_soporte === 'Físico' || nuevoDocData.tipo_soporte === 'Híbrido')) {
            const hasLocation = nuevoDocData.id_carpeta ||
                nuevoDocData.ubicacion_fisica ||
                (nuevoDocData.otro && nuevoDocData.otro.trim()) ||
                (nuevoDocData.tomo && nuevoDocData.tomo.trim()) ||
                (nuevoDocData.modulo && nuevoDocData.modulo.trim()) ||
                (nuevoDocData.estante && nuevoDocData.estante.trim()) ||
                (nuevoDocData.entrepaño && nuevoDocData.entrepaño.trim());

            if (!hasLocation) {
                return toast.error('Para documentos físicos, debe especificar una Carpeta o detalles de Ubicación.');
            }
        }

        setCreandoDoc(true);
        try {
            const formData = new FormData();
            formData.append('asunto', nuevoDocData.asunto);
            formData.append('tipo_soporte', nuevoDocData.tipo_soporte);
            formData.append('id_serie', expediente.id_serie);
            formData.append('id_subserie', expediente.id_subserie || '');
            formData.append('id_oficina_productora', expediente.id_oficina_productora);
            formData.append('id_expediente', expediente.id);

            if (nuevoDocData.id_carpeta) formData.append('id_carpeta', nuevoDocData.id_carpeta);
            if (nuevoDocData.tomo) formData.append('tomo', nuevoDocData.tomo);
            if (nuevoDocData.modulo) formData.append('modulo', nuevoDocData.modulo);
            if (nuevoDocData.estante) formData.append('estante', nuevoDocData.estante);
            if (nuevoDocData.entrepaño) formData.append('entrepaño', nuevoDocData.entrepaño);
            if (nuevoDocData.otro) formData.append('otro', nuevoDocData.otro);

            if (nuevoDocData.remitente_nombre) {
                formData.append('remitente_nombre', nuevoDocData.remitente_nombre);
                formData.append('remitente_identificacion', nuevoDocData.remitente_identificacion || '');
                formData.append('remitente_direccion', nuevoDocData.remitente_direccion || '');
            }
            if (archivo) {
                formData.append('archivo', archivo);
            }

            await api.post('/documentos/con-expediente', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Documento creado y añadido al expediente.');
            setNuevoDocData({
                tipo_soporte: 'Electrónico',
                asunto: '',
                id_carpeta: '',
                tomo: '',
                modulo: '',
                estante: '',
                entrepaño: '',
                otro: '',
                remitente_nombre: '',
                remitente_identificacion: '',
                remitente_direccion: ''
            });
            setArchivo(null);
            setShowCrearDocForm(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            onDataChange();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear el documento.');
        } finally {
            setCreandoDoc(false);
        }
    };

    // Permitir crear documentos si está en trámite o si es expediente físico (incluso cerrado)
    const esCerrado = expediente.estado === 'Cerrado en Gestión' || expediente.estado === 'Cerrado en Central';
    const esFisico = expediente.tipo_soporte === 'Físico';
    if (expediente.estado !== 'En trámite' && !(esFisico && esCerrado)) return null;

    return (
        <PermissionGuard permission="expedientes_crear">
            <div className="content-box">
                {esCerrado && (
                    <div style={{
                        background: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '6px',
                        padding: '10px',
                        marginBottom: '15px',
                        fontSize: '13px'
                    }}>
                        ⚠️ <strong>Expediente cerrado ({expediente.estado}):</strong> Se permite crear documentos porque es de soporte físico.
                        Esta acción quedará registrada en auditoría.
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>📄 Crear Documento Nuevo</h3>
                    <button
                        type="button"
                        onClick={() => setShowCrearDocForm(!showCrearDocForm)}
                        className="button"
                        style={{ backgroundColor: showCrearDocForm ? '#e2e8f0' : '#3182ce', color: showCrearDocForm ? '#4a5568' : '#fff' }}
                    >
                        {showCrearDocForm ? '✕ Cerrar' : '+ Nuevo Documento'}
                    </button>
                </div>

                {showCrearDocForm && (
                    <form onSubmit={handleCrearDocumento}>
                        <div style={{ display: 'grid', gap: '15px' }}>
                            <div className="form-group">
                                <label>Tipo de Soporte *</label>
                                <select
                                    value={nuevoDocData.tipo_soporte}
                                    onChange={(e) => setNuevoDocData(prev => ({ ...prev, tipo_soporte: e.target.value }))}
                                >
                                    <option value="Electrónico">Electrónico</option>
                                    <option value="Físico">Físico</option>
                                    <option value="Híbrido">Híbrido</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Asunto *</label>
                                <input
                                    type="text"
                                    value={nuevoDocData.asunto}
                                    onChange={(e) => setNuevoDocData(prev => ({ ...prev, asunto: e.target.value }))}
                                    placeholder="Descripción del documento"
                                />
                            </div>

                            {(nuevoDocData.tipo_soporte === 'Físico' || nuevoDocData.tipo_soporte === 'Híbrido') && (
                                <div style={{ padding: '15px', backgroundColor: '#fffaf0', borderRadius: '6px', border: '1px solid #fae6b8' }}>
                                    <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#c05621' }}>📍 Ubicación Física</h4>

                                    <div className="form-group">
                                        <label>Carpeta (Opcional - Autocompleta ubicación)</label>
                                        <select
                                            value={nuevoDocData.id_carpeta}
                                            onChange={handleCarpetaChange}
                                            style={{ width: '100%' }}
                                        >
                                            <option value="">-- Seleccione Carpeta (o ingrese manualmente abajo) --</option>
                                            {carpetasDisponibles.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.codigo_carpeta ? `${c.codigo_carpeta} - ` : ''}{c.nombre_carpeta || `Carpeta #${c.consecutivo} (${c.año})`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                        <div className="form-group">
                                            <label>Tomo / Legajo</label>
                                            <input
                                                type="text"
                                                name="tomo"
                                                className="form-control"
                                                value={nuevoDocData.tomo}
                                                onChange={(e) => setNuevoDocData(prev => ({ ...prev, tomo: e.target.value }))}
                                                placeholder="Tomo 1"
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                        <div className="form-group">
                                            <label>Estante</label>
                                            <input
                                                type="text"
                                                value={nuevoDocData.estante}
                                                onChange={(e) => setNuevoDocData(prev => ({ ...prev, estante: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Entrepaño</label>
                                            <input
                                                type="text"
                                                value={nuevoDocData.entrepaño}
                                                onChange={(e) => setNuevoDocData(prev => ({ ...prev, entrepaño: e.target.value }))}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Módulo</label>
                                            <input
                                                type="text"
                                                value={nuevoDocData.modulo}
                                                onChange={(e) => setNuevoDocData(prev => ({ ...prev, modulo: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Otro (Notas adicionales)</label>
                                        <input
                                            type="text"
                                            value={nuevoDocData.otro}
                                            onChange={(e) => setNuevoDocData(prev => ({ ...prev, otro: e.target.value }))}
                                            placeholder="Ej: Archivo de gestión temporal, gaveta 2..."
                                        />
                                    </div>
                                </div>
                            )}

                            {(nuevoDocData.tipo_soporte === 'Electrónico' || nuevoDocData.tipo_soporte === 'Híbrido') && (
                                <div className="form-group">
                                    <label>Adjuntar Archivo {nuevoDocData.tipo_soporte === 'Electrónico' ? '*' : '(Opcional)'}</label>
                                    <FileUpload
                                        onFileChange={(file) => setArchivo(file)}
                                        ref={fileInputRef}
                                    />
                                </div>
                            )}

                            <details style={{ marginTop: '10px' }}>
                                <summary style={{ cursor: 'pointer', color: '#3182ce' }}>+ Datos del Remitente (Opcional)</summary>
                                <div style={{ padding: '15px', backgroundColor: '#f7fafc', borderRadius: '6px', marginTop: '10px' }}>
                                    <div className="form-group">
                                        <label>Nombre del Remitente</label>
                                        <input
                                            type="text"
                                            value={nuevoDocData.remitente_nombre}
                                            onChange={(e) => setNuevoDocData(prev => ({ ...prev, remitente_nombre: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Identificación</label>
                                        <input
                                            type="text"
                                            value={nuevoDocData.remitente_identificacion}
                                            onChange={(e) => setNuevoDocData(prev => ({ ...prev, remitente_identificacion: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Dirección</label>
                                        <input
                                            type="text"
                                            value={nuevoDocData.remitente_direccion}
                                            onChange={(e) => setNuevoDocData(prev => ({ ...prev, remitente_direccion: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </details>

                            <div style={{ marginTop: '15px' }}>
                                <button type="submit" className="button button-primary" disabled={creandoDoc}>
                                    {creandoDoc ? '⏳ Creando...' : '✓ Crear y Añadir al Expediente'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </PermissionGuard>
    );
};

export default CreateNewDocument;
