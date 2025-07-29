import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

const GestionAuditoria = () => {
  const [auditLog, setAuditLog] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAuditLog = useCallback(async (start, end) => {
    setIsLoading(true);
    setError('');
    try {
      let url = '/auditoria';
      if (start && end) {
        url += `?startDate=${start}&endDate=${end}`;
      }
      const res = await api.get(url);
      setAuditLog(res.data);
    } catch (err) {
      setError('No se pudo cargar el registro de auditoría.');
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
      toast.success("No hay datos para exportar.");
      return;
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

  return (
    <div style={{ padding: '20px' }}>
      <h1>Registro de Auditoría del Sistema</h1>
      <p>Aquí se registran todas las acciones importantes realizadas en la plataforma.</p>
      
      {/* 👇 AQUÍ AÑADIMOS LA LÍNEA PARA MOSTRAR EL ERROR 👇 */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <form onSubmit={handleFilter}>
          <label>Desde: </label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <label style={{ marginLeft: '10px' }}>Hasta: </label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button type="submit" style={{ marginLeft: '10px' }}>Filtrar</button>
        </form>
        <button onClick={handleExportExcel}>Exportar a Excel</button>
      </div>

      {isLoading ? (
        <p>Cargando registro...</p>
      ) : (
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th style={{ padding: '8px' }}>Fecha</th>
              <th style={{ padding: '8px' }}>Usuario</th>
              <th style={{ padding: '8px' }}>Acción</th>
              <th style={{ padding: '8px' }}>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {auditLog.map(log => (
              <tr key={log.id}>
                <td style={{ padding: '8px' }}>{new Date(log.fecha).toLocaleString()}</td>
                <td style={{ padding: '8px' }}>{log.usuario || 'N/A'}</td>
                <td style={{ padding: '8px' }}>{log.accion}</td>
                <td style={{ padding: '8px' }}>{log.detalles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GestionAuditoria;