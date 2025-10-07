import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useGrapesJSEditor } from '../hooks/useGrapesJSEditor';
import { CargandoDiseñador, ErrorDiseñador } from './DiseñadorUI';
import './DiseñadorPlantilla.css';

const DiseñadorPlantilla = () => {
    const { id: plantillaId } = useParams();
    const [plantilla, setPlantilla] = useState(null);
    const [variables, setVariables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Hook para cargar los datos iniciales
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!plantillaId) return;
            
            setIsLoading(true);
            setError(null);
            
            try {
                const [plantillaRes, variablesRes] = await Promise.all([
                    api.get(`/plantillas/${plantillaId}`),
                    api.get(`/plantillas/${plantillaId}/variables`)
                ]);
                setPlantilla(plantillaRes.data);
                setVariables(variablesRes.data);
            } catch (err) {
                console.error("Error al cargar datos:", err);
                setError('No se pudieron cargar los datos de la plantilla.');
                toast.error("Error al cargar datos iniciales.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [plantillaId]);

    // 2. Hook personalizado para manejar el editor GrapesJS
    // Solo se activa cuando la plantilla y las variables están listas.
    const editorRef = useGrapesJSEditor(plantilla, variables);

    // 3. Renderizado condicional
    if (isLoading) return <CargandoDiseñador />;
    if (error) return <ErrorDiseñador error={error} onRetry={() => window.location.reload()} />;
    if (!plantilla) return <ErrorDiseñador error="Error: La plantilla no se encontró." onRetry={() => window.location.reload()} />;

    return (
        <div className="diseñador-container">
            <header className="diseñador-header">
                <h2>🎨 Diseñador Visual: {plantilla.nombre}</h2>
                <div className="diseñador-header-info">
                    <span>📋 Arrastra elementos</span>
                    <span>💾 Guarda tu progreso</span>
                    <span>🔧 Usa el panel derecho para estilos</span>
                </div>
            </header>
            
            <div className="panel__basic-actions"></div>
            
            <main className="editor-main-area">
                <aside id="blocks"></aside>
                <div ref={editorRef} className="editor-canvas-wrapper" />
            </main>
        </div>
    );
};

export default DiseñadorPlantilla;