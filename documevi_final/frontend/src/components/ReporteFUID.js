import React, { useState, useEffect } from 'react';
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
  

  useEffect(() => {
    // Cargar la lista de oficinas para el selector
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
    if (!selectedOficina) {
      setError('Por favor, seleccione una oficina.');
      return;
    }
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
    if (reportData.length === 0) {
      toast.success("No hay datos para exportar. Por favor, genere un reporte primero.");
      return;
    }

    const doc = new jsPDF();
    
    // Título y encabezado del reporte
    doc.text("Formato Único de Inventario Documental (FUID)", 14, 20);
    doc.setFontSize(12);
    doc.text(`Dependencia: ${reportData[0].nombre_dependencia}`, 14, 30);
    doc.text(`Oficina Productora: ${reportData[0].nombre_oficina}`, 14, 36);

    // Definimos las columnas que aparecerán en el PDF
    const tableColumn = ["N° Orden", "Cód. Serie", "Nombre Serie", "Cód. Subserie", "Nombre Subserie", "Fechas", "Folios", "Soporte"];
    const tableRows = [];

    // Mapeamos los datos del reporte a las filas de la tabla
    reportData.forEach(item => {
      const itemData = [
        item.numero_orden,
        item.codigo_serie,
        item.nombre_serie,
        item.codigo_subserie,
        item.nombre_subserie,
        `${new Date(item.fecha_apertura).toLocaleDateString()} - ${item.fecha_cierre ? new Date(item.fecha_cierre).toLocaleDateString() : 'Abierto'}`,
        item.numero_folios,
        item.soporte,
      ];
      tableRows.push(itemData);
    });

    // Usamos autoTable para crear la tabla en el PDF
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
    });

    // Guardamos el PDF con un nombre dinámico
    doc.save(`FUID_${reportData[0].nombre_oficina.replace(/\s/g, '_')}.pdf`);
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) {
      toast.success("No hay datos para exportar. Por favor, genere un reporte primero.");
      return;
    }

    // Preparamos los datos en un formato que la librería entienda (un array de objetos)
    const dataForExcel = reportData.map(item => ({
      'N° Orden': item.numero_orden,
      'Código Serie': item.codigo_serie,
      'Nombre Serie': item.nombre_serie,
      'Código Subserie': item.codigo_subserie,
      'Nombre Subserie': item.nombre_subserie,
      'Fechas Extremas': `${new Date(item.fecha_apertura).toLocaleDateString()} - ${item.fecha_cierre ? new Date(item.fecha_cierre).toLocaleDateString() : 'Abierto'}`,
      'N° Folios': item.numero_folios,
      'Soporte': item.soporte
    }));

    // Creamos una nueva hoja de cálculo a partir de los datos
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    // Creamos un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();
    // Añadimos la hoja de cálculo al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario FUID");
    // Generamos y descargamos el archivo .xlsx
    XLSX.writeFile(workbook, `FUID_${reportData[0].nombre_oficina.replace(/\s/g, '_')}.xlsx`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Reporte FUID (Formato Único de Inventario Documental)</h1>
      
      <form onSubmit={handleGenerateReport} style={{ marginBottom: '20px' }}>
        <select value={selectedOficina} onChange={(e) => setSelectedOficina(e.target.value)} required>
          <option value="">-- Seleccione una Oficina Productora --</option>
          {oficinas.map(ofi => (
            <option key={ofi.id} value={ofi.id}>{ofi.nombre_oficina}</option>
          ))}
        </select>
        <button type="submit" style={{ marginLeft: '10px' }} disabled={isLoading}>
          {isLoading ? 'Generando...' : 'Generar Reporte'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

      {reportData.length > 0 && (
        <>
          <button onClick={handleExportPDF} style={{marginBottom: '10px'}}>
            Exportar a PDF
          </button>
          <button onClick={handleExportExcel} style={{marginLeft: '10px'}}>
              Exportar a Excel
            </button>
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th>N° Orden</th>
                <th>Código Serie/Subserie</th>
                <th>Nombre Serie/Subserie</th>
                <th>Fechas Extremas</th>
                <th>N° Folios</th>
                <th>Soporte</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map(item => (
                <tr key={item.numero_orden}>
                  <td>{item.numero_orden}</td>
                  <td>{`${item.codigo_serie}${item.codigo_subserie ? '.' + item.codigo_subserie : ''}`}</td>
                  <td>{`${item.nombre_serie}${item.nombre_subserie ? ' / ' + item.nombre_subserie : ''}`}</td>
                  <td>{`${new Date(item.fecha_apertura).toLocaleDateString()} - ${item.fecha_cierre ? new Date(item.fecha_cierre).toLocaleDateString() : 'Abierto'}`}</td>
                  <td>{item.numero_folios}</td>
                  <td>{item.soporte}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ReporteFUID;