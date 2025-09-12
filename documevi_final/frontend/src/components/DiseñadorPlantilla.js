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

    // Este useEffect se encarga de buscar los datos iniciales
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

    // Este es TU useEffect, el corazón del componente, que crea y actualiza el editor
    useEffect(() => {
        // Solo se ejecuta si la plantilla ya se cargó y el div del editor está listo
        if (!plantilla || !editorContainerRef.current) {
            return;
        }

        // Si ya hay un editor, lo destruimos para empezar de cero
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
        });

        // Añadimos el comando de guardado DESPUÉS de inicializar
        editor.Commands.add('save-to-db', {
            run(editor) {
                const disenoJSON = editor.getComponents().toJSON();
                axios.post(`/plantillas/${plantillaId}/diseno`, disenoJSON)
                    .then(res => alert('¡Diseño guardado!'))
                    .catch(err => alert('Error al guardar.'));
            }
        });

        // Cargamos el diseño guardado, si existe
        if (plantilla.diseño_json) {
            try {
                const disenoGuardado = JSON.parse(plantilla.diseño_json);
                if (disenoGuardado && disenoGuardado.length) {
                    editor.setComponents(disenoGuardado);
                }
            } catch (e) { 
                console.error("Error al cargar diseño guardado:", e); 
            }
        }

        // Cargamos los bloques de variables
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