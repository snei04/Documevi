import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'; // Importa HttpClientModule
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { UsuarioService } from './services/usuario.service'; // Importa el servicio

@NgModule({
  declarations: [
   
  ],
  imports: [
    AppComponent,
    BrowserModule,
    CommonModule,
    HttpClientModule, // Agrega HttpClientModule aquí
    FormsModule
  ],
  providers: [UsuarioService], // Proporciona el servicio aquí
})
export class AppModule { }