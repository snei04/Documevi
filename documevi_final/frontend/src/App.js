/**
 * @fileoverview Componente principal de la aplicación Documevi SGDEA.
 * Define la estructura de rutas, proveedores de contexto y configuración global.
 * 
 * Este archivo es el punto de entrada de la aplicación React y contiene:
 * - Configuración del enrutador (React Router v6)
 * - Proveedor de contexto de permisos
 * - Definición de rutas públicas y protegidas
 * - Verificación de sesión al iniciar
 * 
 * @module App
 * @requires react
 * @requires react-router-dom
 * @requires react-toastify
 * 
 * @example
 * // Punto de entrada en index.js
 * import App from './App';
 * ReactDOM.render(<App />, document.getElementById('root'));
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ============================================
// IMPORTACIONES DE SEGURIDAD Y CONTEXTO
// ============================================
import { PermissionsProvider, usePermissionsContext } from './context/PermissionsContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// ============================================
// IMPORTACIONES VISUALES Y DE ESTILOS
// ============================================
import logoImevi from './assets/logo-imevi.png';
import './App.css';

// ============================================
// IMPORTACIÓN DE COMPONENTES DE PÁGINA
// ============================================

/** Componentes de autenticación */
import Login from './components/Login';
import SetPassword from './components/SetPassword';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

/** Layout principal del dashboard */
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './components/DashboardHome';

/** Componentes de usuario */
import MiPerfil from './components/MiPerfil';
import MisTareas from './components/MisTareas';
import MisPrestamos from './components/MisPrestamos';
import Search from './components/Search';

/** Gestión de TRD (Tabla de Retención Documental) */
import GestionDependencias from './components/GestionDependencias';
import GestionOficinas from './components/GestionOficinas';
import GestionSeries from './components/GestionSeries';
import GestionSubseries from './components/GestionSubseries';

/** Gestión de expedientes y documentos */
import GestionExpedientes from './components/GestionExpedientes';
import ExpedienteDetalle from './components/ExpedienteDetalle';
import CapturaDocumento from './components/CapturaDocumento';

/** Gestión de workflows */
import GestionWorkflows from './components/GestionWorkflows';
import WorkflowDetalle from './components/WorkflowDetalle';

/** Gestión de préstamos */
import GestionPrestamos from './components/GestionPrestamos';

/** Administración de usuarios y roles */
import GestionUsuarios from './components/GestionUsuarios';
import GestionRoles from './components/GestionRoles';
import GestionPermisos from './components/GestionPermisos';
import GestionarPermisosMaestro from './components/GestionarPermisosMaestro';

/** Reportes y estadísticas */
import ReporteFUID from './components/ReporteFUID';
import Estadisticas from './components/Estadisticas';
import GestionAuditoria from './components/GestionAuditoria';

/** Gestión documental avanzada */
import GestionTransferencias from './components/GestionTransferencias';
import GestionEliminacion from './components/GestionEliminacion';
import RetencionDocumental from './components/RetencionDocumental';

/** Configuración del sistema */
import GestionCamposPersonalizados from './components/GestionCamposPersonalizados';
import GestionPlantillas from './components/GestionPlantillas';
import PlantillaDetalle from './components/PlantillaDetalle';
import DiseñadorPlantilla from './components/DiseñadorPlantilla';

/** Integraciones externas */
import OneDriveViewer from './components/OneDriveViewer';

/** Instancia de API configurada */
import api from './api/axios';

// ============================================
// COMPONENTES AUXILIARES
// ============================================

/**
 * Página de acceso denegado.
 * Se muestra cuando el usuario intenta acceder a una ruta sin los permisos necesarios.
 * 
 * @component
 * @returns {JSX.Element} Mensaje de acceso denegado
 */
const UnauthorizedPage = () => (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Acceso Denegado</h1>
        <p>No tienes los permisos necesarios para ver esta página.</p>
    </div>
);

// ============================================
// COMPONENTE PRINCIPAL DE CONTENIDO
// ============================================

/**
 * Componente interno que maneja el contenido de la aplicación.
 * Se encarga de verificar la sesión del usuario y definir las rutas.
 * 
 * Este componente debe estar envuelto por PermissionsProvider para
 * poder acceder al contexto de permisos.
 * 
 * @component
 * @returns {JSX.Element} Estructura de rutas de la aplicación
 */
