import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import './Dashboard.css';

Modal.setAppElement('#root');

const ReporteFUID = () => {
    const [oficinas, setOficinas] = useState([]);
    const [series, setSeries] = useState([]);
    const [selectedOficina, setSelectedOficina] = useState('');
    const [filters, setFilters] = useState({
        serie_id: '',
        fecha_inicio: '',
        fecha_fin: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
    });
    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Trazabilidad
    const [isTrazabilidadOpen, setIsTrazabilidadOpen] = useState(false);
    const [trazabilidadData, setTrazabilidadData] = useState([]);
    const [selectedExpediente, setSelectedExpediente] = useState(null);

    const customHeaders = useMemo(() => {
        if (!reportData || reportData.length === 0) return [];
        const headers = new Set();
        reportData.forEach(item => {
            if (item.metadatos_personalizados) {
                try {
                    const metadata = typeof item.metadatos_personalizados === 'string'
                        ? JSON.parse(item.metadatos_personalizados)
                        : item.metadatos_personalizados;

                    if (Array.isArray(metadata)) {
                        metadata.forEach(meta => headers.add(meta.nombre));
                    }
                } catch (e) { }
            }
        });
        return Array.from(headers);
    }, [reportData]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [resOficinas, resSeries] = await Promise.all([
                    api.get('/oficinas'),
                    api.get('/series')
                ]);
                setOficinas(resOficinas.data);
                setSeries(resSeries.data);
            } catch (err) {
                setError('No se pudieron cargar los datos iniciales.');
            }
        };
        fetchInitialData();
    }, []);

    const fetchReportData = async (page = 1) => {
        if (!selectedOficina) return toast.warn('Por favor, seleccione una oficina.');

        setIsLoading(true);
        setError('');

        try {
            const queryParams = new URLSearchParams({
                oficinaId: selectedOficina,
                serieId: filters.serie_id,
                fechaInicio: filters.fecha_inicio,
                fechaFin: filters.fecha_fin,
                page: page,
                limit: pagination.limit
            });

            const res = await api.get(`/reportes/fuid?${queryParams.toString()}`);

            // Backend ahora retorna { data: [], pagination: {} }
            if (res.data.pagination) {
                setReportData(res.data.data);
                setPagination(prev => ({
                    ...prev,
                    ...res.data.pagination
                }));
            } else {
                // Fallback por si el backend no ha desplegado cambios
                setReportData(res.data);
            }

            if (res.data.data && res.data.data.length === 0) toast.info('No se encontraron expedientes para esta búsqueda.');
        } catch (err) {
            console.error(err);
            setError('Error al generar el reporte.');
            toast.error('Error al generar el reporte');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateReport = (e) => {
        e.preventDefault();
        fetchReportData(1); // Siempre buscar página 1 al filtrar
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchReportData(newPage);
        }
    };

    const handleVerTrazabilidad = async (expediente) => {
        setSelectedExpediente(expediente);
        try {
            const res = await api.get(`/reportes/fuid/trazabilidad/${expediente.id}`);
            setTrazabilidadData(res.data);
            setIsTrazabilidadOpen(true);
        } catch (error) {
            toast.error('Error al cargar trazabilidad');
        }
    };

    // Función auxiliar para obtener TODOS los datos para exportación
    const fetchAllDataForExport = async () => {
        const queryParams = new URLSearchParams({
            oficinaId: selectedOficina,
            serieId: filters.serie_id,
            fechaInicio: filters.fecha_inicio,
            fechaFin: filters.fecha_fin,
            limit: 100000 // Límite alto para traer todo
        });
        const res = await api.get(`/reportes/fuid?${queryParams.toString()}`);
        return res.data.data || res.data; // Manejar si devuelve paginado o array directo
    };

    const handleExportPDF = async () => {
        if (!selectedOficina) return toast.warn("Genere el reporte primero.");

        const toastId = toast.loading("Preparando PDF completo...");

        try {
            const allData = await fetchAllDataForExport();

            if (!allData || allData.length === 0) {
                toast.update(toastId, { render: "No hay datos para exportar.", type: "warning", isLoading: false, autoClose: 3000 });
                return;
            }

            const baseColumns = ["N° Orden", "Código", "Nombre Serie/Subserie", "Fechas Extremas", "Folios", "Soporte", "Ubicación", "Retención"];

            // Recalcular headers custom para el dataset completo
            const allCustomHeaders = new Set();
            allData.forEach(item => {
                if (item.metadatos_personalizados) {
                    try {
                        const metadata = typeof item.metadatos_personalizados === 'string' ? JSON.parse(item.metadatos_personalizados) : item.metadatos_personalizados;
                        if (Array.isArray(metadata)) metadata.forEach(meta => allCustomHeaders.add(meta.nombre));
                    } catch (e) { }
                }
            });
            const customHeadersList = Array.from(allCustomHeaders);

            const tableColumn = [...baseColumns, ...customHeadersList];
            const orientation = tableColumn.length > 6 ? 'landscape' : 'portrait';
            const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

            doc.setFontSize(14);
            doc.text("Formato Único de Inventario Documental (FUID)", 14, 15);

            doc.setFontSize(10);
            doc.text(`Oficina Productora: ${oficinas.find(o => o.id === parseInt(selectedOficina))?.nombre_oficina || ''}`, 14, 22);
            doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString()}`, 14, 27);

            const tableRows = allData.map(item => {
                let customValues = {};
                if (item.metadatos_personalizados) {
                    try {
                        const metadata = typeof item.metadatos_personalizados === 'string' ? JSON.parse(item.metadatos_personalizados) : item.metadatos_personalizados;
                        if (Array.isArray(metadata)) metadata.forEach(meta => { customValues[meta.nombre] = meta.valor; });
                    } catch (e) { }
                }

                return [
                    item.numero_orden,
                    `${item.codigo_serie}${item.codigo_subserie ? '-' + item.codigo_subserie : ''}`,
                    `${item.nombre_serie}${item.nombre_subserie ? '\n' + item.nombre_subserie : ''}`,
                    `${new Date(item.fecha_apertura).toLocaleDateString()} - ${item.fecha_cierre ? new Date(item.fecha_cierre).toLocaleDateString() : 'Abierto'}`,
                    item.numero_folios,
                    item.soporte,
                    item.ubicacion_fisica,
                    item.fase_retencion,
                    ...customHeadersList.map(header => customValues[header] || '')
                ];
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [41, 128, 185] },
                alternateRowStyles: { fillColor: [240, 240, 240] }
            });

            const fileName = `FUID_Completo.pdf`;
            doc.save(fileName);
            toast.update(toastId, { render: "PDF exportado correctamente", type: "success", isLoading: false, autoClose: 3000 });
        } catch (err) {
            console.error(err);
            toast.update(toastId, { render: "Error al exportar PDF", type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    const handleExportExcel = async () => {
        if (!selectedOficina) return toast.warn("Genere el reporte primero.");

        const toastId = toast.loading("Preparando Excel completo...");

        try {
            const allData = await fetchAllDataForExport();

            if (!allData || allData.length === 0) {
                toast.update(toastId, { render: "No hay datos para exportar.", type: "warning", isLoading: false, autoClose: 3000 });
                return;
            }

            // Recalcular headers custom
            const allCustomHeaders = new Set();
            allData.forEach(item => {
                if (item.metadatos_personalizados) {
                    try {
                        const metadata = typeof item.metadatos_personalizados === 'string' ? JSON.parse(item.metadatos_personalizados) : item.metadatos_personalizados;
                        if (Array.isArray(metadata)) metadata.forEach(meta => allCustomHeaders.add(meta.nombre));
                    } catch (e) { }
                }
            });
            const customHeadersList = Array.from(allCustomHeaders);

            const dataForExcel = allData.map(item => {
                let customValues = {};
                if (item.metadatos_personalizados) {
                    try {
                        const metadata = typeof item.metadatos_personalizados === 'string' ? JSON.parse(item.metadatos_personalizados) : item.metadatos_personalizados;
                        if (Array.isArray(metadata)) metadata.forEach(meta => { customValues[meta.nombre] = meta.valor; });
                    } catch (e) { }
                }
                const baseData = {
                    'N° Orden': item.numero_orden,
                    'Código Serie': item.codigo_serie,
                    'Nombre Serie': item.nombre_serie,
                    'Código Subserie': item.codigo_subserie || '',
                    'Nombre Subserie': item.nombre_subserie || '',
                    'Fechas Extremas': `${new Date(item.fecha_apertura).toLocaleDateString()} - ${item.fecha_cierre ? new Date(item.fecha_cierre).toLocaleDateString() : 'Abierto'}`,
                    'N° Folios': item.numero_folios,
                    'Soporte': item.soporte,
                    'Ubicación Física': item.ubicacion_fisica,
                    'Fase Retención': item.fase_retencion,
                    'Disposición Final': item.disposicion_final,
                    'Detalle Retención': item.info_retencion
                };
                customHeadersList.forEach(header => {
                    baseData[header] = customValues[header] || '';
                });
                return baseData;
            });

            const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario FUID");
            XLSX.writeFile(workbook, `FUID_Completo.xlsx`);
            toast.update(toastId, { render: "Excel exportado correctamente", type: "success", isLoading: false, autoClose: 3000 });
        } catch (err) {
            console.error(err);
            toast.update(toastId, { render: "Error al exportar Excel", type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Reporte FUID (Formato Único de Inventario Documental)</h1>
            </div>

            <div className="content-box">
                <h3>Generar Reporte por Oficina</h3>
                <form onSubmit={handleGenerateReport}>
                    <div className="filters-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                        <div className="form-group">
                            <label>Oficina Productora *</label>
                            <select
                                value={selectedOficina}
                                onChange={(e) => setSelectedOficina(e.target.value)}
                                required
                                className="form-input"
                                style={{ backgroundColor: 'white', color: '#333' }}
                            >
                                <option value="">-- Seleccione --</option>
                                {oficinas.map(ofi => (
                                    <option key={ofi.id} value={ofi.id}>{ofi.nombre_oficina}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Serie Documental</label>
                            <select
                                value={filters.serie_id}
                                onChange={(e) => setFilters({ ...filters, serie_id: e.target.value })}
                                className="form-input"
                                style={{ backgroundColor: 'white', color: '#333' }}
                            >
                                <option value="">Todas las Series</option>
                                {series.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre_serie} ({s.codigo_serie})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Fecha Apertura (Desde)</label>
                            <input
                                type="date"
                                value={filters.fecha_inicio}
                                onChange={(e) => setFilters({ ...filters, fecha_inicio: e.target.value })}
                                className="form-input"
                                style={{ backgroundColor: 'white', color: '#333' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Fecha Apertura (Hasta)</label>
                            <input
                                type="date"
                                value={filters.fecha_fin}
                                onChange={(e) => setFilters({ ...filters, fecha_fin: e.target.value })}
                                className="form-input"
                                style={{ backgroundColor: 'white', color: '#333' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="button button-primary" disabled={isLoading}>
                        {isLoading ? 'Generando...' : 'Generar Reporte FUID'}
                    </button>
                    {reportData.length > 0 && (
                        <span style={{ marginLeft: '10px' }}>
                            Mostrando {reportData.length} de {pagination.total} registros
                        </span>
                    )}
                </form>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </div>

            {reportData.length > 0 && (
                <div className="content-box">
                    <div className="action-bar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <button onClick={handleExportPDF} className="button">📄 Exportar Todo PDF</button>
                            <button onClick={handleExportExcel} className="button" style={{ marginLeft: '10px' }}>📊 Exportar Todo Excel</button>
                        </div>

                        {/* Paginación */}
                        {pagination.totalPages > 1 && (
                            <div className="pagination-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button
                                    className="button button-secondary"
                                    disabled={pagination.page === 1}
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                >
                                    Anterior
                                </button>
                                <span>Página {pagination.page} de {pagination.totalPages}</span>
                                <button
                                    className="button button-secondary"
                                    disabled={pagination.page === pagination.totalPages}
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="table-responsive">
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>N° Orden</th>
                                    <th>Código</th>
                                    <th>Serie / Subserie</th>
                                    <th>Fechas Extremas</th>
                                    <th>Folios</th>
                                    <th>Ubicación</th>
                                    <th>Retención</th>
                                    {customHeaders.map(header => (
                                        <th key={header}>{header}</th>
                                    ))}
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map(item => {
                                    // Parsear metadatos para cada fila
                                    let customValues = {};
                                    if (item.metadatos_personalizados) {
                                        try {
                                            const metadata = typeof item.metadatos_personalizados === 'string'
                                                ? JSON.parse(item.metadatos_personalizados)
                                                : item.metadatos_personalizados;
                                            if (Array.isArray(metadata)) {
                                                metadata.forEach(meta => { customValues[meta.nombre] = meta.valor; });
                                            }
                                        } catch (e) { }
                                    }

                                    return (
                                        <tr key={item.id}>
                                            <td>{item.numero_orden}</td>
                                            <td>{item.codigo_serie}{item.codigo_subserie ? `-${item.codigo_subserie}` : ''}</td>
                                            <td>
                                                <strong>{item.nombre_serie}</strong>
                                                {item.nombre_subserie && <><br /><small>{item.nombre_subserie}</small></>}
                                            </td>
                                            <td>
                                                {new Date(item.fecha_apertura).toLocaleDateString()}
                                                <br />
                                                {item.fecha_cierre ? new Date(item.fecha_cierre).toLocaleDateString() : <span className="text-muted">Abierto</span>}
                                            </td>
                                            <td>{item.numero_folios}</td>
                                            <td>{item.ubicacion_fisica}</td>
                                            <td>
                                                <span className={`status-badge ${item.fase_retencion === 'Vigente' ? 'status-active' : 'status-warning'}`}>
                                                    {item.fase_retencion}
                                                </span>
                                                {item.fecha_fin_gestion && <><br /><small title="Fin Gestión">{new Date(item.fecha_fin_gestion).toLocaleDateString()}</small></>}
                                            </td>

                                            {/* Renderizar valores de campos personalizados */}
                                            {customHeaders.map(header => (
                                                <td key={header}>{customValues[header] || '-'}</td>
                                            ))}

                                            <td>
                                                <button onClick={() => handleVerTrazabilidad(item)}
                                                    className="button button-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                                                    🕒 Trazabilidad
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Trazabilidad */}
            <Modal isOpen={isTrazabilidadOpen} onRequestClose={() => setIsTrazabilidadOpen(false)}
                className="modal" overlayClassName="modal-overlay">
                <h2>🕒 Trazabilidad del Expediente</h2>
                {selectedExpediente && <p><strong>Expediente:</strong> {selectedExpediente.nombre_expediente}</p>}

                <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '15px' }}>
                    {trazabilidadData.length === 0 ? (
                        <p>No hay registros de actividad para este expediente.</p>
                    ) : (
                        <ul className="timeline">
                            {trazabilidadData.map((log, index) => (
                                <li key={index} style={{ marginBottom: '15px', borderLeft: '2px solid #ccc', paddingLeft: '15px' }}>
                                    <div style={{ fontWeight: 'bold' }}>{new Date(log.fecha).toLocaleString()}</div>
                                    <div style={{ color: '#0056b3' }}>{log.accion}</div>
                                    <div>{log.usuario} ({log.rol})</div>
                                    <div style={{ fontSize: '0.9rem', color: '#555' }}>
                                        {/* Intentar parsear JSON si es posible, sino mostrar texto */}
                                        {(() => {
                                            try {
                                                const detailObj = JSON.parse(log.detalles);
                                                return <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(detailObj, null, 2)}</pre>;
                                            } catch (e) {
                                                return log.detalles;
                                            }
                                        })()}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="modal-actions" style={{ marginTop: '20px' }}>
                    <button onClick={() => setIsTrazabilidadOpen(false)} className="button">Cerrar</button>
                </div>
            </Modal>
        </div>
    );
};

export default ReporteFUID;