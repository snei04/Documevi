import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import PermissionGuard from './auth/PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';
import './Dashboard.css';

const GestionCamposPersonalizados = () => {
    const [oficinas, setOficinas] = useState([]);
    const [selectedOficina, setSelectedOficina] = useState('');
    const [campos, setCampos] = useState([]);
    const [newCampo, setNewCampo] = useState({
        nombre_campo: '',
        tipo_campo: 'texto',
        es_obligatorio: false,
        validar_duplicidad: false
    });

    // Estado para edición
    const [editingCampo, setEditingCampo] = useState(null);
    const [editForm, setEditForm] = useState({
        nombre_campo: '',
        tipo_campo: 'texto',
        es_obligatorio: false,
        validar_duplicidad: false
    });

    // Estado para confirmación de eliminación
    const [deletingCampo, setDeletingCampo] = useState(null);

    const { hasPermission } = usePermissions();

    useEffect(() => {
        const fetchOficinas = async () => {
            try {
                const res = await api.get('/oficinas');
                setOficinas(res.data);
            } catch (err) {
                toast.error('No se pudieron cargar las oficinas.');
            }
        };
        fetchOficinas();
    }, []);

    const fetchCampos = useCallback(async () => {
        if (!selectedOficina) {
            setCampos([]);
            return;
        }
        try {
            const res = await api.get(`/campos-personalizados/oficina/${selectedOficina}`);
            setCampos(res.data);
        } catch (err) {
            toast.error('Error al cargar los campos para esta oficina.');
        }
    }, [selectedOficina]);

    useEffect(() => {
        fetchCampos();
    }, [fetchCampos]);

    const handleNewCampoChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewCampo(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCreateCampo = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/campos-personalizados/oficina/${selectedOficina}`, newCampo);
            toast.success('Campo personalizado creado con éxito.');
            setNewCampo({ nombre_campo: '', tipo_campo: 'texto', es_obligatorio: false, validar_duplicidad: false });
            fetchCampos();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear el campo.');
        }
    };

    // --- Editar ---
    const handleStartEdit = (campo) => {
        setEditingCampo(campo.id);
        setEditForm({
            nombre_campo: campo.nombre_campo,
            tipo_campo: campo.tipo_campo,
            es_obligatorio: !!campo.es_obligatorio,
            validar_duplicidad: !!campo.validar_duplicidad
        });
    };

    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveEdit = async () => {
        try {
            await api.put(`/campos-personalizados/${editingCampo}`, editForm);
            toast.success('Campo actualizado con éxito.');
            setEditingCampo(null);
            fetchCampos();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar el campo.');
        }
    };

    const handleCancelEdit = () => {
        setEditingCampo(null);
    };

    // --- Eliminar ---
    const handleDelete = async (id) => {
        try {
            await api.delete(`/campos-personalizados/${id}`);
            toast.success('Campo eliminado con éxito.');
            setDeletingCampo(null);
            fetchCampos();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al eliminar el campo.');
        }
    };

    const showActions = hasPermission('campos_editar') || hasPermission('campos_eliminar');

    return (
        <div>
            <div className="page-header">
                <h1>Gestionar Campos Personalizados por Oficina</h1>
            </div>

            <div className="content-box">
                <div style={{ marginBottom: '20px' }}>
                    <label>Seleccione una Oficina Productora:</label>
                    <select value={selectedOficina} onChange={(e) => setSelectedOficina(e.target.value)} style={{ marginLeft: '10px' }}>
                        <option value="">-- Seleccione --</option>
                        {oficinas.map(ofi => (
                            <option key={ofi.id} value={ofi.id}>{ofi.nombre_oficina}</option>
                        ))}
                    </select>
                </div>

                {selectedOficina && (
                    <PermissionGuard permission="campos_crear">
                        <form onSubmit={handleCreateCampo} className="action-bar" style={{ borderTop: '1px solid #eee', paddingTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
                            <input type="text" name="nombre_campo" placeholder="Nombre del Campo (ej. Cédula Paciente)" value={newCampo.nombre_campo} onChange={handleNewCampoChange} required />
                            <select name="tipo_campo" value={newCampo.tipo_campo} onChange={handleNewCampoChange}>
                                <option value="texto">Texto</option>
                                <option value="numero">Número</option>
                                <option value="fecha">Fecha</option>
                            </select>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input type="checkbox" name="es_obligatorio" checked={newCampo.es_obligatorio} onChange={handleNewCampoChange} />
                                ¿Es obligatorio?
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }} title="Si está marcado, el sistema validará que no exista otro expediente con el mismo valor en este campo">
                                <input type="checkbox" name="validar_duplicidad" checked={newCampo.validar_duplicidad} onChange={handleNewCampoChange} />
                                🔍 Validar duplicidad
                            </label>
                            <button type="submit" className="button button-primary">Añadir Campo</button>
                        </form>
                    </PermissionGuard>
                )}
            </div>

            {selectedOficina && (
                <>
                    <h3>Campos Definidos para esta Oficina</h3>
                    {campos.length === 0 ? (
                        <div className="content-box">
                            <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px 0' }}>
                                No hay campos personalizados definidos para esta oficina.
                            </p>
                        </div>
                    ) : (
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Nombre del Campo</th>
                                    <th>Tipo</th>
                                    <th>Obligatorio</th>
                                    <th>Validar Duplicidad</th>
                                    {showActions && <th>Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {campos.map(campo => (
                                    <tr key={campo.id}>
                                        {editingCampo === campo.id ? (
                                            <>
                                                <td>
                                                    <input
                                                        type="text"
                                                        name="nombre_campo"
                                                        value={editForm.nombre_campo}
                                                        onChange={handleEditFormChange}
                                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        name="tipo_campo"
                                                        value={editForm.tipo_campo}
                                                        onChange={handleEditFormChange}
                                                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                                                    >
                                                        <option value="texto">Texto</option>
                                                        <option value="numero">Número</option>
                                                        <option value="fecha">Fecha</option>
                                                    </select>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        name="es_obligatorio"
                                                        checked={editForm.es_obligatorio}
                                                        onChange={handleEditFormChange}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        name="validar_duplicidad"
                                                        checked={editForm.validar_duplicidad}
                                                        onChange={handleEditFormChange}
                                                    />
                                                </td>
                                                {showActions && (
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <button
                                                                onClick={handleSaveEdit}
                                                                className="button"
                                                                style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#c6f6d5', color: '#22543d', border: '1px solid #9ae6b4' }}
                                                            >
                                                                ✅ Guardar
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="button"
                                                                style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#e2e8f0', color: '#4a5568', border: '1px solid #cbd5e0' }}
                                                            >
                                                                ✕ Cancelar
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <td>{campo.nombre_campo}</td>
                                                <td>{campo.tipo_campo}</td>
                                                <td>{campo.es_obligatorio ? 'Sí' : 'No'}</td>
                                                <td>{campo.validar_duplicidad ? '🔍 Sí' : 'No'}</td>
                                                {showActions && (
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <PermissionGuard permission="campos_editar">
                                                                <button
                                                                    onClick={() => handleStartEdit(campo)}
                                                                    className="button"
                                                                    style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px solid #bee3f8' }}
                                                                >
                                                                    ✏️ Editar
                                                                </button>
                                                            </PermissionGuard>
                                                            <PermissionGuard permission="campos_eliminar">
                                                                <button
                                                                    onClick={() => setDeletingCampo(campo)}
                                                                    className="button"
                                                                    style={{ fontSize: '0.85em', padding: '4px 10px', backgroundColor: '#fed7d7', color: '#c53030', border: '1px solid #feb2b2' }}
                                                                >
                                                                    🗑️ Eliminar
                                                                </button>
                                                            </PermissionGuard>
                                                        </div>
                                                    </td>
                                                )}
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {/* Modal de confirmación de eliminación */}
            {deletingCampo && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '12px', padding: '28px',
                        maxWidth: '440px', width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <span style={{ fontSize: '48px' }}>⚠️</span>
                            <h3 style={{ margin: '10px 0', color: '#c53030' }}>Confirmar Eliminación</h3>
                        </div>
                        <p style={{ color: '#4a5568', fontSize: '0.95em', textAlign: 'center' }}>
                            ¿Está seguro de que desea eliminar el campo <strong>"{deletingCampo.nombre_campo}"</strong>?
                        </p>
                        <p style={{ color: '#e53e3e', fontSize: '0.85em', textAlign: 'center', fontWeight: '500' }}>
                            ⚠️ Esta acción eliminará también los datos almacenados en este campo para todos los expedientes.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                            <button
                                className="button"
                                onClick={() => setDeletingCampo(null)}
                                style={{ backgroundColor: '#e2e8f0', color: '#2d3748', padding: '8px 20px' }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="button button-danger"
                                onClick={() => handleDelete(deletingCampo.id)}
                                style={{ padding: '8px 20px' }}
                            >
                                🗑️ Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionCamposPersonalizados;