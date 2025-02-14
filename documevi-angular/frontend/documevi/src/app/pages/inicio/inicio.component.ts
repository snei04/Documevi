import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';


@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class InicioComponent {
  password: string = '';
  passwordVisible: boolean = false;
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }


img = signal({
  logoImevi: 'https://imevi.com.co/wp-content/uploads/2024/05/logo-imevi-svg-250v2.svg',
  logoDocumevi: 'https://sjc04pap002files.storage.live.com/y4m_0nTO7bbuneVEiNf4bCf1oCHnxl-_MXzDxUq3zz3xg1c7_SziI0i5mWKWmnXZB4y-9wQGlAXkmIayRzwp1s6uK8FQQoFZraE2x4vyT6UQqFmEk3s9VdFDOLgDV2AmGqJz5HluguLUbGxES0vEPLz1P7lNWGIbHacJOjgUm__27UdYG-NXEyaF4ARSvJ1tqL_5v15J3pNyztTPEbjFuxQzgtTJjsONiFTElxXQjPHtsk?encodeFailures=1&width=100&height=100'
});





}
