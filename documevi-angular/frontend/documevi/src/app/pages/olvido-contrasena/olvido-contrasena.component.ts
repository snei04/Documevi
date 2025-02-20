import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-olvido-contrasena',
  imports: [FormsModule, CommonModule],
  templateUrl: './olvido-contrasena.component.html',
  styleUrls: ['./olvido-contrasena.component.css']
})
export class OlvidoContrasenaComponent  {

  form: HTMLElement | null | undefined;
  password: HTMLInputElement | null | undefined;
  confirmPassword: HTMLInputElement | null | undefined;
  errorMessage: HTMLElement | null | undefined;
  successMessage: HTMLElement | null | undefined;

  ngOnInit() {
    this.form = document.getElementById('passwordForm');
    this.password = document.getElementById('password') as HTMLInputElement;
    this.confirmPassword = document.getElementById('confirmPassword') as HTMLInputElement;
    this.errorMessage = document.getElementById('errorMessage');
    this.successMessage = document.getElementById('successMessage');

    this.form?.addEventListener('submit', (event): void => {
      event.preventDefault(); // Evitar el envío del formulario

      if (this.password?.value === this.confirmPassword?.value) {
      if (this.errorMessage) this.errorMessage.style.display = 'none';
      if (this.successMessage) this.successMessage.style.display = 'block';
      } else {
      if (this.errorMessage) this.errorMessage.style.display = 'block';
      if (this.successMessage) this.successMessage.style.display = 'none';
      }
    });
  }
 
  onSubmit(passwordForm: NgForm): void {

    console.log(passwordForm.value);

  }

}
