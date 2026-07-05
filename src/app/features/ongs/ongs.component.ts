import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Ong, Usuario } from '../../core/models/somar-api.models';
import { OngsApiService } from '../../core/services/ongs-api.service';
import { toApiErrorView } from '../../core/services/api-error.util';

@Component({
  selector: 'app-ongs',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ongs.component.html',
  styleUrl: './ongs.component.css'
})
export class OngsComponent implements OnInit {
  private readonly ongsApi = inject(OngsApiService);
  private readonly router = inject(Router);

  protected readonly ongs = signal<Ong[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
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
    this.carregarOngs();
  }

  protected carregarOngs(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.ongsApi
      .listar()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (ongs) => this.ongs.set(ongs ?? []),
        error: (error) => this.errorMessage.set(toApiErrorView(error).message)
      });
  }

  protected logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  protected getOngInitials(nome: string): string {
    if (!nome) return 'ONG';
    const words = nome.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return words[0].substring(0, 2).toUpperCase();
  }

  protected getCampanhasCountLabel(ong: Ong): string {
    const count = ong.campanhas?.length || 0;
    if (count === 0) return 'Sem campanhas ativas';
    if (count === 1) return '1 campanha ativa';
    return `${count} campanhas ativas`;
  }
}
