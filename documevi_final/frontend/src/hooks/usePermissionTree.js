import { useState, useMemo, useCallback } from 'react';

export const usePermissionTree = (initialData, initialRolePerms) => {
    const [tree, setTree] = useState(() => {
        // Si no hay datos iniciales, devuelve un árbol vacío.
        if (!initialData) return { children: [] };

        // Copiamos los datos para no modificar el estado original.
        const dataWithInitialState = JSON.parse(JSON.stringify(initialData));

        // Marcamos los checkboxes correspondientes a los permisos que el rol ya tiene.
        if (dataWithInitialState.children) {
            dataWithInitialState.children.forEach(group => {
                if (group.children) {
                    group.children.forEach(perm => {
                        if (initialRolePerms.includes(perm.id)) {
                            perm.permissions.enabled = true;
                        }
                    });
                }
            });
        }
        return dataWithInitialState;
    });

    const [searchTerm, setSearchTerm] = useState('');

    // Función para expandir/colapsar un grupo
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

    // Función para marcar/desmarcar un permiso individual
    const handlePermissionChange = useCallback((permissionId) => {
        setTree(prevTree => {
            const newTree = JSON.parse(JSON.stringify(prevTree));
            const findAndChange = (nodes) => {
                 for (const node of nodes) {
                    if (node.id === permissionId) {
                        node.permissions.enabled = !node.permissions.enabled;
                        return true;
                    }
                    if (node.children && findAndChange(node.children)) return true;
                }
                return false;
            };
            findAndChange(newTree.children);
            return newTree;
        });
    }, []);

    // Función para marcar/desmarcar un grupo entero
    const handleGroupChange = useCallback((groupId) => {
        setTree(prevTree => {
            const newTree = JSON.parse(JSON.stringify(prevTree));
            const groupNode = newTree.children.find(g => g.id === groupId);
            if (groupNode && groupNode.children) {
                // Si no todos están marcados, los marcamos todos. Si ya todos están marcados, los desmarcamos.
                const areAllChecked = groupNode.children.every(p => p.permissions.enabled);
                groupNode.children.forEach(p => p.permissions.enabled = !areAllChecked);
            }
            return newTree;
        });
    }, []);

    // Función para obtener los IDs de los permisos seleccionados
    const getSelectedPermissionIds = useCallback(() => {
        const selectedIds = [];
        const collect = (nodes) => {
            if (!nodes) return;
            nodes.forEach(node => {
                if (node.permissions && node.permissions.enabled) {
                    selectedIds.push(node.id);
                }
                if (node.children) {
                    collect(node.children);
                }
            });
        };
        collect(tree.children);
        return selectedIds;
    }, [tree]);

    // Lógica para filtrar el árbol según la búsqueda
    const filteredTree = useMemo(() => {
        if (!searchTerm) return tree;
        const newTree = JSON.parse(JSON.stringify(tree));
        
        newTree.children = newTree.children.map(group => {
            // Si el nombre del grupo coincide, lo mostramos
            if (group.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                group.expanded = true; // Auto-expande el grupo
                return group;
            }
            // Si no, filtramos sus hijos para ver si alguno coincide
            if (group.children) {
                group.children = group.children.filter(perm => 
                    perm.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            // Si después de filtrar, el grupo tiene hijos visibles, lo mostramos
            if (group.children && group.children.length > 0) {
                 group.expanded = true;
                 return group;
            }
            return null;
        }).filter(Boolean); // Limpiamos los grupos que quedaron nulos
        
        return newTree;
    }, [tree, searchTerm]);

    return { 
        tree: filteredTree, 
        setSearchTerm, 
        handleToggle, 
        handlePermissionChange, 
        handleGroupChange, 
        getSelectedPermissionIds 
    };
};