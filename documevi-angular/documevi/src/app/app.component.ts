import { Component,  OnInit } from '@angular/core';
import { UsuarioService } from './services/usuario.service';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'documevi';
usuarios: any[] = [];

constructor(private usuarioService: UsuarioService) {}

async ngOnInit() {
  this.usuarios = await this.usuarioService.obtenerUsuarios();
}

}
