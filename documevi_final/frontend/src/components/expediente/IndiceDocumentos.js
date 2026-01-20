import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Componente para mostrar el índice de documentos del expediente
const IndiceDocumentos = ({ expediente, workflows, onOpenFile, onSign, onStartWorkflow }) => {
    const [selectedWorkflow, setSelectedWorkflow] = useState('');
    const { documentos, vista } = expediente;

    const handleWorkflowSubmit = (e, docId) => {
        e.preventDefault();
        onStartWorkflow(docId, selectedWorkflow);
    };

    // Obtiene la URL base del archivo desde .env o usa localhost por defecto
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

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
                                    doc.ubicacion_fisica ? (
                                        <span title={doc.ubicacion_fisica} style={{ cursor: 'help' }}>
                                            📍 {doc.ubicacion_fisica.length > 30 ? doc.ubicacion_fisica.substring(0, 30) + '...' : doc.ubicacion_fisica}
                                        </span>
                                    ) : <span style={{ color: '#999' }}>Sin ubicación</span>
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
        </div>
    );
};

export default IndiceDocumentos;