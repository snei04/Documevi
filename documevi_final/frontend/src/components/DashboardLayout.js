import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import api from '../api/axios';
import Header from './Header';
import Sidebar from './Sidebar';
import './Dashboard.css';

const DashboardLayout = () => {
  // 👇 AQUÍ ESTÁ EL CAMBIO. Inicia en 'false' para que el menú esté oculto.
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const [dependencias, setDependencias] = useState([]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const fetchDependencias = async () => {
    try {
      const res = await api.get('/dependencias');
      setDependencias(res.data);
    } catch (err) {
      console.error("Error cargando dependencias en el layout", err);
    }
  };

  useEffect(() => {
    fetchDependencias();
  }, []);

  return (
    <div className="dashboard-container">
      <Header toggleSidebar={toggleSidebar} />
      <div className="dashboard-body">
        <Sidebar isOpen={isSidebarOpen} />
        <main className="main-content">
          <Outlet context={{ dependencias, refreshDependencias: fetchDependencias }} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;