const AppContent = () => {
    // Hook para acceder al contexto de permisos
    const { loadPermissions, setLoading } = usePermissionsContext();
    
    // Token JWT almacenado en localStorage
    const token = localStorage.getItem('token');

    /**
     * Efecto que verifica la sesión del usuario al cargar la aplicación.
     * Si existe un token, intenta obtener el perfil y cargar los permisos.
     * Si el token es inválido o expiró, limpia el estado de autenticación.
     */
    useEffect(() => {
        const verifySession = async () => {
            if (token) {
                // Activar estado de carga mientras se verifica la sesión
                setLoading(true); 
                try {
                    // Obtener perfil del usuario autenticado
                    const response = await api.get('/usuarios/perfil');
                    
                    // Cargar permisos del usuario (esto también desactiva el loading)
                    loadPermissions(response.data.permissions); 
                } catch (error) {
                    // Token inválido o expirado - limpiar sesión
                    console.error("Error al cargar perfil de usuario, token inválido o expirado.", error);
                    localStorage.removeItem('token');
                    
                    // Limpiar permisos y desactivar loading
                    loadPermissions([]);
                }
            } else {
                // Sin token = sin sesión activa
                loadPermissions([]);
            }
        };

        verifySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // ============================================
    // RENDERIZADO DE RUTAS
    // ============================================
    return (
        <div className="App">
            <Routes>
                {/* ========================================
                    RUTAS PÚBLICAS (Sin autenticación)
                   ======================================== */}
                
                {/* Página de login con logo corporativo */}
                <Route path="/login" element={
                    <>
                        <img src={logoImevi} alt="Logo IMEVI" className="top-left-logo" />
                        <div className="content-center">
                            <Login />
                        </div>
                    </>
                } />
                
                {/* Rutas de recuperación de contraseña */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/set-password/:token" element={<SetPassword />} />
                
                {/* Página de acceso denegado */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* ========================================
                    RUTAS PROTEGIDAS (Requieren autenticación)
                   ======================================== */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardLayout />}>
                        
                        {/* --- Rutas de acceso general (sin permiso específico) --- */}
                        <Route index element={<DashboardHome />} />
                        <Route path="mis-tareas" element={<MisTareas />} />
                        <Route path="mi-perfil" element={<MiPerfil />} />
                        <Route path="search" element={<Search />} />
                        <Route path="mis-prestamos" element={<MisPrestamos />} />
                        <Route path="visor-onedrive" element={<OneDriveViewer />} />

                        {/* --- Gestión de Expedientes y Documentos --- */}
                        <Route element={<ProtectedRoute permission="expedientes_ver" />}>
                            <Route path="expedientes" element={<GestionExpedientes />} />
                            <Route path="expedientes/:id" element={<ExpedienteDetalle />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="expedientes_crear" />}>
                            <Route path="captura" element={<CapturaDocumento />} />
                        </Route>

                        {/* --- Gestión de TRD (Tabla de Retención Documental) --- */}
                        <Route element={<ProtectedRoute permission="dependencias_ver" />}>
                            <Route path="dependencias" element={<GestionDependencias />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="oficinas_ver" />}>
                            <Route path="oficinas" element={<GestionOficinas />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="series_ver" />}>
                            <Route path="series" element={<GestionSeries />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="subseries_ver" />}>
                            <Route path="subseries" element={<GestionSubseries />} />
                        </Route>

                        {/* --- Administración de Usuarios y Roles --- */}
                        <Route element={<ProtectedRoute permission="usuarios_ver" />}>
                            <Route path="usuarios" element={<GestionUsuarios />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="roles_ver" />}>
                            <Route path="roles" element={<GestionRoles />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="auditoria_ver" />}>
                            <Route path="auditoria" element={<GestionAuditoria />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="permisos_ver" />}>
                            <Route path="permisos" element={<GestionarPermisosMaestro />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="permisos_asignar" />}>
                            <Route path="roles/:id_rol/permisos" element={<GestionPermisos />} />
                        </Route>

                        {/* --- Configuración del Sistema --- */}
                        <Route element={<ProtectedRoute permission="campos_ver" />}>
                            <Route path="campos-personalizados" element={<GestionCamposPersonalizados />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="plantillas_ver" />}>
                            <Route path="plantillas" element={<GestionPlantillas />} />
                            <Route path="plantillas/:id" element={<PlantillaDetalle />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="plantillas_disenar" />}>
                            <Route path="plantillas/:id/disenar" element={<DiseñadorPlantilla />} />
                        </Route>

                        {/* --- Gestión Documental Avanzada --- */}
                        <Route element={<ProtectedRoute permission="transferencias_ver" />}>
                            <Route path="transferencias" element={<GestionTransferencias />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="eliminacion_ver" />}>
                            <Route path="eliminacion" element={<GestionEliminacion />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="retencion_ver" />}>
                            <Route path="retencion" element={<RetencionDocumental />} />
                        </Route>

                        {/* --- Reportes y Estadísticas --- */}
                        <Route element={<ProtectedRoute permission="estadisticas_ver" />}>
                            <Route path="estadisticas" element={<Estadisticas />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="reportes_fuid" />}>
                            <Route path="reportes-fuid" element={<ReporteFUID />} />
                        </Route>

                        {/* --- Workflows y Préstamos --- */}
                        <Route element={<ProtectedRoute permission="workflows_ver" />}>
                            <Route path="workflows" element={<GestionWorkflows />} />
                            <Route path="workflows/:id" element={<WorkflowDetalle />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute permission="prestamos_ver" />}>
                            <Route path="prestamos" element={<GestionPrestamos />} />
                        </Route>
                    </Route>
                </Route>

                {/* Redirección por defecto al dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </div>
    );
};

// ============================================
// COMPONENTE RAÍZ DE LA APLICACIÓN
// ============================================

/**
 * Componente raíz de la aplicación Documevi.
 * Configura los proveedores globales y el enrutador.
 * 
 * Estructura de proveedores (de exterior a interior):
 * 1. Router - Manejo de navegación
 * 2. PermissionsProvider - Contexto de permisos del usuario
 * 3. ToastContainer - Sistema de notificaciones
 * 4. AppContent - Contenido principal con rutas
 * 
 * @function App
 * @returns {JSX.Element} Aplicación completa con proveedores configurados
 */
function App() {
    return (
        <Router>
            <PermissionsProvider>
                {/* Sistema de notificaciones toast (react-toastify) */}
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
                {/* Contenido principal de la aplicación */}
                <AppContent />
            </PermissionsProvider>
        </Router>
    );
}

export default App;