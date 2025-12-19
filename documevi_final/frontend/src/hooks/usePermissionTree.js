import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Hook personalizado para gestionar un árbol de permisos interactivo.
 * Permite visualizar, buscar y modificar permisos organizados jerárquicamente
 * en grupos, módulos y acciones (ver, crear, editar, eliminar).
 * 
 * @param {Object} initialData - Estructura jerárquica de permisos disponibles
 * @param {Array} initialData.children - Grupos de permisos (ej: Gestión Documental, Administración)
 * @param {Array<number>} initialRolePerms - IDs de permisos que el rol ya tiene asignados
 * 
 * @returns {Object} Objeto con el árbol y funciones de manipulación
 * @returns {Object} returns.tree - Árbol filtrado de permisos
 * @returns {Function} returns.setSearchTerm - Función para filtrar por término de búsqueda
 * @returns {Function} returns.handleToggle - Expandir/colapsar nodos del árbol
 * @returns {Function} returns.handlePermissionChange - Toggle de un permiso individual
 * @returns {Function} returns.handleModuleChange - Toggle de todos los permisos de un módulo
 * @returns {Function} returns.getSelectedPermissionIds - Obtener IDs de permisos seleccionados
 * 
 * @example
 * const { tree, handlePermissionChange, getSelectedPermissionIds } = usePermissionTree(permisos, rolPermisos);
 */
