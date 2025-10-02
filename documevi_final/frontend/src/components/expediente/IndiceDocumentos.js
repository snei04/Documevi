import React, { useState } from 'react';

const IndiceDocumentos = ({ expediente, workflows, onOpenFile, onSign, onStartWorkflow }) => {
    const [selectedWorkflow, setSelectedWorkflow] = useState('');
    const { documentos, vista } = expediente;

    const handleWorkflowSubmit = (e, docId) => {
        e.preventDefault();
        onStartWorkflow(docId, selectedWorkflow);
    };

    return (
        <div className="content-box">
            <h3>Índice Electrónico</h3>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Foliado</th>
                        <th>Radicado</th>
                        <th>Asunto</th>
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
                                {doc.path_archivo ? (
                                    <button onClick={() => onOpenFile(`http://localhost:4000/${doc.path_archivo}`)} className="link-button">
                                        {doc.radicado}
                                    </button>
                                ) : doc.radicado}
                            </td>
                            <td>{doc.asunto}</td>
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