
import { useState, useEffect, useMemo, useCallback } from 'react';

export const usePermissionTree = (initialData, initialRolePerms) => {
    // 1. El estado ahora se inicializa vacío.
    const [tree, setTree] = useState({ children: [] });
    const [searchTerm, setSearchTerm] = useState('');

    // 2. Usamos useEffect para reaccionar cuando los datos de la API lleguen.
    useEffect(() => {
        // Solo procedemos si tenemos todos los datos necesarios.
        if (!initialData || !initialRolePerms) {
            return;
        }

        const dataWithInitialState = JSON.parse(JSON.stringify(initialData));

        // Marcamos los checkboxes correspondientes a los permisos que el rol ya tiene.
        if (dataWithInitialState.children) {
            dataWithInitialState.children.forEach(group => {
                if (group.children) {
                    group.children.forEach(module => {
                        for (const action in module.permissions) {
                            const permId = module.permissions[action].id;
                            if (initialRolePerms.includes(permId)) {
                                module.permissions[action].enabled = true;
                            }
                        }
                    });
                }
            });
        }
        
        // 3. Actualizamos el estado del árbol con los datos procesados.
        setTree(dataWithInitialState);

    }, [initialData, initialRolePerms]); // Este efecto se ejecuta solo cuando los datos iniciales cambian.


    // --- El resto de las funciones de interacción ---

    const handleToggle = useCallback((nodeId) => {
        setTree(prevTree => {
            const newTree = JSON.parse(JSON.stringify(prevTree));
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

    const handlePermissionChange = useCallback((moduleId, action) => {
        setTree(prevTree => {
            const newTree = JSON.parse(JSON.stringify(prevTree));
            const findAndChange = (nodes) => {
                for (const node of nodes) {
                    if (node.id === moduleId) {
                        node.permissions[action].enabled = !node.permissions[action].enabled;
                        return true;
                    }
                    if (node.children && findAndChange(node.children)) return true;
                }
                return false;
            };
            newTree.children.some(group => findAndChange(group.children));
            return newTree;
        });
    }, []);

    const handleModuleChange = useCallback((moduleId) => {
        setTree(prevTree => {
            const newTree = JSON.parse(JSON.stringify(prevTree));
            let moduleNode = null;
            
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

            if (moduleNode) {
                const areAllEnabled = Object.values(moduleNode.permissions).every(p => p.enabled);
                for (const action in moduleNode.permissions) {
                    moduleNode.permissions[action].enabled = !areAllEnabled;
                }
            }
            return newTree;
        });
    }, []);

    const getSelectedPermissionIds = useCallback(() => {
        const selectedIds = [];
        const collect = (nodes) => {
            if (!nodes) return;
            nodes.forEach(node => {
                if (node.permissions) {
                    for (const action in node.permissions) {
                        if (node.permissions[action].enabled) {
                            selectedIds.push(node.permissions[action].id);
                        }
                    }
                }
                if (node.children) {
                    collect(node.children);
                }
            });
        };
        collect(tree.children);
        return selectedIds;
    }, [tree]);

    const filteredTree = useMemo(() => {
        if (!searchTerm) return tree;
        const newTree = JSON.parse(JSON.stringify(tree));
        const term = searchTerm.toLowerCase();

        newTree.children = newTree.children.map(group => {
            if (group.children) {
                group.children = group.children.filter(module => 
                    module.name.toLowerCase().includes(term) ||
                    Object.keys(module.permissions).some(action => action.toLowerCase().includes(term))
                );
            }
            if (group.name.toLowerCase().includes(term) || (group.children && group.children.length > 0)) {
                group.expanded = true;
                return group;
            }
            return null;
        }).filter(Boolean);
        return newTree;
    }, [tree, searchTerm]);

    return { 
        tree: filteredTree, 
        setSearchTerm, 
        handleToggle, 
        handlePermissionChange, 
        handleModuleChange,
        getSelectedPermissionIds 
    };
};