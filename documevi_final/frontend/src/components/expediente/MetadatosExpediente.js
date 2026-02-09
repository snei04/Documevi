import React from 'react';

const MetadatosExpediente = ({ customFields, customData }) => {
    if (!customFields || customFields.length === 0) return null;

    return (
        <div className="content-box">
            <h3>Metadatos Personalizados del Expediente</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                {customFields.map(field => (
                    <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>
                            {field.nombre_campo}{field.es_obligatorio ? ' *' : ''}:
                        </label>
                        <div style={{
                            padding: '10px 12px',
                            backgroundColor: '#f7fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            color: '#2d3748',
                            fontSize: '0.95rem'
                        }}>
                            {field.tipo_campo === 'fecha' && customData[field.id]
                                ? new Date(customData[field.id]).toLocaleDateString('es-CO')
                                : customData[field.id] || '—'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MetadatosExpediente;
