import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import PermissionGuard from './auth/PermissionGuard';
import './Dashboard.css';

// Configuración del modal para accesibilidad (importante para que no haya errores en la consola)
Modal.setAppElement('#root');

const GestionDependencias = () => {
    // --- 1. ESTADOS DEL COMPONENTE ---

    // Obtiene la lista de dependencias y la función para refrescarla desde el contexto del Outlet.
    const { dependencias, refreshDependencias } = useOutletContext();
    
    // Estados para el formulario de CREACIÓN
    const [codigo, setCodigo] = useState('');
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState('');

    // Estados para controlar la visibilidad de los MODALES (ventanas emergentes)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkData, setBulkData] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResults, setBulkResults] = useState(null);
    const fileInputRef = useRef(null);

    // Estado para guardar los datos de la dependencia que se está editando
    const [editingDep, setEditingDep] = useState(null);
    // Estado para el mensaje de confirmación
    const [confirmMessage, setConfirmMessage] = useState('');
    const firstInputRef = useRef(null); // Para el foco en el modal de edición

    // --- 2. LÓGICA PARA MANEJAR MODALES ---

    // Abre el modal de creación y limpia los campos
    const openCreateModal = () => {
        setCodigo('');
        setNombre('');
        setError('');
        setIsCreateModalOpen(true);
    };
    const closeCreateModal = () => setIsCreateModalOpen(false);

    // Abre el modal de edición con los datos de la dependencia seleccionada
    const openEditModal = (dependencia) => {
        setEditingDep({ ...dependencia }); // Clona el objeto para evitar mutaciones directas
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingDep(null);
    };
    
    // Abre el modal de confirmación con un mensaje específico
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
                const dependenciasData = data.slice(1)
                    .filter(row => row[0] || row[1]) // Filtrar filas vacías
                    .map(row => ({
                        codigo: row[0] || '',
                        nombre: row[1] || ''
                    }));
                
                setBulkData(dependenciasData);
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
            const response = await api.post('/dependencias/bulk', { dependencias: bulkData });
            setBulkResults(response.data.resultados);
            refreshDependencias();
            toast.success(response.data.msg);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error en la carga masiva');
        } finally {
            setBulkLoading(false);
        }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ['codigo', 'nombre'],
            ['001', 'Dependencia Ejemplo 1'],
            ['002', 'Dependencia Ejemplo 2']
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Dependencias');
        XLSX.writeFile(wb, 'plantilla_dependencias.xlsx');
    };

    // --- 3. LÓGICA DE LOS FORMULARIOS (CREAR, EDITAR, CAMBIAR ESTADO) ---

    // Maneja el envío del formulario para CREAR una nueva dependencia
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/dependencias', {
                codigo_dependencia: codigo,
                nombre_dependencia: nombre
            });
            closeCreateModal(); // Cierra el modal de creación
            refreshDependencias();
            showConfirmation('¡Dependencia creada con éxito!'); // Muestra la confirmación
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Error al crear la dependencia';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    // Actualiza el estado mientras se escribe en el formulario de EDICIÓN
    const handleEditChange = (e) => {
        setEditingDep({ ...editingDep, [e.target.name]: e.target.value });
    };

    // Maneja el envío del formulario para ACTUALIZAR una dependencia
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingDep) return;
        try {
            await api.put(`/dependencias/${editingDep.id}`, {
                codigo_dependencia: editingDep.codigo_dependencia,
                nombre_dependencia: editingDep.nombre_dependencia
            });
            closeEditModal();
            refreshDependencias();
            showConfirmation('Dependencia actualizada con éxito.'); // Muestra la confirmación
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar.');
        }
    };

    // Maneja el clic en el botón para ACTIVAR o DESACTIVAR
    const handleToggleStatus = async (id, estadoActual) => {
        const accion = estadoActual ? 'desactivar' : 'activar';
        if (window.confirm(`¿Estás seguro de que quieres ${accion} esta dependencia?`)) {
            try {
                await api.patch(`/dependencias/${id}/toggle-status`);
                refreshDependencias();
                showConfirmation('Estado actualizado con éxito.'); // Muestra la confirmación
            } catch (err) {
                toast.error(err.response?.data?.msg || 'Error al cambiar el estado.');
            }
        }
    };

    // --- 4. RENDERIZADO DEL COMPONENTE ---
    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Dependencias</h1>
                <PermissionGuard permission="dependencias_crear">
                    <div className="header-buttons">
                        <button onClick={openCreateModal} className="button button-primary">Crear Nueva Dependencia</button>
                        <button onClick={openBulkModal} className="button button-secondary">📥 Carga Masiva Excel</button>
                    </div>
                </PermissionGuard>
            </div>

            <div className="content-box">
                <h3>Dependencias Existentes</h3>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dependencias && dependencias.map(dep => (
                            <tr key={dep.id} className={!dep.activo ? 'inactive-row' : ''}>
                                <td>{dep.codigo_dependencia}</td>
                                <td>{dep.nombre_dependencia}</td>
                                <td>
                                    <span className={dep.activo ? 'status-active' : 'status-inactive'}>
                                        {dep.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    <PermissionGuard permission="dependencias_editar">
                                        <button onClick={() => openEditModal(dep)} className="button">Editar</button>
                                    </PermissionGuard>
                                    <PermissionGuard permission="dependencias_inactivar">
                                        <button onClick={() => handleToggleStatus(dep.id, dep.activo)} className={`button ${dep.activo ? 'button-danger' : 'button-success'}`}>
                                            {dep.activo ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </PermissionGuard>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL PARA CREAR DEPENDENCIA --- */}
            <Modal isOpen={isCreateModalOpen} onRequestClose={closeCreateModal} contentLabel="Crear Dependencia" className="modal" overlayClassName="modal-overlay">
                <h2>Crear Nueva Dependencia</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="codigo_dependencia_crear">Código</label>
                        <input id="codigo_dependencia_crear" type="text" placeholder="ej. 100" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="nombre_dependencia_crear">Nombre</label>
                        <input id="nombre_dependencia_crear" type="text" placeholder="Nombre de la Dependencia" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <div className="modal-actions">
                        <button type="submit" className="button button-primary">Crear</button>
                        <button type="button" onClick={closeCreateModal} className="button">Cancelar</button>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL PARA EDITAR DEPENDENCIA --- */}
            <Modal 
                isOpen={isEditModalOpen} 
                onRequestClose={closeEditModal} 
                contentLabel="Editar Dependencia" 
                className="modal" 
                overlayClassName="modal-overlay"
                onAfterOpen={() => { if (firstInputRef.current) firstInputRef.current.focus(); }}
            >
                <h2>Editar Dependencia</h2>
                {editingDep && (
                    <form onSubmit={handleUpdate}>
                        <div className="form-group">
                            <label htmlFor="codigo_dependencia_modal">Código de la Dependencia</label>
                            <input ref={firstInputRef} id="codigo_dependencia_modal" type="text" name="codigo_dependencia" value={editingDep.codigo_dependencia} onChange={handleEditChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="nombre_dependencia_modal">Nombre de la Dependencia</label>
                            <input id="nombre_dependencia_modal" type="text" name="nombre_dependencia" value={editingDep.nombre_dependencia} onChange={handleEditChange} required />
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
                contentLabel="Carga Masiva de Dependencias"
                className="modal modal-large"
                overlayClassName="modal-overlay"
            >
                <h2>📥 Carga Masiva de Dependencias</h2>
                <p className="modal-description">
                    Sube un archivo Excel (.xlsx) con las columnas <strong>codigo</strong> y <strong>nombre</strong>.
                </p>
                
                <div className="bulk-actions">
                    <button onClick={downloadTemplate} className="button button-secondary">
                        📄 Descargar Plantilla
                    </button>
                </div>

                <div className="form-group">
                    <label htmlFor="excel-file">Seleccionar archivo Excel</label>
                    <input
                        ref={fileInputRef}
                        id="excel-file"
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
                                        <th>Código</th>
                                        <th>Nombre</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bulkData.slice(0, 10).map((dep, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td>{dep.codigo}</td>
                                            <td>{dep.nombre}</td>
                                        </tr>
                                    ))}
                                    {bulkData.length > 10 && (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', fontStyle: 'italic' }}>
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
                                        <li key={i}>Fila {d.fila}: {d.codigo} - {d.nombre}</li>
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
                                {bulkLoading ? 'Cargando...' : `Cargar ${bulkData.length} Dependencias`}
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

export default GestionDependencias;