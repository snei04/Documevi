import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

const ReporteFUID = () => {
  const [oficinas, setOficinas] = useState([]);
  const [selectedOficina, setSelectedOficina] = useState('');
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Lógica para descubrir las cabeceras de las columnas personalizadas
  const customHeaders = useMemo(() => {
    if (!reportData || reportData.length === 0) return [];
    const headers = new Set();
    reportData.forEach(item => {
        if (item.metadatos_personalizados) {
            try {
                const metadata = JSON.parse(item.metadatos_personalizados);
                if (Array.isArray(metadata)) {
                    metadata.forEach(meta => headers.add(meta.nombre));
                }
            } catch (e) {}
        }
    });
    return Array.from(headers);
  }, [reportData]);

  useEffect(() => {
    const fetchOficinas = async () => {
      try {
        const res = await api.get('/oficinas');
        setOficinas(res.data);
      } catch (err) {
        setError('No se pudieron cargar las oficinas.');
      }
    };
    fetchOficinas();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!selectedOficina) return toast.warn('Por favor, seleccione una oficina.');
    setIsLoading(true);
    setError('');
    setReportData([]);
    try {
      const res = await api.get(`/reportes/fuid?oficinaId=${selectedOficina}`);
      setReportData(res.data);
    } catch (err) {
      setError('Error al generar el reporte.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!reportData || reportData.length === 0) return toast.warn("No hay datos para exportar.");
    
    const baseColumns = ["N° Orden", "Cód. Serie", "Nombre Serie", "Fechas", "Folios", "Soporte"];
    const tableColumn = [...baseColumns, ...customHeaders];
    
    // Ajuste de orientación: si hay muchas columnas, usamos formato horizontal (landscape)
    const orientation = tableColumn.length > 7 ? 'landscape' : 'portrait';
    const doc = new jsPDF({ orientation });

    doc.text("Formato Único de Inventario Documental (FUID)", 14, 20);
    doc.setFontSize(12);
    doc.text(`Oficina Productora: ${reportData[0].nombre_oficina}`, 14, 30);
    
    const tableRows = reportData.map(item => {
        let customValues = {};
        if (item.metadatos_personalizados) {
            try {
                const metadata = JSON.parse(item.metadatos_personalizados);
                if (Array.isArray(metadata)) {
                    metadata.forEach(meta => { customValues[meta.nombre] = meta.valor; });
                }
            } catch(e) {}
        }
        const row = [
            item.numero_orden,
            item.codigo_serie,
            item.nombre_serie,
            `${new Date(item.fecha_apertura).toLocaleDateString()} - ${item.fecha_cierre ? new Date(item.fecha_cierre).toLocaleDateString() : 'Abierto'}`,
            item.numero_folios,
            item.soporte,
            ...customHeaders.map(header => customValues[header] || '')
        ];
        return row;
    });

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 45 });
    doc.save(`FUID_${reportData[0].nombre_oficina.replace(/\s/g, '_')}.pdf`);
  };

  const handleExportExcel = () => {
    if (!reportData || reportData.length === 0) return toast.warn("No hay datos para exportar.");
    
    const dataForExcel = reportData.map(item => {
        let customValues = {};
        if (item.metadatos_personalizados) {
            try {
                const metadata = JSON.parse(item.metadatos_personalizados);
                if (Array.isArray(metadata)) {
                    metadata.forEach(meta => { customValues[meta.nombre] = meta.valor; });
                }
            } catch(e) {}
        }
        const baseData = {
            'N° Orden': item.numero_orden,
            'Código Serie': item.codigo_serie,
            'Nombre Serie': item.nombre_serie,
            'Fechas Extremas': `${new Date(item.fecha_apertura).toLocaleDateString()} - ${item.fecha_cierre ? new Date(item.fecha_cierre).toLocaleDateString() : 'Abierto'}`,
            'N° Folios': item.numero_folios,
            'Soporte': item.soporte
        };
        customHeaders.forEach(header => {
            baseData[header] = customValues[header] || '';
        });
        return baseData;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario FUID");
    XLSX.writeFile(workbook, `FUID_${reportData[0].nombre_oficina.replace(/\s/g, '_')}.xlsx`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Reporte FUID</h1>
      <form onSubmit={handleGenerateReport} style={{ marginBottom: '20px' }}>
        <select value={selectedOficina} onChange={(e) => setSelectedOficina(e.target.value)} required>
          <option value="">-- Seleccione una Oficina --</option>
          {oficinas.map(ofi => <option key={ofi.id} value={ofi.id}>{ofi.nombre_oficina}</option>)}
        </select>
        <button type="submit" style={{ marginLeft: '10px' }} disabled={isLoading}>
          {isLoading ? 'Generando...' : 'Generar Reporte'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

      {reportData.length > 0 && (
        <>
          <div style={{marginBottom: '10px', display: 'flex', gap: '10px'}}>
            <button onClick={handleExportPDF}>Exportar a PDF</button>
            <button onClick={handleExportExcel}>Exportar a Excel</button>
          </div>
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: '12px' }}>
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Cód. Serie</th>
                <th>Nombre Serie</th>
                <th>Fechas</th>
                <th>Folios</th>
                <th>Soporte</th>
                {customHeaders.map(header => <th key={header}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {reportData.map(item => {
                  let customValues = {};
                  if (item.metadatos_personalizados) {
                      try {
                          const metadata = JSON.parse(item.metadatos_personalizados);
                          if (Array.isArray(metadata)) {
                            metadata.forEach(meta => { customValues[meta.nombre] = meta.valor; });
                          }
                      } catch(e) {}
                  }
                  return (
                      <tr key={item.numero_orden}>
                          <td>{item.numero_orden}</td>
                          <td>{item.codigo_serie}</td>
                          <td>{item.nombre_serie}</td>
                          <td>{`${new Date(item.fecha_apertura).toLocaleDateString()} - ${item.fecha_cierre ? new Date(item.fecha_cierre).toLocaleDateString() : 'Abierto'}`}</td>
                          <td>{item.numero_folios}</td>
                          <td>{item.soporte}</td>
                          {customHeaders.map(header => <td key={header}>{customValues[header] || ''}</td>)}
                      </tr>
                  );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ReporteFUID;