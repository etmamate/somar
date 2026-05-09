import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { UsuariosApiService } from '../../core/services/usuarios-api.service';

type LoginForm = {
  email: FormControl<string>;
  senha: FormControl<string>;
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly usuariosApi = inject(UsuariosApiService);

  protected readonly form = new FormGroup<LoginForm>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    senha: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected get canSubmit(): boolean {
    return this.form.valid && !this.isSubmitting();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isSubmitting.set(true);

    this.usuariosApi
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (message) => {
          this.successMessage.set(message || 'Usuario Logado');
        },
        error: () => {
          this.errorMessage.set('Email ou senha invalidos');
        }
      });
  }
}
