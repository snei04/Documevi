import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import PermissionGuard from './auth/PermissionGuard';
import './Dashboard.css';

// Configuración del modal para accesibilidad
Modal.setAppElement('#root');

const GestionOficinas = () => {
    // --- 1. ESTADOS DEL COMPONENTE ---
    const { dependencias, refreshOficinas } = useOutletContext();
    
    // Estado local para la lista de oficinas
    const [oficinas, setOficinas] = useState([]);
    
    // Estados para el formulario de CREACIÓN
    const [formData, setFormData] = useState({
        id_dependencia: '',
        codigo_oficina: '',
        nombre_oficina: ''
    });
    const [error, setError] = useState('');

    // Estados para controlar modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    
    // Estados para carga masiva
    const [bulkData, setBulkData] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResults, setBulkResults] = useState(null);
    const fileInputRef = useRef(null);

    // Estado para guardar los datos de la oficina que se está editando
    const [editingOficina, setEditingOficina] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');

    // --- LÓGICA PARA CARGAR DATOS ---
    const fetchOficinas = async () => {
        try {
            const res = await api.get('/oficinas');
            setOficinas(res.data);
        } catch (err) {
            console.error('Error al cargar oficinas:', err);
            toast.error('No se pudieron cargar las oficinas.');
        }
    };

    useEffect(() => {
        fetchOficinas();
    }, []);

    const refreshAndFetch = () => {
        if (refreshOficinas) {
            refreshOficinas();
        }
        fetchOficinas();
    };

    // --- 2. MANEJADORES DE MODALES ---
    const openCreateModal = () => {
        setFormData({ id_dependencia: '', codigo_oficina: '', nombre_oficina: '' });
        setError('');
        setIsCreateModalOpen(true);
    };
    const closeCreateModal = () => setIsCreateModalOpen(false);

    const openEditModal = (oficina) => {
        setEditingOficina({ ...oficina });
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingOficina(null);
    };

    const showConfirmation = (message) => {
        setConfirmMessage(message);
        setIsConfirmModalOpen(true);
    };

    // --- LÓGICA PARA CARGA MASIVA DESDE EXCEL ---
    const openBulkModal = () => {
        setBulkData([]);
        setBulkResults(null);
        setIsBulkModalOpen(true);
    };
    const closeBulkModal = () => {
        setIsBulkModalOpen(false);
        setBulkData([]);
        setBulkResults(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                
                // Saltar la primera fila (encabezados) y mapear los datos
                const oficinasData = data.slice(1)
                    .filter(row => row[0] || row[1] || row[2])
                    .map(row => ({
                        codigo_dependencia: row[0] || '',
                        codigo_oficina: row[1] || '',
                        nombre_oficina: row[2] || ''
                    }));
                
                setBulkData(oficinasData);
                setBulkResults(null);
            } catch (error) {
                toast.error('Error al leer el archivo Excel');
                console.error(error);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkSubmit = async () => {
        if (bulkData.length === 0) {
            toast.warning('No hay datos para cargar');
            return;
        }

        setBulkLoading(true);
        try {
            const response = await api.post('/oficinas/bulk', { oficinas: bulkData });
            setBulkResults(response.data.resultados);
            refreshAndFetch();
            toast.success(response.data.msg);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error en la carga masiva');
        } finally {
            setBulkLoading(false);
        }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ['codigo_dependencia', 'codigo_oficina', 'nombre_oficina'],
            ['001', '001-01', 'Oficina Ejemplo 1'],
            ['001', '001-02', 'Oficina Ejemplo 2'],
            ['002', '002-01', 'Oficina Ejemplo 3']
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Oficinas');
        XLSX.writeFile(wb, 'plantilla_oficinas.xlsx');
    };

    // --- 3. MANEJADORES DE FORMULARIOS ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.id_dependencia) {
            toast.warn('Debe seleccionar una dependencia.');
            return;
        }
        try {
            await api.post('/oficinas', formData);
            closeCreateModal();
            refreshAndFetch();
            showConfirmation('¡Oficina creada con éxito!');
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Error al crear la oficina';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const handleEditChange = (e) => {
        setEditingOficina({ ...editingOficina, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/oficinas/${editingOficina.id}`, editingOficina);
            closeEditModal();
            refreshAndFetch();
            showConfirmation('Oficina actualizada con éxito.');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar.');
        }
    };

    const handleToggleStatus = async (id, estadoActual) => {
        const accion = estadoActual ? 'desactivar' : 'activar';
        if (window.confirm(`¿Estás seguro de que quieres ${accion} esta oficina?`)) {
            try {
                await api.patch(`/oficinas/${id}/toggle-status`);
                refreshAndFetch();
                showConfirmation('Estado actualizado con éxito.');
            } catch (err) {
                toast.error(err.response?.data?.msg || 'Error al cambiar el estado.');
            }
        }
    };

    // --- 4. RENDERIZADO DEL COMPONENTE ---
    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Oficinas Productoras</h1>
                <PermissionGuard permission="oficinas_crear">
                    <div className="header-buttons">
                        <button onClick={openCreateModal} className="button button-primary">Crear Nueva Oficina</button>
                        <button onClick={openBulkModal} className="button button-secondary">📥 Carga Masiva Excel</button>
                    </div>
                </PermissionGuard>
            </div>

            <div className="content-box">
                <h3>Oficinas Existentes</h3>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre Oficina</th>
                            <th>Dependencia</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {oficinas.map(oficina => (
                            <tr key={oficina.id} className={!oficina.activo ? 'inactive-row' : ''}>
                                <td>{oficina.codigo_oficina}</td>
                                <td>{oficina.nombre_oficina}</td>
                                <td>{oficina.nombre_dependencia}</td>
                                <td>
                                    <span className={oficina.activo ? 'status-active' : 'status-inactive'}>
                                        {oficina.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    <PermissionGuard permission="oficinas_editar">
                                        <button onClick={() => openEditModal(oficina)} className="button">Editar</button>
                                    </PermissionGuard>
                                    <PermissionGuard permission="oficinas_inactivar">
                                        <button onClick={() => handleToggleStatus(oficina.id, oficina.activo)} className={`button ${oficina.activo ? 'button-danger' : 'button-success'}`}>
                                            {oficina.activo ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </PermissionGuard>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL PARA CREAR OFICINA --- */}
            <Modal isOpen={isCreateModalOpen} onRequestClose={closeCreateModal} contentLabel="Crear Oficina" className="modal" overlayClassName="modal-overlay">
                <h2>Crear Nueva Oficina</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="id_dependencia_crear">Dependencia</label>
                        <select id="id_dependencia_crear" name="id_dependencia" value={formData.id_dependencia} onChange={handleChange} required>
                            <option value="">-- Seleccione una Dependencia --</option>
                            {dependencias && dependencias.map(dep => (
                                dep.activo && <option key={dep.id} value={dep.id}>{dep.codigo_dependencia} - {dep.nombre_dependencia}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="codigo_oficina_crear">Código de la Oficina</label>
                        <input id="codigo_oficina_crear" type="text" name="codigo_oficina" placeholder="ej. 100-01" value={formData.codigo_oficina} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="nombre_oficina_crear">Nombre de la Oficina</label>
                        <input id="nombre_oficina_crear" type="text" name="nombre_oficina" placeholder="Nombre de la Oficina" value={formData.nombre_oficina} onChange={handleChange} required />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="button button-primary">Crear</button>
                        <button type="button" onClick={closeCreateModal} className="button">Cancelar</button>
                    </div>
                </form>
            </Modal>
            
            {/* --- MODAL DE EDICIÓN --- */}
            <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} contentLabel="Editar Oficina" className="modal" overlayClassName="modal-overlay">
                <h2>Editar Oficina</h2>
                {editingOficina && (
                    <form onSubmit={handleUpdate}>
                        <div className="form-group">
                            <label htmlFor="edit-dependencia">Dependencia</label>
                            <select id="edit-dependencia" name="id_dependencia" value={editingOficina.id_dependencia} onChange={handleEditChange} required>
                                {dependencias.map(dep => <option key={dep.id} value={dep.id}>{dep.codigo_dependencia} - {dep.nombre_dependencia}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="edit-codigo">Código</label>
                            <input id="edit-codigo" type="text" name="codigo_oficina" value={editingOficina.codigo_oficina} onChange={handleEditChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="edit-nombre">Nombre</label>
                            <input id="edit-nombre" type="text" name="nombre_oficina" value={editingOficina.nombre_oficina} onChange={handleEditChange} required />
                        </div>
                        <div className="modal-actions">
                            <button type="submit" className="button button-primary">Guardar Cambios</button>
                            <button type="button" onClick={closeEditModal} className="button">Cancelar</button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* --- MODAL DE CONFIRMACIÓN --- */}
            <Modal
                isOpen={isConfirmModalOpen}
                onRequestClose={() => setIsConfirmModalOpen(false)}
                contentLabel="Confirmación"
                className="modal"
                overlayClassName="modal-overlay"
                style={{ content: { width: '350px', textAlign: 'center' } }}
            >
                <h2>Éxito</h2>
                <p>{confirmMessage}</p>
                <button onClick={() => setIsConfirmModalOpen(false)} className="button button-primary">
                    Aceptar
                </button>
            </Modal>

            {/* --- MODAL PARA CARGA MASIVA --- */}
            <Modal
                isOpen={isBulkModalOpen}
                onRequestClose={closeBulkModal}
                contentLabel="Carga Masiva de Oficinas"
                className="modal modal-large"
                overlayClassName="modal-overlay"
            >
                <h2>📥 Carga Masiva de Oficinas</h2>
                <p className="modal-description">
                    Sube un archivo Excel (.xlsx) con las columnas <strong>codigo_dependencia</strong>, <strong>codigo_oficina</strong> y <strong>nombre_oficina</strong>.
                </p>
                
                <div className="bulk-actions">
                    <button onClick={downloadTemplate} className="button button-secondary">
                        📄 Descargar Plantilla
                    </button>
                </div>

                <div className="form-group">
                    <label htmlFor="excel-file-oficinas">Seleccionar archivo Excel</label>
                    <input
                        ref={fileInputRef}
                        id="excel-file-oficinas"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="file-input"
                    />
                </div>

                {bulkData.length > 0 && (
                    <div className="bulk-preview">
                        <h4>Vista previa ({bulkData.length} registros)</h4>
                        <div className="preview-table-container">
                            <table className="styled-table preview-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Cód. Dependencia</th>
                                        <th>Cód. Oficina</th>
                                        <th>Nombre Oficina</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bulkData.slice(0, 10).map((ofi, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td>{ofi.codigo_dependencia}</td>
                                            <td>{ofi.codigo_oficina}</td>
                                            <td>{ofi.nombre_oficina}</td>
                                        </tr>
                                    ))}
                                    {bulkData.length > 10 && (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                                                ... y {bulkData.length - 10} registros más
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {bulkResults && (
                    <div className="bulk-results">
                        <h4>Resultados de la carga</h4>
                        <div className="results-summary">
                            <span className="result-item success">✅ Creadas: {bulkResults.creadas}</span>
                            <span className="result-item warning">⚠️ Duplicados: {bulkResults.duplicados.length}</span>
                            <span className="result-item error">❌ Errores: {bulkResults.errores.length}</span>
                        </div>
                        {bulkResults.duplicados.length > 0 && (
                            <details className="result-details">
                                <summary>Ver duplicados</summary>
                                <ul>
                                    {bulkResults.duplicados.map((d, i) => (
                                        <li key={i}>Fila {d.fila}: {d.codigo_oficina} - {d.nombre_oficina}</li>
                                    ))}
                                </ul>
                            </details>
                        )}
                        {bulkResults.errores.length > 0 && (
                            <details className="result-details">
                                <summary>Ver errores</summary>
                                <ul>
                                    {bulkResults.errores.map((e, i) => (
                                        <li key={i}>Fila {e.fila}: {e.mensaje}</li>
                                    ))}
                                </ul>
                            </details>
                        )}
                    </div>
                )}

                <div className="modal-actions">
                    {!bulkResults ? (
                        <>
                            <button
                                onClick={handleBulkSubmit}
                                className="button button-primary"
                                disabled={bulkData.length === 0 || bulkLoading}
                            >
                                {bulkLoading ? 'Cargando...' : `Cargar ${bulkData.length} Oficinas`}
                            </button>
                            <button type="button" onClick={closeBulkModal} className="button">
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <button onClick={closeBulkModal} className="button button-primary">
                            Cerrar
                        </button>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default GestionOficinas;
