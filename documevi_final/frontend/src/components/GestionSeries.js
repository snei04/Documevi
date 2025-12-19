import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import PermissionGuard from './auth/PermissionGuard';
import './Dashboard.css';

// Configuración del modal para accesibilidad
Modal.setAppElement('#root');

const GestionSeries = () => {
    // --- 1. ESTADOS DEL COMPONENTE ---

    // Obtiene los datos y las funciones de refresco del contexto del Outlet
    const { oficinas, series, refreshSeries } = useOutletContext();
    
    // Estados para el modal de CREACIÓN
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSerie, setNewSerie] = useState({
        codigo_serie: '',
        nombre_serie: '',
        id_oficina_productora: '',
        requiere_subserie: true,
        retencion_gestion: '',
        retencion_central: '',
        disposicion_final: 'Conservación Total',
        procedimientos: ''
    });

    // Estados para el modal de EDICIÓN
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSerie, setEditingSerie] = useState(null);

    // Estados para carga masiva
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkData, setBulkData] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResults, setBulkResults] = useState(null);
    const fileInputRef = useRef(null);

    // --- 2. MANEJADORES DE MODALES ---
    const openCreateModal = () => {
        setNewSerie({ 
            codigo_serie: '', 
            nombre_serie: '', 
            id_oficina_productora: '', 
            requiere_subserie: true,
            retencion_gestion: '',
            retencion_central: '',
            disposicion_final: 'Conservación Total',
            procedimientos: ''
        });
        setIsCreateModalOpen(true);
    };
    const closeCreateModal = () => setIsCreateModalOpen(false);

    const openEditModal = (serie) => {
        setEditingSerie({ ...serie });
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => setIsEditModalOpen(false);

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
                
                const seriesData = data.slice(1)
                    .filter(row => row[0] || row[1] || row[2])
                    .map(row => ({
                        codigo_oficina: row[0] || '',
                        codigo_serie: row[1] || '',
                        nombre_serie: row[2] || '',
                        requiere_subserie: row[3] !== undefined ? row[3] : 'Si',
                        retencion_gestion: row[4] || '',
                        retencion_central: row[5] || '',
                        disposicion_final: row[6] || 'Conservación Total'
                    }));
                
                setBulkData(seriesData);
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
            const response = await api.post('/series/bulk', { series: bulkData });
            setBulkResults(response.data.resultados);
            refreshSeries();
            toast.success(response.data.msg);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error en la carga masiva');
        } finally {
            setBulkLoading(false);
        }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ['codigo_oficina', 'codigo_serie', 'nombre_serie', 'requiere_subserie', 'retencion_gestion', 'retencion_central', 'disposicion_final'],
            ['001-01', '01', 'Serie con Subseries', 'Si', '', '', ''],
            ['001-01', '02', 'Serie sin Subseries', 'No', '5', '10', 'Conservación Total'],
            ['001-02', '01', 'Otra Serie', 'No', '3', '7', 'Eliminación']
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Series');
        XLSX.writeFile(wb, 'plantilla_series.xlsx');
    };

    // --- 3. LÓGICA DE FORMULARIOS ---

    // Maneja los cambios en los inputs de texto y selectores
    const handleChange = (e, setter) => {
        setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Manejador especial para el checkbox
    const handleCheckboxChange = (e, setter) => {
        const isChecked = e.target.checked;
        setter(prev => ({ 
            ...prev, 
            [e.target.name]: isChecked,
            // Si marca que requiere subserie, limpiar los campos de retención
            ...(isChecked ? {
                retencion_gestion: '',
                retencion_central: '',
                disposicion_final: 'Conservación Total',
                procedimientos: ''
            } : {})
        }));
    };
    
    // Envía el formulario para CREAR una nueva serie
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/series', newSerie);
            toast.success('Serie creada con éxito.');
            closeCreateModal();
            refreshSeries();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al crear la serie.');
        }
    };
    
    // Envía el formulario para ACTUALIZAR una serie
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/series/${editingSerie.id}`, editingSerie);
            toast.success('Serie actualizada con éxito.');
            closeEditModal();
            refreshSeries();
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Error al actualizar.');
        }
    };

    // Cambia el estado (activo/inactivo) de una serie
    const handleToggleStatus = async (id, estadoActual) => {
        const accion = estadoActual ? 'desactivar' : 'activar';
        if (window.confirm(`¿Estás seguro de que quieres ${accion} esta serie?`)) {
            try {
                await api.patch(`/series/${id}/toggle-status`);
                toast.success('Estado actualizado.');
                refreshSeries();
            } catch (err) {
                toast.error(err.response?.data?.msg || 'Error al cambiar el estado.');
            }
        }
    };

    // --- 4. RENDERIZADO DEL COMPONENTE ---
    return (
        <div>
            <div className="page-header">
                <h1>Gestión de Series (TRD)</h1>
                <PermissionGuard permission="series_crear">
                    <div className="header-buttons">
                        <button onClick={openCreateModal} className="button button-primary">Crear Nueva Serie</button>
                        <button onClick={openBulkModal} className="button button-secondary">📥 Carga Masiva Excel</button>
                    </div>
                </PermissionGuard>
            </div>

            <div className="content-box">
                <h3>Series Existentes</h3>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre de la Serie</th>
                            <th>Oficina Productora</th>
                            <th>¿Requiere Subserie?</th>
                            <th>Retención</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {series && series.map(serie => (
                            <tr key={serie.id} className={!serie.activo ? 'inactive-row' : ''}>
                                <td>{serie.codigo_serie}</td>
                                <td>{serie.nombre_serie}</td>
                                <td>{serie.nombre_oficina}</td>
                                <td>{serie.requiere_subserie ? 'Sí' : 'No'}</td>
                                <td>
                                    {!serie.requiere_subserie ? 
                                        `G: ${serie.retencion_gestion || 'N/A'}a, C: ${serie.retencion_central || 'N/A'}a` 
                                        : '-'}
                                </td>
                                <td>
                                    <span className={serie.activo ? 'status-active' : 'status-inactive'}>
                                        {serie.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    <PermissionGuard permission="series_editar">
                                        <button onClick={() => openEditModal(serie)} className="button">Editar</button>
                                    </PermissionGuard>
                                    <PermissionGuard permission="series_inactivar">
                                        <button onClick={() => handleToggleStatus(serie.id, serie.activo)} className={`button ${serie.activo ? 'button-danger' : 'button-success'}`}>
                                            {serie.activo ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </PermissionGuard>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL PARA CREAR SERIE --- */}
            <Modal isOpen={isCreateModalOpen} onRequestClose={closeCreateModal} className="modal" overlayClassName="modal-overlay">
                <h2>Crear Nueva Serie</h2>
                <form onSubmit={handleCreateSubmit}>
                    <div className="form-group">
                        <label>Oficina Productora</label>
                        <select name="id_oficina_productora" value={newSerie.id_oficina_productora} onChange={(e) => handleChange(e, setNewSerie)} required>
                            <option value="">-- Seleccione una Oficina --</option>
                            {oficinas.map(ofi => ofi.activo && <option key={ofi.id} value={ofi.id}>{ofi.codigo_oficina} - {ofi.nombre_oficina}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Código de la Serie</label>
                        <input type="text" name="codigo_serie" value={newSerie.codigo_serie} onChange={(e) => handleChange(e, setNewSerie)} required />
                    </div>
                    <div className="form-group">
                        <label>Nombre de la Serie</label>
                        <input type="text" name="nombre_serie" value={newSerie.nombre_serie} onChange={(e) => handleChange(e, setNewSerie)} required />
                    </div>
                    <div className="form-group">
                        <label>
                            <input 
                                type="checkbox" 
                                name="requiere_subserie"
                                checked={newSerie.requiere_subserie}
                                onChange={(e) => handleCheckboxChange(e, setNewSerie)}
                                style={{ marginRight: '10px' }}
                            />
                            ¿Esta serie requiere subseries?
                        </label>
                    </div>

                    {/* Campos adicionales si NO requiere subserie */}
                    {!newSerie.requiere_subserie && (
                        <>
                            <div className="form-group">
                                <label>Retención en Gestión (años)</label>
                                <input 
                                    type="number" 
                                    name="retencion_gestion" 
                                    value={newSerie.retencion_gestion} 
                                    onChange={(e) => handleChange(e, setNewSerie)} 
                                    placeholder="Ej: 5"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Retención en Central (años)</label>
                                <input 
                                    type="number" 
                                    name="retencion_central" 
                                    value={newSerie.retencion_central} 
                                    onChange={(e) => handleChange(e, setNewSerie)} 
                                    placeholder="Ej: 10"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Disposición Final</label>
                                <select name="disposicion_final" value={newSerie.disposicion_final} onChange={(e) => handleChange(e, setNewSerie)}>
                                    <option>Conservación Total</option>
                                    <option>Eliminación</option>
                                    <option>Selección</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Procedimientos</label>
                                <textarea 
                                    name="procedimientos" 
                                    value={newSerie.procedimientos} 
                                    onChange={(e) => handleChange(e, setNewSerie)}
                                    placeholder="Descripción de procedimientos aplicables..."
                                    rows="4"
                                />
                            </div>
                        </>
                    )}

                    <div className="modal-actions">
                        <button type="submit" className="button button-primary">Crear</button>
                        <button type="button" onClick={closeCreateModal} className="button">Cancelar</button>
                    </div>
                </form>
            </Modal>

            {/* --- MODAL PARA EDITAR SERIE --- */}
            <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} className="modal" overlayClassName="modal-overlay">
                <h2>Editar Serie</h2>
                {editingSerie && (
                    <form onSubmit={handleUpdateSubmit}>
                        <div className="form-group">
                            <label>Oficina Productora</label>
                            <select name="id_oficina_productora" value={editingSerie.id_oficina_productora} onChange={(e) => handleChange(e, setEditingSerie)} required>
                                {oficinas.map(ofi => <option key={ofi.id} value={ofi.id}>{ofi.codigo_oficina} - {ofi.nombre_oficina}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Código</label>
                            <input type="text" name="codigo_serie" value={editingSerie.codigo_serie} onChange={(e) => handleChange(e, setEditingSerie)} required />
                        </div>
                        <div className="form-group">
                            <label>Nombre</label>
                            <input type="text" name="nombre_serie" value={editingSerie.nombre_serie} onChange={(e) => handleChange(e, setEditingSerie)} required />
                        </div>
                        <div className="form-group">
                            <label className='checkbox-label'>
                                <input 
                                    type="checkbox" 
                                    name="requiere_subserie"
                                    checked={editingSerie.requiere_subserie}
                                    onChange={(e) => handleCheckboxChange(e, setEditingSerie)}
                                    style={{ marginRight: '10px' }}
                                />
                                ¿Esta serie requiere subseries?
                            </label>
                        </div>

                        {/* Campos adicionales si NO requiere subserie */}
                        {!editingSerie.requiere_subserie && (
                            <>
                                <div className="form-group">
                                    <label>Retención en Gestión (años)</label>
                                    <input 
                                        type="number" 
                                        name="retencion_gestion" 
                                        value={editingSerie.retencion_gestion || ''} 
                                        onChange={(e) => handleChange(e, setEditingSerie)}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Retención en Central (años)</label>
                                    <input 
                                        type="number" 
                                        name="retencion_central" 
                                        value={editingSerie.retencion_central || ''} 
                                        onChange={(e) => handleChange(e, setEditingSerie)}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Disposición Final</label>
                                    <select 
                                        name="disposicion_final" 
                                        value={editingSerie.disposicion_final || 'Conservación Total'} 
                                        onChange={(e) => handleChange(e, setEditingSerie)}
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
                                        value={editingSerie.procedimientos || ''} 
                                        onChange={(e) => handleChange(e, setEditingSerie)}
                                        rows="4"
                                    />
                                </div>
                            </>
                        )}

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
                contentLabel="Carga Masiva de Series"
                className="modal modal-large"
                overlayClassName="modal-overlay"
            >
                <h2>📥 Carga Masiva de Series</h2>
                <p className="modal-description">
                    Sube un archivo Excel (.xlsx) con las columnas: <strong>codigo_oficina</strong>, <strong>codigo_serie</strong>, <strong>nombre_serie</strong>, <strong>requiere_subserie</strong> (Si/No). Si no requiere subserie, incluir: <strong>retencion_gestion</strong>, <strong>retencion_central</strong>, <strong>disposicion_final</strong>.
                </p>
                
                <div className="bulk-actions">
                    <button onClick={downloadTemplate} className="button button-secondary">
                        📄 Descargar Plantilla
                    </button>
                </div>

                <div className="form-group">
                    <label htmlFor="excel-file-series">Seleccionar archivo Excel</label>
                    <input
                        ref={fileInputRef}
                        id="excel-file-series"
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
                                        <th>Cód. Oficina</th>
                                        <th>Cód. Serie</th>
                                        <th>Nombre</th>
                                        <th>Req. Sub.</th>
                                        <th>Ret. G</th>
                                        <th>Ret. C</th>
                                        <th>Disp. Final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bulkData.slice(0, 10).map((serie, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td>{serie.codigo_oficina}</td>
                                            <td>{serie.codigo_serie}</td>
                                            <td>{serie.nombre_serie}</td>
                                            <td>{serie.requiere_subserie}</td>
                                            <td>{serie.retencion_gestion || '-'}</td>
                                            <td>{serie.retencion_central || '-'}</td>
                                            <td>{serie.disposicion_final || '-'}</td>
                                        </tr>
                                    ))}
                                    {bulkData.length > 10 && (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', fontStyle: 'italic' }}>
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
                                        <li key={i}>Fila {d.fila}: {d.codigo_serie} - {d.nombre_serie}</li>
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
                                {bulkLoading ? 'Cargando...' : `Cargar ${bulkData.length} Series`}
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

export default GestionSeries;