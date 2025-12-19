import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import PermissionGuard from './auth/PermissionGuard';
import './Dashboard.css';

Modal.setAppElement('#root');

const GestionSubseries = () => {
    const { series, subseries, refreshSubseries } = useOutletContext();
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSubserie, setNewSubserie] = useState({
        codigo_subserie: '',
        nombre_subserie: '',
        id_serie: '',
        retencion_gestion: '',
        retencion_central: '',
        disposicion_final: 'Conservación Total',
        procedimientos: ''
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSubserie, setEditingSubserie] = useState(null);

    // Estados para carga masiva
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkData, setBulkData] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResults, setBulkResults] = useState(null);
    const fileInputRef = useRef(null);

    // --- MANEJADORES ---
    const openCreateModal = () => setIsCreateModalOpen(true);
    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setNewSubserie({
            codigo_subserie: '',
            nombre_subserie: '',
            id_serie: '',
            retencion_gestion: '',
            retencion_central: '',
            disposicion_final: 'Conservación Total',
            procedimientos: ''
        });
    };

    const openEditModal = (subserie) => {
        setEditingSubserie({ ...subserie });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingSubserie(null);
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
                
                const subseriesData = data.slice(1)
                    .filter(row => row[0] || row[1] || row[2])
                    .map(row => ({
                        codigo_serie: row[0] || '',
                        codigo_subserie: row[1] || '',
                        nombre_subserie: row[2] || '',
                        retencion_gestion: row[3] || '',
                        retencion_central: row[4] || '',
                        disposicion_final: row[5] || 'Conservación Total'
                    }));
                
                setBulkData(subseriesData);
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
            const response = await api.post('/subseries/bulk', { subseries: bulkData });
            setBulkResults(response.data.resultados);
            refreshSubseries();
            toast.success(response.data.msg);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error en la carga masiva');
        } finally {
            setBulkLoading(false);
        }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ['codigo_serie', 'codigo_subserie', 'nombre_subserie', 'retencion_gestion', 'retencion_central', 'disposicion_final'],
            ['01', '01', 'Subserie Ejemplo 1', '5', '10', 'Conservación Total'],
            ['01', '02', 'Subserie Ejemplo 2', '3', '7', 'Eliminación'],
            ['02', '01', 'Subserie Ejemplo 3', '2', '5', 'Selección']
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Subseries');
        XLSX.writeFile(wb, 'plantilla_subseries.xlsx');
    };

    const handleCreateChange = (e) => setNewSubserie({ ...newSubserie, [e.target.name]: e.target.value });
    const handleEditChange = (e) => setEditingSubserie({ ...editingSubserie, [e.target.name]: e.target.value });

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/subseries', newSubserie);
            toast.success('Subserie creada con éxito.');
            closeCreateModal();
            refreshSubseries();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear la subserie.');
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/subseries/${editingSubserie.id}`, editingSubserie);
            toast.success('Subserie actualizada con éxito.');
            closeEditModal();
            refreshSubseries();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar.');
        }
    };

    const handleToggleStatus = async (id, estadoActual) => {
        const accion = estadoActual ? 'desactivar' : 'activar';
        if (window.confirm(`¿Estás seguro de que quieres ${accion} esta subserie?`)) {
            try {
                await api.patch(`/subseries/${id}/toggle-status`);
                toast.success('Estado actualizado.');
                refreshSubseries();
            } catch (err) {
                toast.error(err.response?.data?.msg || 'Error al cambiar el estado.');
            }
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Subseries Documentales (TRD)</h1>
                <PermissionGuard permission="subseries_crear">
                    <div className="header-buttons">
                        <button onClick={openCreateModal} className="button button-primary">Crear Nueva Subserie</button>
                        <button onClick={openBulkModal} className="button button-secondary">📥 Carga Masiva Excel</button>
                    </div>
                </PermissionGuard>
            </div>

            <div className="content-box">
                <h3>Subseries Existentes</h3>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre Subserie</th>
                            <th>Serie a la que Pertenece</th>
                            <th>Retención (Gestión/Central)</th>
                            <th>Disposición Final</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subseries && subseries.map(sub => (
                            <tr key={sub.id} className={!sub.activo ? 'inactive-row' : ''}>
                                <td>{sub.codigo_subserie}</td>
                                <td>{sub.nombre_subserie}</td>
                                <td>{sub.nombre_serie}</td>
                                <td>{`G: ${sub.retencion_gestion || 'N/A'}a, C: ${sub.retencion_central || 'N/A'}a`}</td>
                                <td>{sub.disposicion_final}</td>
                                <td>
                                    <span className={sub.activo ? 'status-active' : 'status-inactive'}>
                                        {sub.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    <PermissionGuard permission="subseries_editar">
                                        <button onClick={() => openEditModal(sub)} className="button">Editar</button>
                                    </PermissionGuard>
                                    <PermissionGuard permission="subseries_inactivar">
                                        <button 
                                            onClick={() => handleToggleStatus(sub.id, sub.activo)} 
                                            className={`button ${sub.activo ? 'button-danger' : 'button-success'}`}
                                        >
                                            {sub.activo ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </PermissionGuard>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL CREAR --- */}
            <Modal isOpen={isCreateModalOpen} onRequestClose={closeCreateModal} className="modal" overlayClassName="modal-overlay">
                <h2>Crear Nueva Subserie</h2>
                <form onSubmit={handleCreateSubmit}>
                    <div className="form-group">
                        <label>Serie a la que Pertenece *</label>
                        <select name="id_serie" value={newSubserie.id_serie} onChange={handleCreateChange} required>
                            <option value="">-- Seleccione una Serie --</option>
                            {series && series.map(s => s.activo && (
                                <option key={s.id} value={s.id}>{s.codigo_serie} - {s.nombre_serie}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label>Código de la Subserie *</label>
                        <input 
                            type="text" 
                            name="codigo_subserie" 
                            value={newSubserie.codigo_subserie} 
                            onChange={handleCreateChange} 
                            placeholder="Ej: 100.01"
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Nombre de la Subserie *</label>
                        <input 
                            type="text" 
                            name="nombre_subserie" 
                            value={newSubserie.nombre_subserie} 
                            onChange={handleCreateChange} 
                            placeholder="Ej: Actas de Comité"
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Retención en Gestión (años)</label>
                        <input 
                            type="number" 
                            name="retencion_gestion" 
                            value={newSubserie.retencion_gestion} 
                            onChange={handleCreateChange} 
                            placeholder="Ej: 5"
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label>Retención en Central (años)</label>
                        <input 
                            type="number" 
                            name="retencion_central" 
                            value={newSubserie.retencion_central} 
                            onChange={handleCreateChange} 
                            placeholder="Ej: 10"
                            min="0"
                        />
                    </div>

                    <div className="form-group">
                        <label>Disposición Final</label>
                        <select name="disposicion_final" value={newSubserie.disposicion_final} onChange={handleCreateChange}>
                            <option>Conservación Total</option>
                            <option>Eliminación</option>
                            <option>Selección</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Procedimientos</label>
                        <textarea 
                            name="procedimientos" 
                            value={newSubserie.procedimientos} 
                            onChange={handleCreateChange}
                            placeholder="Descripción de procedimientos aplicables..."
                            rows="4"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="button button-primary">Crear Subserie</button>
                        <button type="button" onClick={closeCreateModal} className="button">Cancelar</button>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL EDITAR --- */}
            <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} className="modal" overlayClassName="modal-overlay">
                <h2>Editar Subserie</h2>
                {editingSubserie && (
                    <form onSubmit={handleUpdateSubmit}>
                        <div className="form-group">
                            <label>Serie a la que Pertenece *</label>
                            <select name="id_serie" value={editingSubserie.id_serie} onChange={handleEditChange} required>
                                {series && series.map(s => (
                                    <option key={s.id} value={s.id}>{s.codigo_serie} - {s.nombre_serie}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Código *</label>
                            <input 
                                type="text" 
                                name="codigo_subserie" 
                                value={editingSubserie.codigo_subserie} 
                                onChange={handleEditChange} 
                                required 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Nombre *</label>
                            <input 
                                type="text" 
                                name="nombre_subserie" 
                                value={editingSubserie.nombre_subserie} 
                                onChange={handleEditChange} 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label>Retención en Gestión (años)</label>
                            <input 
                                type="number" 
                                name="retencion_gestion" 
                                value={editingSubserie.retencion_gestion || ''} 
                                onChange={handleEditChange}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Retención en Central (años)</label>
                            <input 
                                type="number" 
                                name="retencion_central" 
                                value={editingSubserie.retencion_central || ''} 
                                onChange={handleEditChange}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Disposición Final</label>
                            <select 
                                name="disposicion_final" 
                                value={editingSubserie.disposicion_final || 'Conservación Total'} 
                                onChange={handleEditChange}
                            >
                                <option>Conservación Total</option>
                                <option>Eliminación</option>
                                <option>Selección</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Procedimientos</label>
                            <textarea 
                                name="procedimientos" 
                                value={editingSubserie.procedimientos || ''} 
                                onChange={handleEditChange}
                                rows="4"
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="submit" className="button button-primary">Guardar Cambios</button>
                            <button type="button" onClick={closeEditModal} className="button">Cancelar</button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* --- MODAL PARA CARGA MASIVA --- */}
            <Modal
                isOpen={isBulkModalOpen}
                onRequestClose={closeBulkModal}
                contentLabel="Carga Masiva de Subseries"
                className="modal modal-large"
                overlayClassName="modal-overlay"
            >
                <h2>📥 Carga Masiva de Subseries</h2>
                <p className="modal-description">
                    Sube un archivo Excel (.xlsx) con las columnas: <strong>codigo_serie</strong>, <strong>codigo_subserie</strong>, <strong>nombre_subserie</strong>, <strong>retencion_gestion</strong>, <strong>retencion_central</strong>, <strong>disposicion_final</strong>.
                </p>
                
                <div className="bulk-actions">
                    <button onClick={downloadTemplate} className="button button-secondary">
                        📄 Descargar Plantilla
                    </button>
                </div>

                <div className="form-group">
                    <label htmlFor="excel-file-subseries">Seleccionar archivo Excel</label>
                    <input
                        ref={fileInputRef}
                        id="excel-file-subseries"
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
                                        <th>Cód. Serie</th>
                                        <th>Cód. Subserie</th>
                                        <th>Nombre</th>
                                        <th>Ret. G</th>
                                        <th>Ret. C</th>
                                        <th>Disp. Final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bulkData.slice(0, 10).map((sub, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td>{sub.codigo_serie}</td>
                                            <td>{sub.codigo_subserie}</td>
                                            <td>{sub.nombre_subserie}</td>
                                            <td>{sub.retencion_gestion}</td>
                                            <td>{sub.retencion_central}</td>
                                            <td>{sub.disposicion_final}</td>
                                        </tr>
                                    ))}
                                    {bulkData.length > 10 && (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', fontStyle: 'italic' }}>
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
                                        <li key={i}>Fila {d.fila}: {d.codigo_subserie} - {d.nombre_subserie}</li>
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
                                {bulkLoading ? 'Cargando...' : `Cargar ${bulkData.length} Subseries`}
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

export default GestionSubseries;