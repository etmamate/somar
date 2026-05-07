import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import {
  Campanha,
  CampanhaCreateRequest,
  CampanhaUpdateRequest
} from '../models/somar-api.models';

@Injectable({ providedIn: 'root' })
export class CampanhasApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/campanha`;

  cadastrar(request: CampanhaCreateRequest): Observable<Campanha> {
    return this.http.post<Campanha>(`${this.baseUrl}/cadastrar`, request);
  }

  listar(): Observable<Campanha[]> {
    return this.http.get<Campanha[]>(`${this.baseUrl}/listar-campanhas`);
  }

  atualizar(id: number, request: CampanhaUpdateRequest): Observable<Campanha> {
    return this.http.put<Campanha>(`${this.baseUrl}/${id}`, request);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      params: { id }
    });
  }
}
