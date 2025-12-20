import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Header from './Header';
import Sidebar from './Sidebar';
import './Dashboard.css';

// --- 1. IMPORT THE NECESSARY TOOLS ---
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';
import { usePermissionsContext } from '../context/PermissionsContext';
import { toast } from 'react-toastify';

const DashboardLayout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    // States for your data (no changes here)
    const [dependencias, setDependencias] = useState([]);
    const [oficinas, setOficinas] = useState([]);
    const [series, setSeries] = useState([]);
    const [subseries, setSubseries] = useState([]);
    
    // --- 2. PREPARE THE LOGOUT LOGIC ---
    const navigate = useNavigate();
    const { clearPermissions } = usePermissionsContext();

    // We use useCallback to create a stable function that won't be recreated on every render.
    const handleLogout = useCallback(() => {
        // Call the backend to clear the secure HttpOnly cookie.
        api.post('/auth/logout')
            .catch(err => console.error("Logout API call failed, but proceeding with client-side logout:", err))
            .finally(() => {
                clearPermissions();
                navigate('/login');
                toast.info("Your session has expired due to inactivity.");
            });
    }, [clearPermissions, navigate]);

    // --- 3. START THE INACTIVITY TIMER ---
    // The hook will now monitor user activity.
    // 1 hour = 60 minutes * 60 seconds * 1000 milliseconds
    useInactivityTimeout(handleLogout, 3600 * 1000);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    // Data fetching logic remains the same
    const refreshData = useCallback(async () => {
        try {
            const [depRes, ofiRes, serRes, subRes] = await Promise.all([
                api.get('/dependencias'),
                api.get('/oficinas'),
                api.get('/series'),
                api.get('/subseries')
            ]);
            
            setDependencias(depRes.data);
            setOficinas(ofiRes.data);
            setSeries(serRes.data);
            setSubseries(subRes.data);

        } catch (err) {
            console.error("Error loading data in layout", err);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    return (
        <div className="dashboard-container">
            <Header toggleSidebar={toggleSidebar} />
            <div className="dashboard-body">
                <Sidebar isOpen={isSidebarOpen} />
                <main className="main-content">
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
            
            {/* Footer del dashboard */}
            <footer className="dashboard-footer">
                <span>Todos los derechos reservados 2025 | Desarrollado por IMEVISAS desde el equipo de TI</span>
                <span>Versión: v1.1.1</span>
            </footer>
        </div>
    );
};

export default DashboardLayout;