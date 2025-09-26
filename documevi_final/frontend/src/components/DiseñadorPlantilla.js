import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';

// Usaremos el GrapesJS básico que nos ha dado el mejor resultado
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

const DiseñadorPlantilla = () => {
    // --- 1. ESTADOS Y REFERENCIAS ---
    const { id: plantillaId } = useParams();
    const editorContainerRef = useRef(null);
    const editorInstance = useRef(null);
    const isEditorInitialized = useRef(false);
    const [plantilla, setPlantilla] = useState(null);
    const [variables, setVariables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editorError, setEditorError] = useState(null);

    // --- 2. FUNCIÓN DE LIMPIEZA COMPLETA ---
    const cleanupEditor = useCallback(() => {
        if (editorInstance.current) {
            try {
                // Detener todos los eventos antes de destruir
                editorInstance.current.stopCommand('*');
                editorInstance.current.destroy();
            } catch (error) {
                console.warn('Error al limpiar el editor:', error);
            }
            
            editorInstance.current = null;
            isEditorInitialized.current = false;
        }

        // Limpiar completamente el contenedor
        if (editorContainerRef.current) {
            editorContainerRef.current.innerHTML = '';
        }
    }, []);

    // --- 3. FUNCIÓN ULTRA-SIMPLIFICADA PARA INICIALIZAR EL EDITOR ---
    const initializeEditor = useCallback(() => {
        if (!plantilla || !editorContainerRef.current || isEditorInitialized.current) {
            return;
        }

        cleanupEditor();
        setEditorError(null);

        try {
            console.log('Inicializando editor con configuración minimal...');

            // Configuración absolutamente mínima - SIN PLUGINS
            const editor = grapesjs.init({
                container: editorContainerRef.current,
                
                // Configuración ultra-básica
                height: '100%',
                width: 'auto',
                storageManager: false,
                fromElement: false,
                undoManager: false, // Desactivar undo manager
                
                // NO usar plugins que puedan causar problemas
                plugins: [], // Sin plugins
                
                // Desactivar TODOS los managers problemáticos
                layerManager: false,
                traitManager: false, 
                selectorManager: false,
                styleManager: false,
                
                // Canvas mínimo
                canvas: {
                    styles: [],
                    scripts: [],
                    customBadgeLabel: false,
                },
                
                // Block manager manual
                blockManager: {
                    appendTo: '#blocks',
                    blocks: []
                },
                
                // Paneles mínimos
                panels: {
                    defaults: []
                },
                
                // Device manager básico
                deviceManager: {
                    devices: [{
                        name: 'Desktop',
                        width: ''
                    }]
                },

                // Configuraciones adicionales para estabilidad
                richTextEditor: false, // Sin editor de texto enriquecido
                showOffsets: false,
                showOffsetsSelected: false,
                noticeOnUnload: false,
            });

            console.log('Editor base inicializado');

            // Agregar bloques básicos manualmente (sin plugin)
            const bm = editor.BlockManager;
            
            // Bloque de texto básico
            bm.add('text-block', {
                label: 'Texto',
                category: 'Básicos',
                content: '<div style="padding: 10px;">Escribe tu texto aquí</div>',
                attributes: { class: 'text-block' }
            });

            // Bloque de imagen básico
            bm.add('image-block', {
                label: 'Imagen',
                category: 'Básicos', 
                content: '<img src="https://via.placeholder.com/300x200" alt="Imagen" style="max-width: 100%; height: auto;">',
                attributes: { class: 'image-block' }
            });

            // Bloque contenedor
            bm.add('container-block', {
                label: 'Contenedor',
                category: 'Básicos',
                content: '<div style="padding: 20px; border: 1px solid #ddd; margin: 10px;">Contenedor</div>',
                attributes: { class: 'container-block' }
            });

            // Agregar bloques de variables
            variables.forEach(variable => {
                bm.add(`variable-${variable.id}`, {
                    label: variable.label,
                    category: 'Variables',
                    content: `<span style="padding: 6px 12px; border: 2px dashed #007bff; background: #e3f2fd; display: inline-block; margin: 2px; border-radius: 4px; font-weight: bold; color: #1976d2;">{{${variable.id}}}</span>`,
                    attributes: { 
                        class: 'variable-block',
                        'data-variable-id': variable.id 
                    }
                });
            });

            // Panel de acciones básico
            const pn = editor.Panels;
            pn.addPanel({
                id: 'basic-actions',
                buttons: [{
                    id: 'save-db',
                    className: 'gjs-btn-prim',
                    label: 'Guardar Diseño',
                    command: 'save-to-db',
                    attributes: { title: 'Guardar el diseño actual' }
                }]
            });

            // Comando de guardado simplificado
            editor.Commands.add('save-to-db', {
                run(editor) {
                    try {
                        const html = editor.getHtml();
                        const css = editor.getCss();
                        
                        const designData = {
                            html: html,
                            css: css,
                            timestamp: new Date().toISOString()
                        };
                        
                        api.post(`/plantillas/${plantillaId}/diseno`, designData)
                            .then(() => {
                                toast.success('¡Diseño guardado correctamente!');
                                console.log('Diseño guardado:', designData);
                            })
                            .catch((err) => {
                                console.error('Error al guardar:', err);
                                toast.error('Error al guardar el diseño.');
                            });
                    } catch (error) {
                        console.error('Error en el comando de guardado:', error);
                        toast.error('Error al preparar los datos para guardar.');
                    }
                }
            });

            // Cargar contenido existente después de un delay
            setTimeout(() => {
                try {
                    if (plantilla.diseño_json) {
                        const disenoGuardado = JSON.parse(plantilla.diseño_json);
                        if (disenoGuardado.html) {
                            editor.setComponents(disenoGuardado.html);
                        }
                        if (disenoGuardado.css) {
                            editor.setStyle(disenoGuardado.css);
                        }
                        console.log('Diseño existente cargado');
                    }
                } catch (e) {
                    console.warn("No se pudo cargar el diseño existente:", e);
                }
            }, 1500);

            // Event listeners mínimos
            editor.on('component:selected', () => {
                console.log('Componente seleccionado');
            });

            editor.on('component:deselected', () => {
                console.log('Componente deseleccionado');
            });

            // Solo manejar errores críticos
            editor.on('error', (error) => {
                console.error('Error crítico en GrapesJS:', error);
            });

            editorInstance.current = editor;
            isEditorInitialized.current = true;
            
            console.log('Editor inicializado completamente sin LayerManager');

        } catch (error) {
            console.error('Error al inicializar el editor:', error);
            setEditorError('Error al inicializar el editor');
            toast.error('Error al inicializar el editor visual.');
        }

    }, [plantilla, variables, plantillaId, cleanupEditor]);

    // --- 4. CARGAR DATOS INICIALES ---
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!plantillaId) return;
            
            setIsLoading(true);
            setEditorError(null);
            
            try {
                console.log('Cargando datos para plantilla:', plantillaId);
                
                const [plantillaRes, variablesRes] = await Promise.all([
                    api.get(`/plantillas/${plantillaId}`),
                    api.get(`/plantillas/${plantillaId}/variables`)
                ]);
                
                console.log('Datos cargados:', {
                    plantilla: plantillaRes.data,
                    variables: variablesRes.data
                });
                
                setPlantilla(plantillaRes.data);
                setVariables(variablesRes.data);
            } catch (error) {
                console.error("Error al cargar datos iniciales:", error);
                setEditorError('Error al cargar los datos de la plantilla');
                toast.error("Error al cargar datos iniciales.");
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchInitialData();
    }, [plantillaId]);

    // --- 5. INICIALIZAR EDITOR CON DELAY MAYOR ---
    useEffect(() => {
        if (!isLoading && plantilla && !isEditorInitialized.current && !editorError) {
            console.log('Preparando inicialización del editor...');
            
            const timer = setTimeout(() => {
                initializeEditor();
            }, 1000); // Delay más largo

            return () => clearTimeout(timer);
        }
    }, [isLoading, plantilla, editorError, initializeEditor]);

    // --- 6. CLEANUP AL DESMONTAR ---
    useEffect(() => {
        return () => {
            console.log('Limpiando editor al desmontar componente');
            cleanupEditor();
        };
    }, [cleanupEditor]);

    // --- 7. RENDERIZADO ---
    if (isLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50vh',
                fontSize: '16px',
                gap: '10px'
            }}>
                <div>🔄 Cargando diseñador...</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                    Preparando el entorno de diseño visual
                </div>
            </div>
        );
    }

    if (editorError) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50vh',
                gap: '15px'
            }}>
                <div style={{ fontSize: '18px', color: '#d32f2f' }}>
                    ⚠️ {editorError}
                </div>
                <button 
                    onClick={() => {
                        console.log('Reintentando inicialización...');
                        setEditorError(null);
                        cleanupEditor();
                        setTimeout(() => initializeEditor(), 100);
                    }}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    🔄 Reintentar
                </button>
            </div>
        );
    }

    if (!plantilla) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50vh',
                color: '#d32f2f',
                fontSize: '16px'
            }}>
                ❌ Error: No se pudo cargar la plantilla
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
                padding: '16px', 
                borderBottom: '2px solid #e0e0e0',
                backgroundColor: '#f5f5f5',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ 
                    margin: 0, 
                    color: '#1976d2',
                    fontSize: '20px',
                    fontWeight: 'bold'
                }}>
                    🎨 Diseñador Visual: {plantilla.nombre}
                </h2>
                <div style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginTop: '6px' 
                }}>
                    📋 Arrastra elementos desde el panel izquierdo • 💾 Guarda tu progreso regularmente
                </div>
            </div>
            
            <div style={{ 
                display: 'flex', 
                flex: 1,
                minHeight: 0
            }}>
                <div 
                    id="blocks" 
                    style={{ 
                        width: '300px',
                        borderRight: '2px solid #e0e0e0',
                        overflow: 'auto',
                        backgroundColor: '#fafafa'
                    }}
                />
                
                <div 
                    ref={editorContainerRef} 
                    style={{ 
                        flex: 1,
                        position: 'relative',
                        backgroundColor: '#ffffff'
                    }}
                />
            </div>
        </div>
    );
};

export default DiseñadorPlantilla;