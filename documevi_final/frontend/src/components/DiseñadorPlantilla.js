// src/components/DiseñadorPlantilla.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axios';

import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsBlocksBasic from 'grapesjs-blocks-basic';

const DiseñadorPlantilla = () => {
    const { id: plantillaId } = useParams();
    const editorRef = useRef(null);
    const [plantilla, setPlantilla] = useState(null);

    const handleBackgroundUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('background', file);
        try {
            const response = await axios.post(`/plantillas/${plantillaId}/background`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setPlantilla({ ...plantilla, background_image_path: response.data.filePath });
            alert('Imagen de fondo actualizada.');
        } catch (error) {
            console.error("Error al subir la imagen", error);
            alert('Error al subir la imagen.');
        }
    };

    useEffect(() => {
        const fetchPlantilla = async () => {
            try {
                const { data } = await axios.get(`/plantillas/${plantillaId}`);
                setPlantilla(data);
            } catch (error) {
                console.error("Error al cargar la plantilla", error);
                setPlantilla(null);
            }
        };
        fetchPlantilla();
    }, [plantillaId]);


    useEffect(() => {
        if (!plantilla) return;

        let editor;

        const initializeEditor = async () => {
            const variables = await axios.get(`/plantillas/${plantillaId}/variables`).then(res => res.data);

            editor = grapesjs.init({
                container: editorRef.current,
                storageManager: { type: null },
                plugins: [gjsBlocksBasic],
                pluginsOpts: {
                    [gjsBlocksBasic]: {}
                },
                canvas: {
                    styles: [
                        'body { margin: 0; }',
                        plantilla.background_image_path ? 
                        `.gjs-frame { background-image: url(http://localhost:4000/${plantilla.background_image_path.replace(/\\/g, '/')}); background-size: cover; background-repeat: no-repeat; }`
                        : ''
                    ]
                },
                panels: {
    defaults: [{
        id: 'basic-actions',
        buttons: [{
            id: 'save-db',
            className: 'gjs-btn-prim',
            label: 'Guardar Diseño',
            command: 'save-to-db',
        }]
    }]
},
                // ✅ 1. SE AÑADIÓ LA CONFIGURACIÓN DEL GESTOR DE BLOQUES
                blockManager: {
                    appendTo: '#blocks',
                    blocks: []
                },
            });

            const bm = editor.BlockManager;
            variables.forEach(variable => {
                bm.add(`variable-${variable.id}`, {
                    label: variable.label,
                    category: 'Variables',
                    media: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 50px; height: 50px;"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.22-1.05-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"></path></svg>`,
                    content: {
                        type: 'text',
                        content: `{{${variable.id}}}`,
                        attributes: { id: variable.id },
                        style: { position: 'absolute', padding: '5px', background: 'rgba(255,255,255,0.7)', borderRadius: '3px' }
                    }
                });
            });

             editor.Commands.add('save-to-db', {
                 run(editor) {
                     const disenoJSON = transformarParaBackend(editor.getComponents());
                     axios.post(`/plantillas/${plantillaId}/diseno`, disenoJSON)
                         .then(res => alert('¡Diseño guardado con éxito!'))
                         .catch(err => alert('Error al guardar el diseño.'));
                 }
             });
        };

        initializeEditor();

        return () => {
            if (editor) editor.destroy();
        };
    }, [plantilla, plantillaId]);

    function transformarParaBackend(components) {
        const placeholders = [];
        components.each(component => {
             const style = component.getStyle();
            if ((component.is('text') || component.is('default')) && component.getId()) {
                 placeholders.push({
                    campo: component.getId(),
                    x: parseInt(style.left) || 0,
                    y: parseInt(style.top) || 0,
                    fontSize: parseInt(style['font-size']) || 12,
                 });
            }
        });
        return { placeholders };
    }

    if (!plantilla) {
        return <div>Cargando plantilla...</div>;
    }

    return (
        <div>
            <h2>Diseñador Visual: {plantilla.nombre}</h2>
            
            <div className="designer-controls" style={{ padding: '10px', border: '1px solid #ddd', marginBottom: '10px' }}>
                <label htmlFor="background-upload">Subir Imagen de Fondo:</label>
                <input type="file" id="background-upload" onChange={handleBackgroundUpload} />
            </div>
            
            
            
            {/* ✅ 2. SE CORRIGIÓ LA ESTRUCTURA JSX */}
            <div style={{ display: 'flex', border: '2px solid #ccc', height: '80vh' }}>
                <div id="blocks" style={{ width: '250px', borderRight: '2px solid #ddd', padding: '5px' }}></div>
                <div ref={editorRef} style={{ flex: 1 }}></div>
            </div>
        </div>
    );
};

export default DiseñadorPlantilla;