export type UsuarioTipo = 'ONG' | 'DOADOR' | 'ADMIN';

export type CampanhaStatus = 'ATIVA' | 'FINALIZADA' | 'CANCELADA';

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  tipo: UsuarioTipo;
  ong?: Ong | null;
};

export type Ong = {
  id: number;
  nome: string;
  descricao: string;
  documento: string;
  telefone: string;
  cidade: string;
  estado: string;
  usuario?: Usuario;
  campanhas?: Campanha[];
  datacriacao?: string;
};

export type Campanha = {
  id: number;
  ong: Ong;
  titulo: string;
  descricao: string;
  meta: number;
  valoratual: number;
  status: CampanhaStatus;
  datacriacao?: string;
  diafinalizado?: string | null;
};

export type UsuarioRequest = {
  nome: string;
  email: string;
  senha: string;
  tipo: UsuarioTipo;
};

export type LoginRequest = {
  email: string;
  senha: string;
};

export type OngCreateRequest = {
  nome: string;
  descricao: string;
  documento: string;
  telefone: string;
  cidade: string;
  estado: string;
  codusuario: number;
};

export type OngUpdateRequest = Omit<OngCreateRequest, 'codusuario'>;

export type CampanhaCreateRequest = {
  codong: number;
  titulo: string;
  descricao: string;
  meta: number;
  valoratual: number;
  diafinalizado?: string;
  status: CampanhaStatus;
};

export type CampanhaUpdateRequest = {
  titulo: string;
  descricao: string;
  meta: number;
  valoratual: number;
  diafinalizado: string;
  status: CampanhaStatus;
};

export type ApiErrorView = {
  title: string;
  message: string;
};
