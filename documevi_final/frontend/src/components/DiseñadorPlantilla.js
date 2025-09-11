import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axios';

import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsBlocksBasic from 'grapesjs-blocks-basic';

const DiseñadorPlantilla = () => {
    const { id: plantillaId } = useParams();
    const editorContainerRef = useRef(null);
    const editorInstance = useRef(null);
    const [plantilla, setPlantilla] = useState(null);
    const [variables, setVariables] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!plantillaId) return;
            try {
                const [plantillaRes, variablesRes] = await Promise.all([
                    axios.get(`/plantillas/${plantillaId}`),
                    axios.get(`/plantillas/${plantillaId}/variables`)
                ]);
                setPlantilla(plantillaRes.data);
                setVariables(variablesRes.data);
            } catch (error) {
                console.error("Error al cargar datos iniciales", error);
            }
        };
        fetchInitialData();
    }, [plantillaId]);

    useEffect(() => {
        if (!plantilla || !editorContainerRef.current) {
            return;
        }

        if (editorInstance.current) {
            editorInstance.current.destroy();
        }

        const editor = grapesjs.init({
            container: editorContainerRef.current,
            storageManager: false,
            plugins: [gjsBlocksBasic],
            blockManager: { appendTo: '#blocks' },
            styleManager: {
                sectors: [{
                    name: 'Posición', open: true,
                    properties: [
                        { property: 'position', type: 'select', defaults: 'absolute', options: [{ value: 'absolute', name: 'Absoluto' }] },
                        { property: 'top' }, { property: 'left' }
                    ]
                }]
            },
            panels: {
                defaults: [{
                    id: 'basic-actions',
                    buttons: [{ id: 'save-db', className: 'gjs-btn-prim', label: 'Guardar Diseño', command: 'save-to-db' }],
                }],
            },
            commands: {
                add: {
                    'save-to-db': {
                        run(editor) {
                            const disenoJSON = transformarParaBackend(editor.getComponents());
                            axios.post(`/plantillas/${plantillaId}/diseno`, disenoJSON)
                                .then(res => alert('¡Diseño guardado!'))
                                .catch(err => alert('Error al guardar.'));
                        }
                    }
                }
            }
        });

        const bm = editor.BlockManager;
        variables.forEach(variable => {
            bm.add(`variable-${variable.id}`, {
                label: variable.label,
                category: 'Variables',
                content: {
                    type: 'text',
                    content: `{{${variable.id}}}`,
                    attributes: { id: variable.id },
                    style: { position: 'absolute', padding: '5px' }
                }
            });
        });

        editorInstance.current = editor;

    }, [plantilla, variables, plantillaId]);

    const transformarParaBackend = (components) => {
        const placeholders = [];
        components.each(component => {
            const style = component.getStyle();
            if (component.getId()) {
                placeholders.push({
                    campo: component.getId(),
                    x: parseInt(style.left) || 0,
                    y: parseInt(style.top) || 0,
                    fontSize: parseInt(style['font-size']) || 12,
                });
            }
        });
        return { placeholders };
    };

    if (!plantilla) {
        return <div>Cargando diseñador...</div>;
    }

    return (
        <div>
            <h2>Diseñador Visual: {plantilla.nombre}</h2>
            <div style={{ display: 'flex', border: '2px solid #ccc', height: '80vh' }}>
                <div id="blocks" style={{ width: '250px' }}></div>
                <div ref={editorContainerRef} style={{ flex: 1 }}></div>
            </div>
        </div>
    );
};

export default DiseñadorPlantilla;