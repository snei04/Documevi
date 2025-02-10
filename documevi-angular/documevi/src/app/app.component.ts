import { Component, OnInit } from '@angular/core';
import { UsuarioService } from './services/usuario.service'; // Importa el servicio
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title(title: any) {
    throw new Error('Method not implemented.');
  }
  usuarios: any[] = [];
  nuevoUsuario = { id_Documento: '', Nombre: '', Correo: '', id_Perfil: 0 };

  constructor(private usuarioService: UsuarioService) {} // Inyecta el servicio

  ngOnInit() {
    this.getUsuarios();
  }

  getUsuarios() {
    this.usuarioService.getUsuarios().subscribe(
      (data: any) => {
        this.usuarios = data;
      },
      (error) => {
        console.error('Error obteniendo usuarios:', error);
      }
    );
  }

  addUsuario() {
    this.usuarioService.addUsuario(this.nuevoUsuario).subscribe(
      (data: any) => {
        this.usuarios.push(data);
        this.nuevoUsuario = { id_Documento: '', Nombre: '', Correo: '', id_Perfil: 0 };
      },
      (error) => {
        console.error('Error agregando usuario:', error);
      }
    );
  }
}