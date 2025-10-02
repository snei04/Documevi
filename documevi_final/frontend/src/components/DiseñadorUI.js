import React from 'react';

export const CargandoDiseñador = () => (
    <div className="diseñador-estado-container">
        <div className="diseñador-estado-titulo">📄 Cargando diseñador...</div>
        <div className="diseñador-estado-subtitulo">
            Preparando el entorno de diseño visual
        </div>
    </div>
);

export const ErrorDiseñador = ({ error, onRetry }) => (
    <div className="diseñador-estado-container">
        <div className="diseñador-estado-titulo error">⚠️ {error}</div>
        <button onClick={onRetry} className="diseñador-retry-button">
            🔄 Recargar Página
        </button>
    </div>
);