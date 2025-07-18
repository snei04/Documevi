// src/App.js
import React from 'react';
import Login from './components/Login';
import logoImevi from './assets/logo-imevi.png'; // Importamos el logo de la esquina
import './App.css';

function App() {
  return (
    <div className="App">
      <img src={logoImevi} alt="Logo IMEVI" className="top-left-logo" />
      <div className="content-center">
        <Login />
      </div>
    </div>
  );
}

export default App;
