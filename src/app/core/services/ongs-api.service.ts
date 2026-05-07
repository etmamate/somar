import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { Ong, OngCreateRequest, OngUpdateRequest } from '../models/somar-api.models';

@Injectable({ providedIn: 'root' })
export class OngsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/ong`;

  cadastrar(request: OngCreateRequest): Observable<Ong> {
    return this.http.post<Ong>(`${this.baseUrl}/cadastrar`, request);
  }

  listar(): Observable<Ong[]> {
    return this.http.get<Ong[]>(`${this.baseUrl}/listar-ongs`);
  }

  buscarPorId(id: number): Observable<Ong | null> {
    return this.http.get<Ong | null>(`${this.baseUrl}/buscar-ong-${id}`, {
      params: { id }
    });
  }

  atualizar(id: number, request: OngUpdateRequest): Observable<Ong> {
    return this.http.put<Ong>(`${this.baseUrl}/${id}`, request);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      params: { id }
    });
  }
}
