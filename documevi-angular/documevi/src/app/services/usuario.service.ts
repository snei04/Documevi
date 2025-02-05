import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private API_URL = 'http://localhost:3306/api/usuarios';

  async obtenerUsuarios() {
    const respuesta = await axios.get(this.API_URL);
    return respuesta.data;
  }
}
