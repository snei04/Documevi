import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const CargaMasiva = () => {
    const [oficinas, setOficinas] = useState([]);
    const [selectedOficina, setSelectedOficina] = useState('');
    const [campos, setCampos] = useState([]);
    const [archivo, setArchivo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [showInstrucciones, setShowInstrucciones] = useState(true);

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
            // silencioso
        }
    }, [selectedOficina]);

    useEffect(() => {
        fetchCampos();
    }, [fetchCampos]);

    const handleDescargarPlantilla = async () => {
        if (!selectedOficina) {
            toast.warning('Seleccione una oficina primero.');
            return;
        }
        try {
            const res = await api.get(`/migracion/plantilla/${selectedOficina}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `plantilla_carga_masiva_${selectedOficina}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Plantilla descargada.');
        } catch (err) {
            toast.error('Error al descargar la plantilla.');
        }
    };

    const handleUpload = async () => {
        if (!selectedOficina) {
            toast.warning('Seleccione una oficina.');
            return;
        }
        if (!archivo) {
            toast.warning('Seleccione un archivo Excel.');
            return;
        }

        setLoading(true);
        setResultado(null);
        const formData = new FormData();
        formData.append('archivo', archivo);

        try {
            const res = await api.post(`/migracion/cargar/${selectedOficina}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResultado(res.data);
            toast.success(res.data.msg);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al procesar el archivo.');
        } finally {
            setLoading(false);
        }
    };

    const camposObligatorios = campos.filter(c => c.es_obligatorio);
    const camposOpcionales = campos.filter(c => !c.es_obligatorio);
    const oficinaNombre = oficinas.find(o => o.id === parseInt(selectedOficina))?.nombre_oficina || '';

    return (
        <div>
            <div className="page-header">
                <h1>📤 Carga Masiva de Expedientes</h1>
            </div>

            {/* Panel de instrucciones */}
            <div className="content-box" style={{ marginBottom: '20px' }}>
                <div
                    onClick={() => setShowInstrucciones(!showInstrucciones)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                    <h3 style={{ margin: 0 }}>📋 Instrucciones de Carga</h3>
                    <span style={{ fontSize: '1.2em' }}>{showInstrucciones ? '▲' : '▼'}</span>
                </div>

                {showInstrucciones && (
                    <div style={{ marginTop: '15px' }}>
                        <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '8px', padding: '16px', marginBottom: '15px' }}>
                            <h4 style={{ color: '#2b6cb0', margin: '0 0 10px 0' }}>📌 Pasos para la carga masiva:</h4>
                            <ol style={{ color: '#2d3748', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
                                <li><strong>Seleccione la Oficina Productora</strong> a la que pertenecen los expedientes a migrar.</li>
                                <li><strong>Descargue la plantilla de ejemplo</strong> haciendo clic en el botón "Descargar Plantilla". Esta se genera automáticamente con las columnas correctas.</li>
                                <li><strong>Complete la plantilla</strong> siguiendo las instrucciones de la hoja "Instrucciones" del archivo Excel.</li>
                                <li><strong>Suba el archivo</strong> completado y haga clic en "Iniciar Carga".</li>
                            </ol>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px', padding: '16px' }}>
                                <h4 style={{ color: '#22543d', margin: '0 0 8px 0' }}>📄 Columnas Base del Expediente</h4>
                                <ul style={{ color: '#2d3748', lineHeight: '1.7', margin: 0, paddingLeft: '18px', fontSize: '0.9em' }}>
                                    <li><code>id_serie (*)</code> — ID de la serie TRD <strong>(Obligatorio)</strong></li>
                                    <li><code>id_subserie</code> — ID de la subserie TRD (Opcional)</li>
                                    <li><code>descriptor_1</code> — Descriptor del expediente</li>
                                    <li><code>descriptor_2</code> — Segundo descriptor</li>
                                </ul>
                            </div>

                            <div style={{ background: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '8px', padding: '16px' }}>
                                <h4 style={{ color: '#2d3748', margin: '0 0 8px 0' }}>📅 Fechas y Estado del Expediente</h4>
                                <ul style={{ color: '#2d3748', lineHeight: '1.7', margin: 0, paddingLeft: '18px', fontSize: '0.9em' }}>
                                    <li><code>fecha_apertura (*)</code> — Fecha de apertura <strong>(Obligatorio)</strong>. Formato: AAAA-MM-DD</li>
                                    <li><code>fecha_cierre</code> — Fecha de cierre (Opcional). Formato: AAAA-MM-DD</li>
                                    <li><code>estado_expediente</code> — Fase del expediente (Opcional)</li>
                                </ul>
                                <p style={{ color: '#4a5568', fontSize: '0.85em', marginTop: '8px', marginBottom: 0 }}>
                                    📌 <strong>Valores de estado permitidos:</strong>
                                </p>
                                <ul style={{ color: '#4a5568', fontSize: '0.82em', margin: '4px 0 0 0', paddingLeft: '18px', lineHeight: '1.6' }}>
                                    <li><code>En trámite</code> — Expediente abierto y activo (valor por defecto)</li>
                                    <li><code>Cerrado en Gestión</code> — Expediente cerrado, se encuentra en archivo de gestión</li>
                                    <li><code>Cerrado en Central</code> — Expediente transferido a archivo central</li>
                                </ul>
                            </div>

                            <div style={{ background: '#fffff0', border: '1px solid #fefcbf', borderRadius: '8px', padding: '16px' }}>
                                <h4 style={{ color: '#744210', margin: '0 0 8px 0' }}>📦 Ubicación Física (Opcional)</h4>
                                <ul style={{ color: '#2d3748', lineHeight: '1.7', margin: 0, paddingLeft: '18px', fontSize: '0.9em' }}>
                                    <li><code>numero_paquete</code> — Número del paquete existente</li>
                                    <li><code>codigo_carpeta</code> — Código de la carpeta</li>
                                </ul>
                                <p style={{ color: '#975a16', fontSize: '0.85em', marginTop: '8px', marginBottom: 0 }}>
                                    ⚠️ El paquete debe existir previamente en el sistema y pertenecer a la misma oficina.
                                </p>
                            </div>

                            <div style={{ background: '#faf5ff', border: '1px solid #e9d8fd', borderRadius: '8px', padding: '16px' }}>
                                <h4 style={{ color: '#553c9a', margin: '0 0 8px 0' }}>📎 Documento Asociado (Opcional)</h4>
                                <ul style={{ color: '#2d3748', lineHeight: '1.7', margin: 0, paddingLeft: '18px', fontSize: '0.9em' }}>
                                    <li><code>DOC_radicado</code> — Radicado (se auto-genera si no se indica)</li>
                                    <li><code>DOC_asunto</code> — Asunto del documento</li>
                                    <li><code>DOC_tipo_documental</code> — Tipo: Oficio, Resolución, etc.</li>
                                    <li><code>DOC_soporte</code> — Soporte: Físico, Digital</li>
                                    <li><code>DOC_folios</code> — Número de folios</li>
                                </ul>
                                <p style={{ color: '#553c9a', fontSize: '0.85em', marginTop: '8px', marginBottom: 0 }}>
                                    ℹ️ Para asociar un documento, al menos <code>DOC_asunto</code> debe tener valor.
                                </p>
                            </div>

                            <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '16px' }}>
                                <h4 style={{ color: '#c53030', margin: '0 0 8px 0' }}>🔑 Campos Personalizados</h4>
                                <p style={{ color: '#2d3748', fontSize: '0.9em', margin: '0 0 8px 0' }}>
                                    Las columnas con formato <code>CP_id_nombre</code> corresponden a campos personalizados de la oficina.
                                </p>
                                <p style={{ color: '#c53030', fontSize: '0.85em', margin: 0, fontWeight: '500' }}>
                                    ⚠️ Los campos marcados con (*) son <strong>obligatorios</strong>. Si no se llenan, la fila fallará.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Selector de oficina y acciones */}
            <div className="content-box">
                <h3>Configuración de Carga</h3>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: '600' }}>Oficina Productora:</label>
                    <select
                        value={selectedOficina}
                        onChange={(e) => { setSelectedOficina(e.target.value); setResultado(null); setArchivo(null); }}
                        style={{ marginLeft: '10px', padding: '8px', minWidth: '250px' }}
                    >
                        <option value="">-- Seleccione una Oficina --</option>
                        {oficinas.map(ofi => (
                            <option key={ofi.id} value={ofi.id}>{ofi.nombre_oficina}</option>
                        ))}
                    </select>
                </div>

                {/* Mostrar campos personalizados de la oficina seleccionada */}
                {selectedOficina && campos.length > 0 && (
                    <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>
                            Campos Personalizados de "{oficinaNombre}"
                        </h4>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            {camposObligatorios.length > 0 && (
                                <div>
                                    <strong style={{ color: '#c53030', fontSize: '0.85em' }}>Obligatorios:</strong>
                                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', fontSize: '0.9em' }}>
                                        {camposObligatorios.map(c => (
                                            <li key={c.id}>
                                                <code>CP_{c.id}_{c.nombre_campo}</code> ({c.tipo_campo})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {camposOpcionales.length > 0 && (
                                <div>
                                    <strong style={{ color: '#718096', fontSize: '0.85em' }}>Opcionales:</strong>
                                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', fontSize: '0.9em' }}>
                                        {camposOpcionales.map(c => (
                                            <li key={c.id}>
                                                <code>CP_{c.id}_{c.nombre_campo}</code> ({c.tipo_campo})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {selectedOficina && (
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                        <button
                            onClick={handleDescargarPlantilla}
                            className="button"
                            style={{ backgroundColor: '#c6f6d5', color: '#22543d', border: '1px solid #9ae6b4', padding: '10px 20px' }}
                        >
                            📥 Descargar Plantilla de Ejemplo
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => setArchivo(e.target.files[0])}
                                style={{ flex: 1 }}
                            />
                            <button
                                onClick={handleUpload}
                                disabled={loading || !archivo}
                                className="button button-primary"
                                style={{ padding: '10px 24px', opacity: (loading || !archivo) ? 0.6 : 1 }}
                            >
                                {loading ? '⏳ Procesando...' : '🚀 Iniciar Carga'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Resultados de la carga */}
            {resultado && (
                <div className="content-box" style={{ marginTop: '20px' }}>
                    <h3>📊 Resultado de la Carga</h3>

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                        <div style={{
                            flex: 1, background: '#f0fff4', border: '1px solid #c6f6d5',
                            borderRadius: '8px', padding: '16px', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#22543d' }}>{resultado.exitosos}</div>
                            <div style={{ color: '#38a169', fontWeight: '500' }}>✅ Exitosos</div>
                        </div>
                        <div style={{
                            flex: 1, background: '#fff5f5', border: '1px solid #fed7d7',
                            borderRadius: '8px', padding: '16px', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#c53030' }}>{resultado.fallidos}</div>
                            <div style={{ color: '#e53e3e', fontWeight: '500' }}>❌ Fallidos</div>
                        </div>
                        <div style={{
                            flex: 1, background: '#ebf8ff', border: '1px solid #bee3f8',
                            borderRadius: '8px', padding: '16px', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#2b6cb0' }}>{resultado.total}</div>
                            <div style={{ color: '#3182ce', fontWeight: '500' }}>📄 Total Filas</div>
                        </div>
                    </div>

                    {/* Detalle por fila */}
                    {resultado.detalle && resultado.detalle.length > 0 && (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="styled-table">
                                <thead>
                                    <tr>
                                        <th>Fila</th>
                                        <th>Estado</th>
                                        <th>Radicado</th>
                                        <th>Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultado.detalle.map((item, idx) => (
                                        <tr key={idx} style={{ backgroundColor: item.estado === 'ERROR' ? '#fff5f5' : 'transparent' }}>
                                            <td>{item.fila}</td>
                                            <td>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8em',
                                                    fontWeight: '600',
                                                    backgroundColor: item.estado === 'OK' ? '#c6f6d5' : '#fed7d7',
                                                    color: item.estado === 'OK' ? '#22543d' : '#c53030'
                                                }}>
                                                    {item.estado === 'OK' ? '✅ OK' : '❌ ERROR'}
                                                </span>
                                            </td>
                                            <td>{item.radicado || '—'}</td>
                                            <td style={{ fontSize: '0.9em', color: item.estado === 'ERROR' ? '#c53030' : '#718096' }}>
                                                {item.error || `ID: ${item.id}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CargaMasiva;
