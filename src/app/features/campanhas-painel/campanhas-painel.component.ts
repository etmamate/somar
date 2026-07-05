import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Campanha, Usuario } from '../../core/models/somar-api.models';
import { CampanhasApiService } from '../../core/services/campanhas-api.service';
import { toApiErrorView } from '../../core/services/api-error.util';

type NovaCampanhaForm = {
  titulo: FormControl<string>;
  meta: FormControl<number>;
  descricao: FormControl<string>;
};

@Component({
  selector: 'app-campanhas-painel',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './campanhas-painel.component.html',
  styleUrl: './campanhas-painel.component.css'
})
export class CampanhasPainelComponent implements OnInit {
  private readonly campanhasApi = inject(CampanhasApiService);
  private readonly router = inject(Router);

  protected readonly campaigns = signal<Campanha[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly currentUser = signal<Usuario | null>(null);

  protected readonly form = new FormGroup<NovaCampanhaForm>({
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(100)]
    }),
    meta: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)]
    }),
    descricao: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(15)]
    })
  });

  ngOnInit(): void {
    const localUser = localStorage.getItem('currentUser');
    if (!localUser) {
      alert('Acesso restrito. Por favor, faça login para acessar esta página.');
      this.router.navigate(['/login']);
      return;
    }

    try {
      const user = JSON.parse(localUser) as Usuario;
      if (user.tipo !== 'ONG' && user.tipo !== 'ADMIN') {
        alert('Acesso negado. Apenas ONGs ou Administradores podem acessar esta página.');
        this.router.navigate(['/campanhas']);
        return;
      }
      this.currentUser.set(user);
    } catch (e) {
      this.router.navigate(['/login']);
      return;
    }

    this.carregarCampanhas();
  }

  protected carregarCampanhas(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.campanhasApi
      .listar()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.campaigns.set(res ?? []),
        error: (err) => this.errorMessage.set(toApiErrorView(err).message)
      });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isLoading.set(true);

    const formValues = this.form.getRawValue();
    
    // Future date placeholder (30 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const diaFinalizado = futureDate.toISOString().substring(0, 19) + ':00'; // YYYY-MM-DDTHH:mm:ss

    const request = {
      codong: 1, // Default associated ONG
      titulo: formValues.titulo,
      descricao: formValues.descricao,
      meta: formValues.meta,
      valoratual: 0.0,
      diafinalizado: diaFinalizado,
      status: 'ATIVA' as const
    };

    this.campanhasApi
      .cadastrar(request)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (campanha) => {
          this.successMessage.set('Campanha criada com sucesso!');
          this.form.reset();
          this.campaigns.update((prev) => [...prev, campanha]);
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (err) => {
          this.errorMessage.set(toApiErrorView(err).message || 'Não foi possível cadastrar a campanha agora.');
        }
      });
  }

  protected excluirCampanha(id: number): void {
    if (!confirm('Tem certeza de que deseja excluir esta campanha?')) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isLoading.set(true);

    this.campanhasApi
      .deletar(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Campanha excluída com sucesso!');
          this.campaigns.update((prev) => prev.filter((c) => c.id !== id));
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (err) => {
          this.errorMessage.set(toApiErrorView(err).message || 'Não foi possível excluir a campanha.');
        }
      });
  }

  protected logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected formatDisplayDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return '';
    }
  }
}