export const usePermissionTree = (initialData, initialRolePerms) => {
    // Estado del árbol de permisos (se inicializa vacío hasta recibir datos)
    const [tree, setTree] = useState({ children: [] });
    // Término de búsqueda para filtrar permisos
    const [searchTerm, setSearchTerm] = useState('');

    // ============================================
    // INICIALIZACIÓN: Procesar datos cuando lleguen de la API
    // ============================================
    useEffect(() => {
        // Esperar a que lleguen todos los datos necesarios
        if (!initialData || !initialRolePerms) {
            return;
        }

        // Clonar datos para no mutar el original
        const dataWithInitialState = JSON.parse(JSON.stringify(initialData));

        // Marcar como habilitados los permisos que el rol ya tiene asignados
        if (dataWithInitialState.children) {
            dataWithInitialState.children.forEach(group => {
                if (group.children) {
                    group.children.forEach(module => {
                        if (module.permissions) {
                            // Iterar sobre cada acción del módulo (ver, crear, editar, eliminar)
                            for (const action in module.permissions) {
                                if (module.permissions[action] && 
                                    typeof module.permissions[action] === 'object' && 
                                    module.permissions[action].id) {
                                    const permId = module.permissions[action].id;
                                    // Si el rol tiene este permiso, marcarlo como habilitado
                                    if (initialRolePerms.includes(permId)) {
                                        module.permissions[action].enabled = true;
                                    }
                                }
                            }
                        }
                    });
                }
            });
        }
        
        // Actualizar el estado con los datos procesados
        setTree(dataWithInitialState);

    }, [initialData, initialRolePerms]); // Re-ejecutar cuando cambien los datos iniciales


    // ============================================
    // HANDLERS DE INTERACCIÓN
    // ============================================

    /**
     * Expande o colapsa un nodo del árbol (grupo o módulo).
     * @param {string} nodeId - ID del nodo a expandir/colapsar
     */
    const handleToggle = useCallback((nodeId) => {
        setTree(prevTree => {
            const newTree = JSON.parse(JSON.stringify(prevTree));
            
            // Función recursiva para encontrar y alternar el nodo
            const findAndToggle = (nodes) => {
                for (const node of nodes) {
                    if (node.id === nodeId) {
                        node.expanded = !node.expanded;
                        return true;
                    }
                    if (node.children && findAndToggle(node.children)) return true;
                }
                return false;
            };
            
            findAndToggle(newTree.children);
            return newTree;
        });
    }, []);

    /**
     * Alterna el estado de un permiso individual (checkbox).
     * @param {string} moduleId - ID del módulo que contiene el permiso
     * @param {string} action - Nombre de la acción (ver, crear, editar, eliminar)
     */
    const handlePermissionChange = useCallback((moduleId, action) => {
        setTree(prevTree => {
            const newTree = JSON.parse(JSON.stringify(prevTree));
            
            // Función recursiva para encontrar el módulo y cambiar el permiso
            const findAndChange = (nodes) => {
                if (!nodes) return false;
                for (const node of nodes) {
                    if (node.id === moduleId) {
                        // Validar que el permiso existe antes de modificarlo
                        if (node.permissions && node.permissions[action] && typeof node.permissions[action] === 'object') {
                            node.permissions[action].enabled = !node.permissions[action].enabled;
                            return true;
                        }
                        return false;
                    }
                    if (node.children && findAndChange(node.children)) return true;
                }
                return false;
            };
            
            // Buscar en todos los grupos
            if (newTree.children) {
                newTree.children.some(group => group.children && findAndChange(group.children));
            }
            return newTree;
        });
    }, []);

    /**
     * Alterna todos los permisos de un módulo (seleccionar/deseleccionar todos).
     * Si todos están habilitados, los deshabilita. Si alguno está deshabilitado, habilita todos.
     * @param {string} moduleId - ID del módulo
     */
    const handleModuleChange = useCallback((moduleId) => {
        setTree(prevTree => {
            const newTree = JSON.parse(JSON.stringify(prevTree));
            let moduleNode = null;
            
            // Función recursiva para encontrar el módulo
            const findModule = (nodes) => {
                for (const node of nodes) {
                    if (node.id === moduleId) {
                        moduleNode = node;
                        return true;
                    }
                    if (node.children && findModule(node.children)) return true;
                }
                return false;
            };
            
            newTree.children.some(group => findModule(group.children));

            if (moduleNode && moduleNode.permissions) {
                // Verificar si todos los permisos están habilitados
                const areAllEnabled = Object.values(moduleNode.permissions).every(p => p && p.enabled);
                // Alternar: si todos están habilitados, deshabilitar todos; sino, habilitar todos
                for (const action in moduleNode.permissions) {
                    if (moduleNode.permissions[action] && typeof moduleNode.permissions[action] === 'object') {
                        moduleNode.permissions[action].enabled = !areAllEnabled;
                    }
                }
            }
            return newTree;
        });
    }, []);

    /**
     * Recolecta los IDs de todos los permisos actualmente seleccionados.
     * Útil para enviar al backend al guardar los cambios del rol.
     * @returns {Array<number>} Array de IDs de permisos habilitados
     */
    const getSelectedPermissionIds = useCallback(() => {
        const selectedIds = [];
        
        // Función recursiva para recolectar permisos habilitados
        const collect = (nodes) => {
            if (!nodes) return;
            nodes.forEach(node => {
                if (node.permissions) {
                    for (const action in node.permissions) {
                        // Verificar que el permiso existe, está habilitado y tiene ID
                        if (node.permissions[action] && 
                            typeof node.permissions[action] === 'object' && 
                            node.permissions[action].enabled && 
                            node.permissions[action].id) {
                            selectedIds.push(node.permissions[action].id);
                        }
                    }
                }
                // Continuar recursivamente con los hijos
                if (node.children) {
                    collect(node.children);
                }
            });
        };
        
        collect(tree.children);
        return selectedIds;
    }, [tree]);

    // ============================================
    // FILTRADO: Árbol filtrado por término de búsqueda
    // ============================================
    /**
     * Árbol filtrado según el término de búsqueda.
     * Filtra por nombre de módulo o nombre de acción.
     * Memorizado para evitar recálculos innecesarios.
     */
    const filteredTree = useMemo(() => {
        // Si no hay búsqueda, retornar árbol completo
        if (!searchTerm) return tree;
        
        const newTree = JSON.parse(JSON.stringify(tree));
        const term = searchTerm.toLowerCase();

        // Filtrar grupos y módulos que coincidan con el término
        newTree.children = newTree.children.map(group => {
            if (group.children) {
                // Filtrar módulos por nombre o por nombre de acción
                group.children = group.children.filter(module => 
                    module.name.toLowerCase().includes(term) ||
                    Object.keys(module.permissions).some(action => action.toLowerCase().includes(term))
                );
            }
            // Mantener grupo si su nombre coincide o tiene módulos que coinciden
            if (group.name.toLowerCase().includes(term) || (group.children && group.children.length > 0)) {
                group.expanded = true; // Auto-expandir grupos con resultados
                return group;
            }
            return null;
        }).filter(Boolean); // Eliminar grupos vacíos (null)
        
        return newTree;
    }, [tree, searchTerm]);

    // Retornar árbol filtrado y todas las funciones de manipulación
    return { 
        tree: filteredTree, 
        setSearchTerm, 
        handleToggle, 
        handlePermissionChange, 
        handleModuleChange,
        getSelectedPermissionIds 
    };
};