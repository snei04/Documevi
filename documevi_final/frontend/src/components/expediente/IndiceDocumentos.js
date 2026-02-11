import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EditLocationModal from './EditLocationModal';
import { usePermissionsContext } from '../../context/PermissionsContext';

// Componente para mostrar el índice de documentos del expediente
const IndiceDocumentos = ({ expediente, workflows, onOpenFile, onSign, onStartWorkflow }) => {
    const [selectedWorkflow, setSelectedWorkflow] = useState('');
    const { documentos } = expediente;

    const handleWorkflowSubmit = (e, docId) => {
        e.preventDefault();
        onStartWorkflow(docId, selectedWorkflow);
    };

    // Obtiene la URL base del archivo desde .env o usa localhost por defecto
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';
    const { permissions } = usePermissionsContext();

    // Estado para el modal de edición de ubicación
    const [isEditLocationOpen, setIsEditLocationOpen] = useState(false);
    const [documentoToEdit, setDocumentoToEdit] = useState(null);

    const handleOpenEditLocation = (doc) => {
        setDocumentoToEdit(doc);
        setIsEditLocationOpen(true);
    };

    const handleCloseEditLocation = () => {
        setIsEditLocationOpen(false);
        setDocumentoToEdit(null);
    };

    const handleLocationUpdated = () => {
        // Recargar datos si es necesario, o notificar al padre
        // Idealmente, IndiceDocumentos debería recibir una función refresh
        if (typeof onOpenFile === 'function' && onOpenFile.name === 'forceUpdate') {
            // Hack: si onOpenFile fuera un refresh... 
            // Mejor pedir una prop onRefresh
        }
        window.location.reload(); // Simple reload for now
    };

    // Determina la vista actual, por defecto 'consulta'
    const vista = expediente?.vista || 'consulta';
    const canEditLocation = permissions.includes('documentos_editar');

    return (
        <div className="content-box">
            <h3>Índice Electrónico</h3>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Foliado</th>
                        <th>Radicado</th>
                        <th>Asunto</th>
                        <th>Tipo Soporte</th>
                        <th>Ubicación Física</th>
                        <th>Firma Req.</th>
                        <th>Estado Firma</th>
                        {vista === 'productor' && <th>Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {documentos.map(doc => (
                        <tr key={doc.id}>
                            <td>{doc.orden_foliado}</td>
                            <td>
                                {/*Genera el documento*/}
                                <Link to={`/dashboard/documentos/${doc.id}`} className="link-button" style={{ marginRight: '8px' }}>
                                    {doc.radicado}
                                </Link>
                                {doc.path_archivo && (
                                    <button onClick={() => onOpenFile(`${API_BASE_URL}/${doc.path_archivo}`)} className="button button-small" title="Ver archivo">
                                        📄
                                    </button>
                                )}
                            </td>
                            <td>{doc.asunto}</td>
                            <td style={{ textAlign: 'center' }}>
                                <span className={`badge ${doc.tipo_soporte === 'Físico' ? 'badge-warning' : doc.tipo_soporte === 'Híbrido' ? 'badge-info' : 'badge-success'}`}>
                                    {doc.tipo_soporte || 'Electrónico'}
                                </span>
                            </td>
                            <td>
                                {doc.tipo_soporte === 'Físico' || doc.tipo_soporte === 'Híbrido' ? (
                                    <div style={{ fontSize: '0.9em', lineHeight: '1.5', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                {doc.id_carpeta ? (
                                                    <div>
                                                        <span style={{ color: '#805ad5', fontWeight: '600' }}>
                                                            📁 Carpeta ID: {doc.id_carpeta}
                                                        </span>
                                                        {doc.paquete && <span style={{ display: 'block', fontSize: '0.85em' }}>📦 Pq: {doc.paquete}</span>}
                                                    </div>
                                                ) : expediente.codigo_carpeta ? (
                                                    <div>
                                                        <span style={{ color: '#805ad5', fontWeight: '600' }}>
                                                            📁 Carpeta: {expediente.codigo_carpeta}
                                                        </span>
                                                    </div>
                                                ) : null}

                                                {doc.ubicacion_fisica && (
                                                    <div title={doc.ubicacion_fisica} style={{ cursor: 'help', color: '#718096' }}>
                                                        📍 {doc.ubicacion_fisica.length > 30 ? doc.ubicacion_fisica.substring(0, 30) + '...' : doc.ubicacion_fisica}
                                                    </div>
                                                )}

                                                {!doc.id_carpeta && !doc.ubicacion_fisica && !expediente.codigo_carpeta && (
                                                    <span style={{ color: '#999' }}>Sin ubicación</span>
                                                )}
                                            </div>
                                            {vista === 'productor' && canEditLocation && (
                                                <button
                                                    onClick={() => handleOpenEditLocation(doc)}
                                                    className="button-icon"
                                                    title="Editar Ubicación Física"
                                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', marginLeft: '5px' }}
                                                >
                                                    ✏️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : <span style={{ color: '#999' }}>N/A</span>}
                            </td>
                            <td style={{ textAlign: 'center' }}>{doc.requiere_firma ? 'Sí' : 'No'}</td>
                            <td style={{ textAlign: 'center' }}>{doc.firma_hash ? <span style={{ color: 'green' }}>✅ Firmado</span> : <span style={{ color: 'orange' }}>Pendiente</span>}</td>
                            {vista === 'productor' && (
                                <td className="action-cell">
                                    {doc.requiere_firma && !doc.firma_hash && (
                                        <button onClick={() => onSign(doc.id)} className="button" style={{ backgroundColor: 'green', color: 'white' }}>Firmar</button>
                                    )}
                                    <form onSubmit={(e) => handleWorkflowSubmit(e, doc.id)}>
                                        <select onChange={(e) => setSelectedWorkflow(e.target.value)} defaultValue="">
                                            <option value="" disabled>-- Workflow --</option>
                                            {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.nombre}</option>)}
                                        </select>
                                        <button type="submit" className="button">Iniciar</button>
                                    </form>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {isEditLocationOpen && (
                <EditLocationModal
                    isOpen={isEditLocationOpen}
                    onClose={handleCloseEditLocation}
                    documento={documentoToEdit}
                    onUpdate={handleLocationUpdated}
                    idOficina={expediente?.id_oficina_productora}
                />
            )}
        </div>
    );
};

export default IndiceDocumentos;