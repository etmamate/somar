import { HttpErrorResponse } from '@angular/common/http';

import { ApiErrorView } from '../models/somar-api.models';

export function toApiErrorView(error: unknown): ApiErrorView {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return {
      title: 'Erro de conexao',
      message: 'Nao foi possivel conectar ao servidor.'
    };
  }

  if (error instanceof HttpErrorResponse && error.status === 404) {
    return {
      title: 'Registro nao encontrado',
      message: 'Nao encontramos esse registro. Atualize a pagina e tente novamente.'
    };
  }

  return {
    title: 'Erro inesperado',
    message: 'Algo deu errado. Tente novamente em instantes.'
  };
}
