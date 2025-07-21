import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import api from '../api/axios';
import Header from './Header';
import Sidebar from './Sidebar';
import './Dashboard.css';

const DashboardLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // 1. El estado de las dependencias ahora vive en el componente padre.
  const [dependencias, setDependencias] = useState([]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // 2. Función para obtener/refrescar la lista de dependencias.
  const fetchDependencias = async () => {
    try {
      const res = await api.get('/dependencias');
      setDependencias(res.data);
    } catch (err) {
      console.error("Error cargando dependencias en el layout", err);
    }
  };

  // 3. Obtenemos la lista cuando el layout se carga por primera vez.
  useEffect(() => {
    fetchDependencias();
  }, []);

  return (
    <div className="dashboard-container">
      <Header toggleSidebar={toggleSidebar} />
      <div className="dashboard-body">
        <Sidebar isOpen={isSidebarOpen} />
        <main className="main-content">
          {/* 4. Pasamos la lista y la función de refresco a los componentes hijos */}
          <Outlet context={{ dependencias, refreshDependencias: fetchDependencias }} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;