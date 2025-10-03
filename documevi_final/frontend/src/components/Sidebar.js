import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Dashboard.css';

// Importamos el guardián de permisos
import PermissionGuard from './auth/PermissionGuard';

const Sidebar = ({ isOpen }) => {
    const sidebarClassName = isOpen ? "sidebar" : "sidebar collapsed";
    const [openMenu, setOpenMenu] = useState(null);

    const handleMenuClick = (menuName) => {
        setOpenMenu(openMenu === menuName ? null : menuName);
    };

    return (
        <aside className={sidebarClassName}>
            <nav className="sidebar-nav">
                <ul>
                    {/* Enlaces visibles para todos los usuarios logueados */}
                    <li><NavLink to="/dashboard" end>Inicio</NavLink></li>
                    <li><NavLink to="/dashboard/mis-tareas">Mis Tareas</NavLink></li>
                    <li><NavLink to="/dashboard/mis-prestamos">Mis Préstamos</NavLink></li>

                    {/* Menú Desplegable: Gestión Documental */}
                    <li>
                        <div onClick={() => handleMenuClick('gestion')} className="menu-title">
                            <span>Gestión Documental</span>
                            <span>{openMenu === 'gestion' ? '▲' : '▼'}</span>
                        </div>
                        <ul className={`submenu ${openMenu === 'gestion' ? 'open' : ''}`}>
                            {/* Podrías incluso proteger enlaces individuales si fuera necesario */}
                            <PermissionGuard permission="crear_expedientes">
                                <li><NavLink to="/dashboard/captura">Captura de documentos</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="gestionar_expedientes">
                                <li><NavLink to="/dashboard/expedientes">Gestión de expedientes</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="gestionar_prestamos">
                                <li><NavLink to="/dashboard/prestamos">Préstamo de documentos</NavLink></li>
                            </PermissionGuard>
                            <li><NavLink to="/dashboard/search">Búsqueda</NavLink></li>
                        </ul>
                    </li>

                    {/* --- Menú Desplegable: Parametrización --- */}
            
                    <PermissionGuard permission="gestionar_parametros_trd">
                        <li>
                            <div onClick={() => handleMenuClick('parametros')} className="menu-title">
                                <span>Parametrización</span>
                                <span>{openMenu === 'parametros' ? '▲' : '▼'}</span>
                            </div>
                            <ul className={`submenu ${openMenu === 'parametros' ? 'open' : ''}`}>
                                <li><NavLink to="/dashboard/dependencias">Dependencias</NavLink></li>
                                <li><NavLink to="/dashboard/oficinas">Oficinas</NavLink></li>
                                <li><NavLink to="/dashboard/series">Series (TRD)</NavLink></li>
                                <li><NavLink to="/dashboard/subseries">Subseries (TRD)</NavLink></li>
                                <li><NavLink to="/dashboard/campos-personalizados">Campos Personalizados</NavLink></li>
                                <PermissionGuard permission="gestionar_workflows">
                                    <li><NavLink to="/dashboard/workflows">Flujos de Trabajo</NavLink></li>
                                </PermissionGuard>
                                <PermissionGuard permission="gestionar_plantillas">
                                    <li><NavLink to="/dashboard/plantillas">Gestión de Plantillas</NavLink></li>
                                </PermissionGuard>
                            </ul>
                        </li>
                    </PermissionGuard>

                    {/* --- Menú Desplegable: Administración --- */}
                    {/* ✅ CORREGIDO: Usamos un permiso real de tu base de datos */}
                    <PermissionGuard permission="gestionar_usuarios">
                        <li>
                            <div onClick={() => handleMenuClick('admin')} className="menu-title">
                                <span>Administración</span>
                                <span>{openMenu === 'admin' ? '▲' : '▼'}</span>
                            </div>
                            <ul className={`submenu ${openMenu === 'admin' ? 'open' : ''}`}>
                                <PermissionGuard permission="gestionar_disposicion_final">
                                    <li><NavLink to="/dashboard/transferencias">Transferencias</NavLink></li>
                                    <li><NavLink to="/dashboard/eliminacion">Eliminación</NavLink></li>
                                </PermissionGuard>
                                <PermissionGuard permission="gestionar_roles_permisos">
                                    <li><NavLink to="/dashboard/roles">Gestión de Roles</NavLink></li>
                                    <li><NavLink to="/dashboard/permisos">Maestro de Permisos</NavLink></li>
                                </PermissionGuard>
                                <li><NavLink to="/dashboard/usuarios">Gestión de Usuarios</NavLink></li>
                                <PermissionGuard permission="ver_auditoria">
                                    <li><NavLink to="/dashboard/auditoria">Auditoría</NavLink></li>
                                </PermissionGuard>
                                <PermissionGuard permission="ver_reportes">
                                    <li><NavLink to="/dashboard/reportes-fuid">Reporte FUID</NavLink></li>
                                    <li><NavLink to="/dashboard/estadisticas">Estadísticas</NavLink></li>
                                </PermissionGuard>
                            </ul>
                        </li>
                    </PermissionGuard>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;