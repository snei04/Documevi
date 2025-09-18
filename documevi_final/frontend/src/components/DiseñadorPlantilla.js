import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

// Importaciones del nuevo SDK de GrapesJS Studio
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { presetPrintable, canvasFullSize } from '@grapesjs/studio-sdk-plugins';

const DiseñadorPlantilla = () => {
    // --- 1. ESTADO Y REFERENCIAS ---
    const { id: plantillaId } = useParams();
    const [plantilla, setPlantilla] = useState(null);
    const [variables, setVariables] = useState([]);
    const [editorOptions, setEditorOptions] = useState(null);

    // --- 2. CARGA DE DATOS Y CONFIGURACIÓN DEL EDITOR ---
    useEffect(() => {
        const fetchAndConfigure = async () => {
            if (!plantillaId) return;
            try {
                // Hacemos las dos peticiones en paralelo para buscar datos
                const [plantillaRes, variablesRes] = await Promise.all([
                    api.get(`/plantillas/${plantillaId}`),
                    api.get(`/plantillas/${plantillaId}/variables`)
                ]);
                const plantillaData = plantillaRes.data;
                const variablesData = variablesRes.data;
                
                // Guardamos los datos en el estado
                setPlantilla(plantillaData);
                setVariables(variablesData);

                // Intentamos cargar el diseño guardado. Si no existe, usamos una plantilla HTML vacía.
                let savedHtml = '<body></body>';
                let savedCss = '';
                if (plantillaData.diseño_json) {
                    try {
                        const disenoGuardado = JSON.parse(plantillaData.diseño_json);
                        savedHtml = disenoGuardado.html || '<body></body>';
                        savedCss = disenoGuardado.css || '';
                    } catch (e) {
                        console.error("Diseño guardado tiene un formato inválido:", e);
                    }
                }

                // Creamos el objeto de configuración para el editor
                const options = {
                    plugins: [
                        presetPrintable,
                        canvasFullSize,
                    ],
                    project: {
                        type: 'document',
                        default: {
                            pages: [{
                                name: plantillaData.nombre,
                                component: `<!DOCTYPE html><html><style>${savedCss}</style>${savedHtml}</html>`,
                            }]
                        }
                    },
                    layout: {
                        default: {
                            type: 'row',
                            height: '100%',
                            children: [
                                { type: 'sidebarLeft' }, // Panel izquierdo para bloques, etc.
                                {
                                    type: 'canvasSidebarTop',
                                    sidebarTop: {
                                        rightContainer: {
                                            buttons: ({ items }) => [
                                                {
                                                    id: 'save-db',
                                                    icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4m-5 16a3 3 0 0 1-3-3a3 3 0 0 1 3 3a3 3 0 0 1 3 3a3 3 0 0 1-3 3m3-10H5V5h10v4Z"/></svg>',
                                                    label: 'Guardar',
                                                    onClick: async ({ editor }) => {
                                                        const html = editor.getHtml();
                                                        const css = editor.getCss();
                                                        const dataToSave = { html, css };
                                                        try {
                                                            await api.post(`/plantillas/${plantillaId}/diseno`, dataToSave);
                                                            toast.success('¡Diseño guardado!');
                                                        } catch (err) {
                                                            toast.error('Error al guardar el diseño.');
                                                        }
                                                    }
                                                },
                                                ...items.filter(item => !['showImportCode', 'fullscreen'].includes(item.id))
                                            ]
                                        }
                                    }
                                },
                                { type: 'sidebarRight' } // Panel derecho para estilos
                            ]
                        }
                    },
                };
                
                setEditorOptions(options);

            } catch (error) {
                console.error("Error al cargar la plantilla", error);
                toast.error("No se pudo cargar la plantilla.");
            }
        };
        fetchAndConfigure();
    }, [plantillaId]);

    // --- 3. FUNCIÓN PARA MANIPULAR EL EDITOR CUANDO ESTÉ LISTO ---
    const onEditorReady = (editor) => {
        if (!variables.length) return;

        const bm = editor.BlockManager;

        // Añadimos las variables personalizadas al panel de bloques
        variables.forEach(variable => {
            // Verificamos si el bloque ya existe para no duplicarlo
            if (!bm.get(`variable-${variable.id}`)) {
                bm.add(`variable-${variable.id}`, {
                    label: variable.label,
                    category: 'Variables', // Aparecerán en su propia categoría
                    content: {
                        type: 'text',
                        content: `{{${variable.id}}}`,
                        attributes: { id: variable.id }, // Usamos el ID para la generación del PDF
                        style: { padding: '5px' }
                    }
                });
            }
        });
    };

    // --- 4. RENDERIZADO DEL COMPONENTE ---
    if (!editorOptions || !plantilla) {
        return <div>Cargando diseñador...</div>;
    }

    return (
        <div style={{ height: 'calc(100vh - 50px)' }}>
            <h2>Diseñador Visual: {plantilla.nombre}</h2>
            <StudioEditor options={editorOptions} onEditor={onEditorReady} />
        </div>
    );
};

export default DiseñadorPlantilla;