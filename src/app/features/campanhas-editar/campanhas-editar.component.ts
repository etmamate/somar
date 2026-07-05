import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Campanha, Usuario } from '../../core/models/somar-api.models';
import { CampanhasApiService } from '../../core/services/campanhas-api.service';
import { toApiErrorView } from '../../core/services/api-error.util';

type EditarCampanhaForm = {
  status: FormControl<'ATIVA' | 'FINALIZADA' | 'CANCELADA'>;
  titulo: FormControl<string>;
  meta: FormControl<number>;
  valoratual: FormControl<number>;
  diafinalizado: FormControl<string>;
  descricao: FormControl<string>;
};

@Component({
  selector: 'app-campanhas-editar',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './campanhas-editar.component.html',
  styleUrl: './campanhas-editar.component.css'
})
export class CampanhasEditarComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly campanhasApi = inject(CampanhasApiService);

  protected readonly campaignId = signal<number | null>(null);
  protected readonly originalCampaign = signal<Campanha | null>(null);
  protected readonly currentUser = signal<Usuario | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  protected readonly form = new FormGroup<EditarCampanhaForm>({
    status: new FormControl('ATIVA', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(100)]
    }),
    meta: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)]
    }),
    valoratual: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    diafinalizado: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    descricao: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(15)]
    })
  });

  // Preview properties
  protected readonly bannerUrl = signal<string>('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80');

  private readonly bannerThemes = [
    { keywords: ['alimento', 'prato', 'comida', 'fome', 'cesta', 'natal'], url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80' },
    { keywords: ['livro', 'escola', 'estud', 'educa', 'futuro', 'criança', 'biblioteca'], url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80' },
    { keywords: ['visão', 'olho', 'oftalmo', 'saúde', 'médic', 'idoso', 'hospital'], url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80' },
    { keywords: ['pet', 'animal', 'cão', 'gato', 'patas', 'abrigo', 'floresta'], url: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=600&q=80' },
    { keywords: ['frio', 'agasalho', 'cobertor', 'roupa', 'inverno'], url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80' }
  ];

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

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      alert('Parâmetro ID inválido.');
      this.router.navigate(['/campanhas/painel']);
      return;
    }

    const id = parseInt(idParam, 10);
    this.campaignId.set(id);

    this.carregarCampanha(id);

    // Dynamic banner selector on title changes
    this.form.controls.titulo.valueChanges.subscribe((title) => {
      this.updateBannerImage(title);
    });
  }

  protected carregarCampanha(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.campanhasApi
      .listar()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (campanhas) => {
          const target = campanhas.find((c) => c.id === id);
          if (target) {
            this.originalCampaign.set(target);
            this.populateForm(target);
          } else {
            this.errorMessage.set('Campanha não encontrada no servidor.');
            alert('Campanha não encontrada.');
            this.router.navigate(['/campanhas/painel']);
          }
        },
        error: (err) => {
          this.errorMessage.set(toApiErrorView(err).message || 'Erro ao carregar dados da campanha.');
        }
      });
  }

  private populateForm(campanha: Campanha): void {
    this.form.patchValue({
      status: campanha.status,
      titulo: campanha.titulo,
      meta: campanha.meta,
      valoratual: campanha.valoratual,
      diafinalizado: campanha.diafinalizado ? campanha.diafinalizado.substring(0, 16) : '',
      descricao: campanha.descricao
    });
    this.updateBannerImage(campanha.titulo);
  }

  private updateBannerImage(titleText?: string): void {
    if (!titleText) return;
    const normalizedText = titleText.toLowerCase();
    const foundTheme = this.bannerThemes.find(theme => 
      theme.keywords.some(keyword => normalizedText.includes(keyword))
    );
    if (foundTheme) {
      this.bannerUrl.set(foundTheme.url);
    } else {
      this.bannerUrl.set('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80');
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.campaignId();
    if (!id) return;

    // Check future date
    const dateValueStr = this.form.controls.diafinalizado.value;
    const dateValue = new Date(dateValueStr);
    const now = new Date();
    if (dateValue <= now) {
      this.errorMessage.set('A data de finalização deve ser uma data futura.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formValues = this.form.getRawValue();
    
    // Format LocalDateTime string with seconds (YYYY-MM-DDTHH:mm:ss)
    let diaFinalizado = formValues.diafinalizado;
    if (diaFinalizado.length === 16) {
      diaFinalizado += ':00';
    }

    const request = {
      titulo: formValues.titulo,
      descricao: formValues.descricao,
      meta: formValues.meta,
      valoratual: formValues.valoratual,
      diafinalizado: diaFinalizado,
      status: formValues.status
    };

    this.campanhasApi
      .atualizar(id, request)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Campanha atualizada com sucesso!');
          setTimeout(() => {
            this.router.navigate(['/campanhas/painel']);
          }, 1500);
        },
        error: (err) => {
          this.errorMessage.set(toApiErrorView(err).message || 'Erro ao salvar alterações da campanha.');
        }
      });
  }

  protected cancelar(): void {
    this.successMessage.set('Operação cancelada. Voltando...');
    setTimeout(() => {
      this.router.navigate(['/campanhas/painel']);
    }, 1000);
  }

  // Preview Helpers
  protected get previewTitle(): string {
    return this.form.controls.titulo.value || 'Título da Campanha';
  }

  protected get previewDesc(): string {
    return this.form.controls.descricao.value || 'Uma prévia da descrição aparecerá aqui...';
  }

  protected get previewStatusLabel(): string {
    const status = this.form.controls.status.value;
    return status === 'ATIVA' ? 'Ativa' : (status === 'FINALIZADA' ? 'Finalizada' : 'Cancelada');
  }

  protected get previewGoal(): number {
    return this.form.controls.meta.value || 0;
  }

  protected get previewCurrentValue(): number {
    return this.form.controls.valoratual.value || 0;
  }

  protected get previewProgressPercent(): number {
    const meta = this.previewGoal;
    if (meta <= 0) return 0;
    return Math.min(100, Math.round((this.previewCurrentValue / meta) * 100));
  }

  protected get previewEndDate(): string {
    const val = this.form.controls.diafinalizado.value;
    if (!val) return '';
    try {
      return new Date(val).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}
