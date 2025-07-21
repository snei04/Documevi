import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import GestionOficinas from './GestionOficinas';
import './Dashboard.css';
import GestionDependencias from './GestionDependencias';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-body">
        <Sidebar />
        <main className="main-content">
           <GestionDependencias />
          <hr style={{ margin: '40px 0' }} />
          <GestionOficinas />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;