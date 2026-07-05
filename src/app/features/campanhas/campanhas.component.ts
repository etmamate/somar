import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { Campanha, Usuario } from '../../core/models/somar-api.models';
import { toApiErrorView } from '../../core/services/api-error.util';
import { CampanhasApiService } from '../../core/services/campanhas-api.service';

type CampanhaFilter = 'recentes' | 'ativas' | 'finalizadas';

@Component({
  selector: 'app-campanhas',
  imports: [RouterLink],
  templateUrl: './campanhas.component.html',
  styleUrl: './campanhas.component.css'
})
export class CampanhasComponent implements OnInit {
  private readonly campanhasApi = inject(CampanhasApiService);
  private readonly router = inject(Router);
  private readonly cardImages = [
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=500&q=60'
  ];

  protected readonly campanhas = signal<Campanha[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly activeFilter = signal<CampanhaFilter>('recentes');
  protected readonly currentUser = signal<Usuario | null>(null);

  ngOnInit(): void {
    const localUser = localStorage.getItem('currentUser');
    if (localUser) {
      try {
        this.currentUser.set(JSON.parse(localUser));
      } catch (e) {
        console.error('Failed to parse local user', e);
      }
    }
    this.carregarCampanhas();
  }

  protected logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  protected carregarCampanhas(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.campanhasApi
      .listar()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (campanhas) => this.campanhas.set(campanhas ?? []),
        error: (error) => this.errorMessage.set(toApiErrorView(error).message)
      });
  }

  protected setFilter(filter: CampanhaFilter): void {
    this.activeFilter.set(filter);
  }

  protected campanhasFiltradas(): Campanha[] {
    const campanhas = [...this.campanhas()];
    const filter = this.activeFilter();

    if (filter === 'ativas') {
      return campanhas.filter((campanha) => campanha.status === 'ATIVA');
    }

    if (filter === 'finalizadas') {
      return campanhas.filter((campanha) => campanha.status === 'FINALIZADA');
    }

    return campanhas.sort((a, b) => this.timestamp(b.datacriacao) - this.timestamp(a.datacriacao));
  }

  protected percentual(campanha: Campanha): number {
    if (!campanha.meta || campanha.meta <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, (campanha.valoratual / campanha.meta) * 100));
  }

  protected percentualLabel(campanha: Campanha): string {
    return `${Math.round(this.percentual(campanha))}%`;
  }

  protected valorLabel(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor ?? 0);
  }

  protected statusLabel(campanha: Campanha): string {
    const labels: Record<Campanha['status'], string> = {
      ATIVA: 'Campanha ativa',
      FINALIZADA: 'Finalizada',
      CANCELADA: 'Cancelada'
    };

    return labels[campanha.status] ?? campanha.status;
  }

  protected imageUrl(index: number): string {
    return this.cardImages[index % this.cardImages.length];
  }

  private timestamp(value?: string): number {
    return value ? new Date(value).getTime() || 0 : 0;
  }
}
