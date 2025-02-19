import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inicio',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
  
})
export class InicioComponent {
  password: string = '';
  passwordVisible: boolean = false;
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }


img = signal({
  logoImevi: 'https://imevi.com.co/wp-content/uploads/2024/05/logo-imevi-svg-250v2.svg',
  logoDocumevi: 'https://1drv.ms/i/s!Ar-JMLTJ-Z32h9gleIgGckzmmx8Jew?e=YCqoFX'
});
}

export class enter_usuario{


}