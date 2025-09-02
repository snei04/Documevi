import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import './Dashboard.css'; // Asegúrate de que el CSS esté importado

const GestionAuditoria = () => {
  const [auditLog, setAuditLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAuditLog = useCallback(async (start, end) => {
    setIsLoading(true);
    try {
      let url = '/auditoria';
      if (start && end) {
        url += `?startDate=${start}&endDate=${end}`;
      }
      const res = await api.get(url);
      setAuditLog(res.data);
    } catch (err) {
      toast.error('No se pudo cargar el registro de auditoría.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchAuditLog(startDate, endDate);
  };

  const handleExportExcel = () => {
    if (auditLog.length === 0) {
      return toast.warn("No hay datos para exportar.");
    }
    const dataForExcel = auditLog.map(log => ({
      'Fecha': new Date(log.fecha).toLocaleString(),
      'Usuario': log.usuario || 'N/A',
      'Acción': log.accion,
      'Detalles': log.detalles
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoria");
    XLSX.writeFile(workbook, "Reporte_Auditoria.xlsx");
  };

  if (isLoading) return <div>Cargando registro de auditoría...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Registro de Auditoría del Sistema</h1>
        <p>Aquí se registran todas las acciones importantes realizadas en la plataforma.</p>
      </div>

      <div className="content-box">
        <h3>Filtros y Acciones</h3>
        <div className="action-bar">
          <form onSubmit={handleFilter} className="action-bar">
            <label>Desde: </label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <label style={{ marginLeft: '10px' }}>Hasta: </label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <button type="submit" className="button button-primary">Filtrar</button>
          </form>
          <button onClick={handleExportExcel} className="button">Exportar a Excel</button>
        </div>
      </div>

      <h3>Registros de Auditoría</h3>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Acción</th>
            <th>Detalles</th>
          </tr>
        </thead>
        <tbody>
          {auditLog.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.fecha).toLocaleString()}</td>
              <td>{log.usuario || 'N/A'}</td>
              <td>{log.accion}</td>
              <td>{log.detalles}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GestionAuditoria;