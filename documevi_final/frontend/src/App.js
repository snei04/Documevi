// Archivo: frontend/src/App.js

import React from 'react';
// 1. Importamos las herramientas de React Router
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './components/DashboardHome';
import Search from './components/Search';

// 2. Importamos los componentes que actuarán como "páginas"
import Login from './components/Login';
import logoImevi from './assets/logo-imevi.png';
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
// 3. Importamos el CSS
import './App.css';

// 4. Creamos un componente especial para proteger nuestras rutas
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // Si no hay token, redirige al login. Si lo hay, muestra la página solicitada.
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    // 5. Envolvemos todo en el Router
    <Router>
      <div className="App">
        {/* 6. Routes define el área donde cambiarán las páginas */}
        <Routes>
          {/* Cuando la URL sea /login, se mostrará el componente Login */}
          <Route path="/login" element={
            <>
                <img src={logoImevi} alt="Logo IMEVI" className="top-left-logo" />
                <div className="content-center">
                  <Login />
                </div>
              </>
          } />

          {/* Cuando la URL sea /dashboard... */}
          <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Rutas anidadas que se mostrarán dentro de DashboardLayout */}
          <Route index element={<DashboardHome />} /> 
          <Route path="search" element={<Search />} />
          <Route path="captura" element={<CapturaDocumento />} />
          <Route path="dependencias" element={<GestionDependencias />} />
          <Route path="oficinas" element={<GestionOficinas />} />
          <Route path="series" element={<GestionSeries />} />
          <Route path="subseries" element={<GestionSubseries />} />
          <Route path="expedientes" element={<GestionExpedientes />} />
          <Route path="workflows" element={<GestionWorkflows />} />
          <Route path="expedientes/:id" element={<ExpedienteDetalle />} />
          <Route path="workflows/:id" element={<WorkflowDetalle />} />
          <Route path="prestamos" element={<GestionPrestamos />} />
        </Route>
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
