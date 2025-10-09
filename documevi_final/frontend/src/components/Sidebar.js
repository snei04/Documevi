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
                            <PermissionGuard permission="expedientes_crear">
                                <li><NavLink to="/dashboard/captura">Captura de documentos</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="expedientes_ver">
                                <li><NavLink to="/dashboard/expedientes">Gestión de expedientes</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="prestamos_ver">
                                <li><NavLink to="/dashboard/prestamos">Préstamo de documentos</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="busqueda_basica">
                                <li><NavLink to="/dashboard/search">Búsqueda</NavLink></li>
                            </PermissionGuard>
                        </ul>
                    </li>

                    {/* --- Menú Desplegable: Parametrización --- */}
            
                    {/* Mostrar menú si tiene al menos un permiso de parametrización */}
                    <li>
                        <div onClick={() => handleMenuClick('parametros')} className="menu-title">
                            <span>Parametrización</span>
                            <span>{openMenu === 'parametros' ? '▲' : '▼'}</span>
                        </div>
                        <ul className={`submenu ${openMenu === 'parametros' ? 'open' : ''}`}>
                            <PermissionGuard permission="dependencias_ver">
                                <li><NavLink to="/dashboard/dependencias">Dependencias</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="oficinas_ver">
                                <li><NavLink to="/dashboard/oficinas">Oficinas</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="series_ver">
                                <li><NavLink to="/dashboard/series">Series (TRD)</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="subseries_ver">
                                <li><NavLink to="/dashboard/subseries">Subseries (TRD)</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="campos_ver">
                                <li><NavLink to="/dashboard/campos-personalizados">Campos Personalizados</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="workflows_ver">
                                <li><NavLink to="/dashboard/workflows">Flujos de Trabajo</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="plantillas_ver">
                                <li><NavLink to="/dashboard/plantillas">Gestión de Plantillas</NavLink></li>
                            </PermissionGuard>
                        </ul>
                    </li>

                    {/* --- Menú Desplegable: Administración --- */}
                    {/* ✅ CORREGIDO: Usamos un permiso real de tu base de datos */}
                    {/* Mostrar menú si tiene al menos un permiso de administración */}
                    <li>
                        <div onClick={() => handleMenuClick('admin')} className="menu-title">
                            <span>Administración</span>
                            <span>{openMenu === 'admin' ? '▲' : '▼'}</span>
                        </div>
                        <ul className={`submenu ${openMenu === 'admin' ? 'open' : ''}`}>
                            <PermissionGuard permission="transferencias_ver">
                                <li><NavLink to="/dashboard/transferencias">Transferencias</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="eliminacion_ver">
                                <li><NavLink to="/dashboard/eliminacion">Eliminación</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="roles_ver">
                                <li><NavLink to="/dashboard/roles">Gestión de Roles</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="permisos_ver">
                                <li><NavLink to="/dashboard/permisos">Maestro de Permisos</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="usuarios_ver">
                                <li><NavLink to="/dashboard/usuarios">Gestión de Usuarios</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="auditoria_ver">
                                <li><NavLink to="/dashboard/auditoria">Auditoría</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="reportes_fuid">
                                <li><NavLink to="/dashboard/reportes-fuid">Reporte FUID</NavLink></li>
                            </PermissionGuard>
                            <PermissionGuard permission="estadisticas_ver">
                                <li><NavLink to="/dashboard/estadisticas">Estadísticas</NavLink></li>
                            </PermissionGuard>
                        </ul>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;