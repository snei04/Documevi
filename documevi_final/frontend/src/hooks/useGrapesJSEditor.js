import { useRef, useEffect } from 'react';
import grapesjs from 'grapesjs';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import 'grapesjs/dist/css/grapes.min.css';
import api from '../api/axios';
import { toast } from 'react-toastify';

/**
 * Genera la configuración base para el editor GrapesJS.
 * Configura plugins, bloques básicos, estilos y dispositivos responsivos.
 * 
 * @returns {Object} Objeto de configuración para grapesjs.init()
 */
const getGrapesJSConfig = () => ({
    height: '100%',
    width: 'auto',
    storageManager: false,      // Desactivar almacenamiento automático (se guarda manualmente)
    fromElement: false,         // No cargar contenido desde el elemento HTML
    plugins: [gjsBlocksBasic],  // Plugin de bloques básicos (columnas, texto, imagen, etc.)
    pluginsOpts: {
        [gjsBlocksBasic]: {
            blocks: ['column1', 'column2', 'column3', 'text', 'link', 'image'], // Bloques disponibles
            flexGrid: true,     // Usar flexbox para el sistema de grillas
            category: 'Básicos' // Nombre de la categoría en el panel de bloques
        }
    },
    blockManager: { appendTo: '#blocks' }, // Contenedor donde se renderizan los bloques arrastrables
    styleManager: {
        // Sectores de estilos disponibles en el panel de estilos
        sectors: [
            { name: 'Dimensiones', open: false, properties: ['width', 'height', 'padding', 'margin'] },
            { name: 'Tipografía', open: false, properties: ['font-size', 'font-weight', 'color', 'text-align'] },
            { name: 'Decoración', open: false, properties: ['background-color', 'border', 'border-radius'] }
        ]
    },
    deviceManager: {
        // Dispositivos para vista previa responsiva
        devices: [
            { name: 'Desktop', width: '' },                              // Ancho completo
            { name: 'Tablet', width: '768px', widthMedia: '992px' },     // Vista tablet
            { name: 'Mobile', width: '320px', widthMedia: '480px' }      // Vista móvil
        ]
    }
});

/**
 * Hook personalizado para encapsular toda la lógica del editor visual GrapesJS.
 * Inicializa el editor, configura bloques de variables dinámicas, comandos de guardado
 * y carga diseños existentes de la plantilla.
 * 
 * @param {Object} plantilla - Objeto de la plantilla a editar
 * @param {number} plantilla.id - ID de la plantilla para guardar cambios
 * @param {string} [plantilla.diseño_json] - JSON del diseño guardado previamente
 * @param {Array} variables - Lista de variables disponibles para insertar en la plantilla
 * @param {string} variables[].id - Identificador único de la variable (ej: 'nombre_usuario')
 * @param {string} variables[].label - Etiqueta visible de la variable (ej: 'Nombre del Usuario')
 * 
 * @returns {React.RefObject} Referencia al contenedor DOM donde se monta el editor
 * 
 * @example
 * const editorRef = useGrapesJSEditor(plantilla, variables);
 * return <div ref={editorRef} />;
 */
export const useGrapesJSEditor = (plantilla, variables) => {
    // Referencia al elemento DOM contenedor del editor
    const editorContainerRef = useRef(null);
    // Referencia a la instancia del editor GrapesJS (para limpieza)
    const editorInstance = useRef(null);

    useEffect(() => {
        // Validar que existan todos los requisitos antes de inicializar
        // También evita re-inicializar si ya existe una instancia
        if (!plantilla || !variables.length || !editorContainerRef.current || editorInstance.current) {
            return;
        }

        // Inicializar el editor GrapesJS con la configuración base
        const editor = grapesjs.init({
            container: editorContainerRef.current,
            ...getGrapesJSConfig(),
        });

        // ============================================
        // 1. BLOQUES DE VARIABLES DINÁMICAS
        // ============================================
        // Crear un bloque arrastrable por cada variable de la plantilla
        // Al arrastrar, inserta un placeholder con formato {{variable_id}}
        variables.forEach(variable => {
            editor.BlockManager.add(`variable-${variable.id}`, {
                label: `Var: ${variable.label}`,
                category: 'Variables',
                content: `<span class="variable-placeholder">{{${variable.id}}}</span>`,
            });
        });

        // ============================================
        // 2. COMANDO DE GUARDADO EN BASE DE DATOS
        // ============================================
        // Comando personalizado que guarda el diseño completo en el servidor
        editor.Commands.add('save-to-db', {
            run: async (editor) => {
                try {
                    // Recopilar todos los datos del diseño: proyecto, HTML y CSS
                    const designData = {
                        ...editor.getProjectData(),  // Datos del proyecto (componentes, estilos, etc.)
                        html: editor.getHtml(),      // HTML generado
                        css: editor.getCss(),        // CSS generado
                    };
                    
                    toast.info('Guardando diseño...');
                    await api.post(`/plantillas/${plantilla.id}/diseno`, designData);
                    toast.success('¡Diseño guardado correctamente!');
                } catch (err) {
                    console.error('Error al guardar:', err);
                    toast.error('Error al guardar el diseño.');
                }
            }
        });

        // ============================================
        // 3. PANEL DE ACCIONES CON BOTÓN DE GUARDAR
        // ============================================
        // Agregar panel con botón que ejecuta el comando de guardado
        editor.Panels.addPanel({
            id: 'basic-actions',
            el: '.panel__basic-actions',
            buttons: [{
                id: 'save-db',
                className: 'gjs-btn-prim',
                label: '💾 Guardar',
                command: 'save-to-db',
            }],
        });
        
        // ============================================
        // 4. CARGAR DISEÑO EXISTENTE (SI EXISTE)
        // ============================================
        // Si la plantilla tiene un diseño guardado, cargarlo en el editor
        if (plantilla.diseño_json) {
            try {
                const disenoGuardado = JSON.parse(plantilla.diseño_json);
                if (disenoGuardado.components) {
                    // Formato nuevo: cargar proyecto completo con componentes
                    editor.loadProjectData(disenoGuardado);
                } else {
                    // Formato legacy: cargar solo HTML y CSS
                    editor.setComponents(disenoGuardado.html || '');
                    editor.setStyle(disenoGuardado.css || '');
                }
            } catch (e) {
                console.warn("No se pudo parsear el diseño existente:", e);
            }
        }

        // Guardar referencia a la instancia para limpieza posterior
        editorInstance.current = editor;

        // ============================================
        // CLEANUP: Destruir instancia al desmontar
        // ============================================
        // Evita memory leaks y conflictos al re-renderizar
        return () => {
            if (editorInstance.current) {
                editorInstance.current.destroy();
                editorInstance.current = null;
            }
        };
    }, [plantilla, variables]); // Re-ejecutar si cambia la plantilla o las variables

    return editorContainerRef;
};