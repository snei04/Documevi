import { useRef, useEffect } from 'react';
import grapesjs from 'grapesjs';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import 'grapesjs/dist/css/grapes.min.css';
import api from '../api/axios';
import { toast } from 'react-toastify';

// Opcional: Extraer la configuración a una constante para mayor limpieza
const getGrapesJSConfig = () => ({
    height: '100%',
    width: 'auto',
    storageManager: false,
    fromElement: false,
    plugins: [gjsBlocksBasic],
    pluginsOpts: {
        [gjsBlocksBasic]: {
            blocks: ['column1', 'column2', 'column3', 'text', 'link', 'image'],
            flexGrid: true,
            category: 'Básicos'
        }
    },
    blockManager: { appendTo: '#blocks' },
    styleManager: {
        sectors: [
            { name: 'Dimensiones', open: false, properties: ['width', 'height', 'padding', 'margin'] },
            { name: 'Tipografía', open: false, properties: ['font-size', 'font-weight', 'color', 'text-align'] },
            { name: 'Decoración', open: false, properties: ['background-color', 'border', 'border-radius'] }
        ]
    },
    deviceManager: {
        devices: [
            { name: 'Desktop', width: '' },
            { name: 'Tablet', width: '768px', widthMedia: '992px' },
            { name: 'Mobile', width: '320px', widthMedia: '480px' }
        ]
    }
});

/**
 * Custom Hook para encapsular toda la lógica de GrapesJS.
 * @param {object} plantilla - El objeto de la plantilla cargada.
 * @param {Array} variables - La lista de variables de la plantilla.
 */
export const useGrapesJSEditor = (plantilla, variables) => {
    const editorContainerRef = useRef(null);
    const editorInstance = useRef(null);

    useEffect(() => {
        if (!plantilla || !variables.length || !editorContainerRef.current || editorInstance.current) {
            return;
        }

        const editor = grapesjs.init({
            container: editorContainerRef.current,
            ...getGrapesJSConfig(),
        });

        // 1. Agregar Bloques de Variables
        variables.forEach(variable => {
            editor.BlockManager.add(`variable-${variable.id}`, {
                label: `Var: ${variable.label}`,
                category: 'Variables',
                content: `<span class="variable-placeholder">{{${variable.id}}}</span>`,
            });
        });

        // 2. Comando para Guardar
        editor.Commands.add('save-to-db', {
            run: async (editor) => {
                try {
                    const designData = {
                        ...editor.getProjectData(),
                        html: editor.getHtml(),
                        css: editor.getCss(),
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

        // 3. Paneles y Botones
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
        
        // 4. Cargar Diseño Existente
        if (plantilla.diseño_json) {
            try {
                const disenoGuardado = JSON.parse(plantilla.diseño_json);
                if (disenoGuardado.components) {
                    editor.loadProjectData(disenoGuardado);
                } else {
                    editor.setComponents(disenoGuardado.html || '');
                    editor.setStyle(disenoGuardado.css || '');
                }
            } catch (e) {
                console.warn("No se pudo parsear el diseño existente:", e);
            }
        }

        editorInstance.current = editor;

        // Función de limpieza para destruir la instancia al desmontar el componente
        return () => {
            if (editorInstance.current) {
                editorInstance.current.destroy();
                editorInstance.current = null;
            }
        };
    }, [plantilla, variables]); // Dependencias clave para la inicialización

    return editorContainerRef;
};