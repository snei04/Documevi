import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- IMPORTACIONES DE SEGURIDAD Y CONTEXTO ---
import { PermissionsProvider, usePermissionsContext } from './context/PermissionsContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// --- IMPORTACIONES VISUALES Y DE ESTILOS ---
import logoImevi from './assets/logo-imevi.png';
import './App.css';

// --- IMPORTACIÓN DE COMPONENTES DE PÁGINA ---
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './components/DashboardHome';
import Search from './components/Search';
import GestionDependencias from './components/GestionDependencias';
import GestionOficinas from './components/GestionOficinas';
import GestionSeries from './components/GestionSeries';
import GestionSubseries from './components/GestionSubseries';
import GestionExpedientes from './components/GestionExpedientes';
import CapturaDocumento from './components/CapturaDocumento';
import ExpedienteDetalle from './components/ExpedienteDetalle';
import WorkflowDetalle from './components/WorkflowDetalle';
import GestionWorkflows from './components/GestionWorkflows';
import GestionPrestamos from './components/GestionPrestamos';
import MisTareas from './components/MisTareas';
import GestionUsuarios from './components/GestionUsuarios';
import ReporteFUID from './components/ReporteFUID';
import SetPassword from './components/SetPassword';
import GestionAuditoria from './components/GestionAuditoria';
import Estadisticas from './components/Estadisticas';
import GestionRoles from './components/GestionRoles';
import OneDriveViewer from './components/OneDriveViewer';
import GestionTransferencias from './components/GestionTransferencias';
import GestionPermisos from './components/GestionPermisos';
import GestionCamposPersonalizados from './components/GestionCamposPersonalizados'; 
import GestionPlantillas from './components/GestionPlantillas'; 
import PlantillaDetalle from './components/PlantillaDetalle';
import DiseñadorPlantilla from './components/DiseñadorPlantilla';
import GestionEliminacion from './components/GestionEliminacion';
import MisPrestamos from './components/MisPrestamos';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import GestionarPermisosMaestro from './components/GestionarPermisosMaestro';
import api from './api/axios';

// --- COMPONENTES AUXILIARES ---
const UnauthorizedPage = () => (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Acceso Denigado</h1>
        <p>No tienes los permisos necesarios para ver esta página.</p>
    </div>
);

const AppContent = () => {
    // Accedemos al contexto de permisos
    const { loadPermissions, setLoading } = usePermissionsContext();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const verifySession = async () => {
            if (token) {
                
                // Si hay token, intentamos verificar la sesión y cargar permisos
                setLoading(true); 
                try {
                    const response = await api.get('/usuarios/perfil');
                    // Si la API responde, cargamos los permisos.
                    // 'loadPermissions' pondrá 'loading' en 'false' automáticamente.
                    loadPermissions(response.data.permissions); 
                } catch (error) {
                    console.error("Error al cargar perfil de usuario, token inválido o expirado.", error);
                    localStorage.removeItem('token');
                    // Si hay un error, también llamamos a 'loadPermissions' para limpiar
                    // el estado y poner 'loading' en 'false'.
                    loadPermissions([]);
                }
            } else {
                // Si no hay token, no hay sesión que cargar.
                loadPermissions([]);
            }
        };

        verifySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div className="App">
            <Routes>
                {/* --- RUTA DE LOGIN CON DISEÑO ORIGINAL --- */}
                <Route path="/login" element={
                    <>
                        <img src={logoImevi} alt="Logo IMEVI" className="top-left-logo" />
                        <div className="content-center">
                            <Login />
                        </div>
                    </>
                } />
                
                {/* --- OTRAS RUTAS PÚBLICAS --- */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/set-password/:token" element={<SetPassword />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* --- RUTAS PROTEGIDAS (DASHBOARD) --- */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route index element={<DashboardHome />} />
                        <Route path="mis-tareas" element={<MisTareas />} />
                        <Route path="search" element={<Search />} />
                        <Route path="mis-prestamos" element={<MisPrestamos />} />
                        <Route path="visor-onedrive" element={<OneDriveViewer />} />

                        <Route element={<ProtectedRoute permission="gestionar_expedientes" />}>
                            <Route path="expedientes" element={<GestionExpedientes />} />
                            <Route path="expedientes/:id" element={<ExpedienteDetalle />} />
                            <Route path="captura" element={<CapturaDocumento />} />
                        </Route>

                         <Route element={<ProtectedRoute permission="gestionar_parametros_trd" />}>
                            <Route path="dependencias" element={<GestionDependencias />} />
                            <Route path="oficinas" element={<GestionOficinas />} />
                            <Route path="series" element={<GestionSeries />} />
                            <Route path="subseries" element={<GestionSubseries />} />
                        </Route>

                         <Route element={<ProtectedRoute permission="gestionar_usuarios" />}>
                            <Route path="usuarios" element={<GestionUsuarios />} />
                            <Route path="roles" element={<GestionRoles />} />
                            <Route path="auditoria" element={<GestionAuditoria />} />
                            <Route path="permisos" element={<GestionarPermisosMaestro />} />
                            <Route path="campos-personalizados" element={<GestionCamposPersonalizados />} />
                            <Route path="plantillas" element={<GestionPlantillas />} />
                            <Route path="plantillas/:id" element={<PlantillaDetalle />} />
                            <Route path="plantillas/:id/disenar" element={<DiseñadorPlantilla />} />
                            <Route path="transferencias" element={<GestionTransferencias />} />
                            <Route path="eliminacion" element={<GestionEliminacion />} />
                            <Route path="estadisticas" element={<Estadisticas />} />
                            <Route path="reportes-fuid" element={<ReporteFUID />} />
                        </Route>

                        <Route element={<ProtectedRoute permission="gestionar_roles_permisos" />}>
                            <Route path="roles/:id_rol/permisos" element={<GestionPermisos />} />
                        </Route>
                        
                        <Route path="workflows" element={<GestionWorkflows />} />
                        <Route path="workflows/:id" element={<WorkflowDetalle />} />
                        <Route path="prestamos" element={<GestionPrestamos />} />
                    </Route>
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </div>
    );
};

function App() {
    return (
        <Router>
            <PermissionsProvider>
                {/* Contenedor de notificaciones global */}
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
                <AppContent />
            </PermissionsProvider>
        </Router>
    );
}

export default App;