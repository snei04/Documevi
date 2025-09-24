import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import api from '../api/axios';
import Header from './Header';
import Sidebar from './Sidebar';
import './Dashboard.css';

const DashboardLayout = () => {
    // Estado para controlar la visibilidad del menú lateral
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    // --- 1. ESTADOS PARA TODOS LOS DATOS ---
    // Centralizamos aquí los datos que usarán los componentes hijos
    const [dependencias, setDependencias] = useState([]);
    const [oficinas, setOficinas] = useState([]);
    const [series, setSeries] = useState([]);
    const [subseries, setSubseries] = useState([]);
    // Puedes añadir más estados aquí a medida que los necesites (ej. plantillas, usuarios, etc.)

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    // --- 2. FUNCIÓN ÚNICA PARA CARGAR Y REFRESCAR TODOS LOS DATOS ---
    const refreshData = useCallback(async () => {
        try {
            // Usamos Promise.all para hacer todas las peticiones en paralelo
            const [depRes, ofiRes, serRes, subRes] = await Promise.all([
                api.get('/dependencias'),
                api.get('/oficinas'),
                api.get('/series'),
                api.get('/subseries')
            ]);
            
            // Actualizamos todos los estados con los datos recibidos
            setDependencias(depRes.data);
            setOficinas(ofiRes.data);
            setSeries(serRes.data);
            setSubseries(subRes.data);

        } catch (err) {
            console.error("Error cargando datos en el layout", err);
        }
    }, []); // useCallback con array vacío para que la función no se recree innecesariamente

    // Carga los datos la primera vez que el componente se monta
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    return (
        <div className="dashboard-container">
            <Header toggleSidebar={toggleSidebar} />
            <div className="dashboard-body">
                <Sidebar isOpen={isSidebarOpen} />
                <main className="main-content">
                    {/* --- 3. PASAMOS TODOS LOS DATOS Y LA FUNCIÓN DE REFRESCO A LOS HIJOS --- */}
                    <Outlet context={{ 
                        dependencias, 
                        oficinas,
                        series,
                        subseries,
                        refreshDependencias: refreshData,
                        refreshOficinas: refreshData,
                        refreshSeries: refreshData,
                        refreshSubseries: refreshData
                    }} />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;