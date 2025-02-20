import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { OlvidoContrasenaComponent } from './pages/olvido-contrasena/olvido-contrasena.component';
export const routes: Routes = [

    {
        path: '',
        component: InicioComponent
    },
    {
        path: 'dashboard',
        component: DashboardComponent
    
    },
    {
        path: 'olvidarContraseña',
        component: OlvidoContrasenaComponent
    }




];
