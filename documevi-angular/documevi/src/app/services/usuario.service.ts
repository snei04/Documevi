import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // Esto registra el servicio en el nivel raíz
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3306/usuarios';

  private http=inject(HttpClient);
  constructor() { }

  getUsuarios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  addUsuario(usuario: any): Observable<any> {
    return this.http.post(this.apiUrl, usuario);
  }
}