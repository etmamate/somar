# API Somar - Guia para Frontend

Este documento descreve o contrato atual da API do projeto `backend-somar` para orientar a criacao do frontend. Ele foi baseado no codigo-fonte dos controllers, services, DTOs, models e enums.

## Visao Geral

| Item | Valor |
|---|---|
| Base URL local | `http://localhost:8080` |
| Formato | JSON |
| Content-Type | `application/json` |
| Autenticacao real atual | Nao ha token, sessao ou middleware de seguranca |
| Banco | PostgreSQL via Spring Data JPA |

### Observacoes importantes para o frontend

- A API retorna entidades JPA diretamente, nao os DTOs de response presentes no projeto.
- Senhas sao retornadas nos endpoints de usuario. Evite exibir ou persistir esse campo no frontend.
- O login retorna apenas uma string (`"Usuario Logado"`) e nao retorna usuario, token JWT ou permissao.
- Nao ha configuracao de CORS no projeto. Se o frontend rodar em outra origem, como `http://localhost:5173`, pode ser necessario adicionar CORS no backend.
- Os controllers nao usam `@Valid` nos `@RequestBody`, entao as validacoes anotadas nos DTOs podem nao ser aplicadas automaticamente hoje.
- Alguns endpoints usam `{id}` na rota, mas recebem `id` como query param (`@RequestParam`). Na pratica, eles precisam de um segmento na URL e tambem de `?id=...`. Veja os detalhes nos endpoints.
- Erros lancados pelos services sao `RuntimeException` sem handler global. Normalmente isso tende a virar resposta `500 Internal Server Error`, mesmo em casos como recurso nao encontrado ou senha incorreta.

## Enums

### `UsuarioEnum`

Valores aceitos para `tipo` de usuario:

| Valor | Uso sugerido no frontend |
|---|---|
| `ONG` | Usuario representante de uma ONG |
| `DOADOR` | Usuario doador |
| `ADMIN` | Administrador |

### `CampanhaEnum`

Valores aceitos para `status` de campanha:

| Valor | Uso sugerido no frontend |
|---|---|
| `ATIVA` | Campanha aberta/em andamento |
| `FINALIZADA` | Campanha encerrada com sucesso |
| `CANCELADA` | Campanha cancelada |

## Formato de datas

Campos `LocalDateTime` devem ser enviados/recebidos no formato ISO-8601 sem timezone:

```json
"2026-05-05T20:30:00"
```

## Fluxos principais de tela

### Cadastro de usuario doador

1. Enviar `POST /usuario/cadastrar` com `tipo: "DOADOR"`.
2. Guardar o `id` retornado caso a aplicacao precise identificar o usuario depois.

### Cadastro de ONG

1. Enviar `POST /usuario/cadastrar` com `tipo: "ONG"`.
2. Enviar `POST /ong/cadastrar` usando `codusuario` com o `id` do usuario criado.
3. Guardar o `id` da ONG retornada para criar campanhas.

### Cadastro de campanha

1. Ter uma ONG previamente cadastrada.
2. Enviar `POST /campanha/cadastrar` usando `codong` com o `id` da ONG.
3. A campanha sera vinculada a essa ONG.

## Endpoints - Usuario

Base path: `/usuario`

| Metodo | Endpoint | Finalidade |
|---|---|---|
| `POST` | `/usuario/cadastrar` | Criar usuario |
| `GET` | `/usuario/listar-usuarios` | Listar usuarios |
| `PUT` | `/usuario/{id}` | Atualizar usuario |
| `DELETE` | `/usuario/{qualquerValor}?id={id}` | Deletar usuario |
| `POST` | `/usuario/login` | Fazer login simples |

### Criar usuario

`POST /usuario/cadastrar`

Request:

```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "senha": "123456",
  "tipo": "DOADOR"
}
```

Campos:

| Campo | Tipo | Obrigatorio | Regras para o frontend |
|---|---|---|---|
| `nome` | string | Sim | 3 a 100 caracteres |
| `email` | string | Sim | Validar formato de email no frontend |
| `senha` | string | Sim | Campo obrigatorio |
| `tipo` | enum | Sim | `ONG`, `DOADOR` ou `ADMIN` |

Response `200 OK` ou `201 Created` esperado conceitualmente, mas o controller atual retorna objeto com status padrao `200 OK`:

```json
{
  "id": 1,
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "senha": "123456",
  "tipo": "DOADOR",
  "ong": null
}
```

Regras:

- O backend nao verifica se o email ja existe antes de salvar.
- A senha e salva e retornada em texto puro no estado atual do projeto.

### Listar usuarios

`GET /usuario/listar-usuarios`

Response `200 OK`:

```json
[
  {
    "id": 1,
    "nome": "Maria Silva",
    "email": "maria@email.com",
    "senha": "123456",
    "tipo": "DOADOR",
    "ong": null
  }
]
```

Uso no frontend:

- Nao renderizar `senha`.
- Pode ser usado para telas administrativas/listagem.

### Atualizar usuario

`PUT /usuario/{id}`

Exemplo: `PUT /usuario/1`

Request:

```json
{
  "nome": "Maria Souza",
  "email": "maria.souza@email.com",
  "senha": "nova-senha",
  "tipo": "DOADOR"
}
```

Campos:

| Campo | Tipo | Obrigatorio | Regras para o frontend |
|---|---|---|---|
| `nome` | string | Sim | 3 a 100 caracteres |
| `email` | string | Sim | Validar formato de email no frontend |
| `senha` | string | Sim | Enviar sempre, pois o update substitui o valor |
| `tipo` | enum | Sim | `ONG`, `DOADOR` ou `ADMIN` |

Response `200 OK`:

```json
{
  "id": 1,
  "nome": "Maria Souza",
  "email": "maria.souza@email.com",
  "senha": "nova-senha",
  "tipo": "DOADOR",
  "ong": null
}
```

Erros possiveis:

- Se o usuario nao existir, o service lanca `RuntimeException("Usuario nao encontrado")`.

### Deletar usuario

Mapeamento atual no codigo: `DELETE /usuario/{id}`, mas o metodo recebe `@RequestParam Long id`.

Chamada segura no estado atual:

```http
DELETE /usuario/1?id=1
```

Response de sucesso:

- Corpo vazio.
- Status padrao esperado: `200 OK`.

Atencao:

- `DELETE /usuario/1` tende a falhar porque falta o query param `id`.
- `DELETE /usuario?id=1` tende a falhar porque falta o segmento exigido por `/{id}`.

### Login

`POST /usuario/login`

Request:

```json
{
  "email": "maria@email.com",
  "senha": "123456"
}
```

Response `200 OK`:

```text
Usuario Logado
```

Regras:

- Busca usuario por email.
- Compara a senha enviada com a senha salva em texto puro.
- Nao retorna token, dados do usuario, role ou refresh token.
- Senha incorreta lanca `RuntimeException("Senha incorreta")`.
- Email inexistente lanca `RuntimeException("Usuario nao encontrado")`.

Sugestao para o frontend atual:

- Tratar qualquer erro do login como mensagem generica: `Email ou senha invalidos`.
- Considerar o login apenas como validacao simples ate o backend implementar JWT/sessao.

## Endpoints - ONG

Base path: `/ong`

| Metodo | Endpoint | Finalidade |
|---|---|---|
| `POST` | `/ong/cadastrar` | Criar ONG |
| `GET` | `/ong/listar-ongs` | Listar ONGs |
| `GET` | `/ong/buscar-ong-{qualquerValor}?id={id}` | Buscar ONG por ID |
| `PUT` | `/ong/{id}` | Atualizar ONG |
| `DELETE` | `/ong/{qualquerValor}?id={id}` | Deletar ONG |

### Criar ONG

`POST /ong/cadastrar`

Request:

```json
{
  "nome": "Instituto Somar",
  "descricao": "ONG voltada a projetos sociais e arrecadacao de doacoes.",
  "documento": "12.345.678/0001-90",
  "telefone": "11999999999",
  "cidade": "Sao Paulo",
  "estado": "SP",
  "codusuario": 1
}
```

Campos:

| Campo | Tipo | Obrigatorio | Regras para o frontend |
|---|---|---|---|
| `nome` | string | Sim | Nome da ONG |
| `descricao` | string | Sim | Descricao institucional |
| `documento` | string | Sim | CPF/CNPJ conforme regra de produto |
| `telefone` | string | Sim | Telefone de contato |
| `cidade` | string | Sim | Cidade |
| `estado` | string | Sim | UF, exemplo `SP` |
| `codusuario` | number | Sim | ID de usuario existente |
| `dataCriacao` | datetime | Nao | Existe no DTO, mas o service ignora; o banco preenche `datacriacao` |

Response `200 OK`:

```json
{
  "id": 1,
  "nome": "Instituto Somar",
  "descricao": "ONG voltada a projetos sociais e arrecadacao de doacoes.",
  "documento": "12.345.678/0001-90",
  "telefone": "11999999999",
  "cidade": "Sao Paulo",
  "estado": "SP",
  "usuario": {
    "id": 1,
    "nome": "Maria Silva",
    "email": "maria@email.com",
    "senha": "123456",
    "tipo": "ONG"
  },
  "campanhas": null,
  "datacriacao": "2026-05-05T20:30:00"
}
```

Regras:

- `codusuario` precisa existir em `/usuario`.
- O backend nao valida se o usuario e do tipo `ONG`.
- O backend nao valida duplicidade de `documento`.

### Listar ONGs

`GET /ong/listar-ongs`

Response `200 OK`:

```json
[
  {
    "id": 1,
    "nome": "Instituto Somar",
    "descricao": "ONG voltada a projetos sociais e arrecadacao de doacoes.",
    "documento": "12.345.678/0001-90",
    "telefone": "11999999999",
    "cidade": "Sao Paulo",
    "estado": "SP",
    "usuario": {
      "id": 1,
      "nome": "Maria Silva",
      "email": "maria@email.com",
      "senha": "123456",
      "tipo": "ONG"
    },
    "campanhas": [],
    "datacriacao": "2026-05-05T20:30:00"
  }
]
```

Uso no frontend:

- Pode alimentar cards/listagem de ONGs.
- Evite depender de `campanhas` vir sempre preenchido, pois o relacionamento e lazy/cascade e pode variar conforme serializacao.

### Buscar ONG por ID

Mapeamento atual no codigo: `GET /ong/buscar-ong-{id}`, mas o metodo recebe `@RequestParam Long id`.

Chamada segura no estado atual:

```http
GET /ong/buscar-ong-1?id=1
```

Response `200 OK` quando encontra:

```json
{
  "id": 1,
  "nome": "Instituto Somar",
  "descricao": "ONG voltada a projetos sociais e arrecadacao de doacoes.",
  "documento": "12.345.678/0001-90",
  "telefone": "11999999999",
  "cidade": "Sao Paulo",
  "estado": "SP",
  "usuario": {
    "id": 1,
    "nome": "Maria Silva",
    "email": "maria@email.com",
    "senha": "123456",
    "tipo": "ONG"
  },
  "campanhas": [],
  "datacriacao": "2026-05-05T20:30:00"
}
```

Response `200 OK` quando nao encontra, por retornar `Optional<Ong>`:

```json
null
```

Atencao:

- O valor no path (`buscar-ong-1`) e o query param (`?id=1`) devem representar o mesmo ID para evitar confusao, mesmo que o backend use apenas o query param no metodo.

### Atualizar ONG

`PUT /ong/{id}`

Exemplo: `PUT /ong/1`

Request:

```json
{
  "nome": "Instituto Somar Brasil",
  "descricao": "Nova descricao institucional.",
  "documento": "12.345.678/0001-90",
  "telefone": "11888888888",
  "cidade": "Sao Paulo",
  "estado": "SP"
}
```

Campos:

| Campo | Tipo | Obrigatorio | Regras para o frontend |
|---|---|---|---|
| `nome` | string | Sim | Enviar sempre |
| `descricao` | string | Sim | Enviar sempre |
| `documento` | string | Sim | Enviar sempre |
| `telefone` | string | Sim | Enviar sempre |
| `cidade` | string | Sim | Enviar sempre |
| `estado` | string | Sim | Enviar sempre |

Response `200 OK`:

```json
{
  "id": 1,
  "nome": "Instituto Somar Brasil",
  "descricao": "Nova descricao institucional.",
  "documento": "12.345.678/0001-90",
  "telefone": "11888888888",
  "cidade": "Sao Paulo",
  "estado": "SP",
  "usuario": {
    "id": 1,
    "nome": "Maria Silva",
    "email": "maria@email.com",
    "senha": "123456",
    "tipo": "ONG"
  },
  "campanhas": [],
  "datacriacao": "2026-05-05T20:30:00"
}
```

### Deletar ONG

Mapeamento atual no codigo: `DELETE /ong/{id}`, mas o metodo recebe `@RequestParam Long id`.

Chamada segura no estado atual:

```http
DELETE /ong/1?id=1
```

Response de sucesso:

- Corpo vazio.
- Status padrao esperado: `200 OK`.

Regra:

- `Ong.campanhas` tem cascade `ALL` e `orphanRemoval = true`, entao deletar uma ONG pode remover campanhas associadas.

## Endpoints - Campanha

Base path: `/campanha`

| Metodo | Endpoint | Finalidade |
|---|---|---|
| `POST` | `/campanha/cadastrar` | Criar campanha |
| `GET` | `/campanha/listar-campanhas` | Listar campanhas |
| `PUT` | `/campanha/{id}` | Atualizar campanha |
| `DELETE` | `/campanha/{qualquerValor}?id={id}` | Deletar campanha |

### Criar campanha

`POST /campanha/cadastrar`

Request:

```json
{
  "codong": 1,
  "titulo": "Campanha de Alimentos",
  "descricao": "Arrecadacao para cestas basicas.",
  "meta": 10000.0,
  "valoratual": 0.0,
  "diafinalizado": "2026-12-31T23:59:00",
  "status": "ATIVA"
}
```

Campos:

| Campo | Tipo | Obrigatorio | Regras para o frontend |
|---|---|---|---|
| `codong` | number | Sim | ID de ONG existente |
| `titulo` | string | Sim | Titulo da campanha |
| `descricao` | string | Sim | Descricao da campanha |
| `meta` | number | Sim | Idealmente maior que zero |
| `valoratual` | number | Sim | Idealmente maior ou igual a zero |
| `diafinalizado` | datetime | Sim no DTO | O service atual ignora esse campo na criacao |
| `status` | enum | Sim | `ATIVA`, `FINALIZADA` ou `CANCELADA` |
| `dataCriacao` | datetime | Nao | Existe no DTO, mas nao deve ser enviado; banco preenche `datacriacao` |

Response `200 OK`:

```json
{
  "id": 1,
  "ong": {
    "id": 1,
    "nome": "Instituto Somar",
    "descricao": "ONG voltada a projetos sociais e arrecadacao de doacoes.",
    "documento": "12.345.678/0001-90",
    "telefone": "11999999999",
    "cidade": "Sao Paulo",
    "estado": "SP",
    "datacriacao": "2026-05-05T20:30:00"
  },
  "titulo": "Campanha de Alimentos",
  "descricao": "Arrecadacao para cestas basicas.",
  "meta": 10000.0,
  "valoratual": 0.0,
  "status": "ATIVA",
  "datacriacao": "2026-05-05T20:35:00",
  "diafinalizado": null
}
```

Regras:

- `codong` precisa existir em `/ong`.
- Na criacao, o service atual nao salva `diafinalizado`, mesmo que o frontend envie.
- Na criacao, o service atual salva `valoratual` usando o valor enviado pelo frontend.

### Listar campanhas

`GET /campanha/listar-campanhas`

Response `200 OK`:

```json
[
  {
    "id": 1,
    "ong": {
      "id": 1,
      "nome": "Instituto Somar",
      "descricao": "ONG voltada a projetos sociais e arrecadacao de doacoes.",
      "documento": "12.345.678/0001-90",
      "telefone": "11999999999",
      "cidade": "Sao Paulo",
      "estado": "SP",
      "datacriacao": "2026-05-05T20:30:00"
    },
    "titulo": "Campanha de Alimentos",
    "descricao": "Arrecadacao para cestas basicas.",
    "meta": 10000.0,
    "valoratual": 2500.0,
    "status": "ATIVA",
    "datacriacao": "2026-05-05T20:35:00",
    "diafinalizado": null
  }
]
```

Uso no frontend:

- Pode alimentar home/listagem de campanhas.
- Percentual sugerido: `valoratual / meta * 100`, protegendo contra `meta <= 0`.
- Tratar `diafinalizado` como opcional/nulo no estado atual.

### Atualizar campanha

`PUT /campanha/{id}`

Exemplo: `PUT /campanha/1`

Request:

```json
{
  "titulo": "Campanha de Alimentos 2026",
  "descricao": "Arrecadacao atualizada para cestas basicas.",
  "meta": 12000.0,
  "valoratual": 3000.0,
  "diafinalizado": "2026-12-31T23:59:00",
  "status": "ATIVA"
}
```

Campos:

| Campo | Tipo | Obrigatorio | Regras para o frontend |
|---|---|---|---|
| `titulo` | string | Sim | Enviar sempre |
| `descricao` | string | Sim | Enviar sempre |
| `meta` | number | Sim | DTO indica positivo |
| `valoratual` | number | Sim | DTO indica zero ou positivo |
| `diafinalizado` | datetime | Sim | No update esse campo e salvo |
| `status` | enum | Sim | `ATIVA`, `FINALIZADA` ou `CANCELADA` |

Response `200 OK`:

```json
{
  "id": 1,
  "ong": {
    "id": 1,
    "nome": "Instituto Somar"
  },
  "titulo": "Campanha de Alimentos 2026",
  "descricao": "Arrecadacao atualizada para cestas basicas.",
  "meta": 12000.0,
  "valoratual": 3000.0,
  "status": "ATIVA",
  "datacriacao": "2026-05-05T20:35:00",
  "diafinalizado": "2026-12-31T23:59:00"
}
```

### Deletar campanha

Mapeamento atual no codigo: `DELETE /campanha/{id}`, mas o metodo recebe `@RequestParam Long id`.

Chamada segura no estado atual:

```http
DELETE /campanha/1?id=1
```

Response de sucesso:

- Corpo vazio.
- Status padrao esperado: `200 OK`.

## Modelos de dominio retornados

### Usuario

```ts
type Usuario = {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  tipo: 'ONG' | 'DOADOR' | 'ADMIN';
  ong?: Ong | null;
};
```

### Ong

```ts
type Ong = {
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
```

### Campanha

```ts
type Campanha = {
  id: number;
  ong: Ong;
  titulo: string;
  descricao: string;
  meta: number;
  valoratual: number;
  status: 'ATIVA' | 'FINALIZADA' | 'CANCELADA';
  datacriacao?: string;
  diafinalizado?: string | null;
};
```

## Tabela rapida de requests

### `UsuarioCreateRequestDTO` e `UsuarioUpdateRequestDTO`

```ts
type UsuarioRequest = {
  nome: string;
  email: string;
  senha: string;
  tipo: 'ONG' | 'DOADOR' | 'ADMIN';
};
```

### `LoginRequest`

```ts
type LoginRequest = {
  email: string;
  senha: string;
};
```

### `OngCreateRequestDTO`

```ts
type OngCreateRequest = {
  nome: string;
  descricao: string;
  documento: string;
  telefone: string;
  cidade: string;
  estado: string;
  codusuario: number;
};
```

### `OngUpdateRequestDTO`

```ts
type OngUpdateRequest = {
  nome: string;
  descricao: string;
  documento: string;
  telefone: string;
  cidade: string;
  estado: string;
};
```

### `CampanhaCreateRequestDTO`

```ts
type CampanhaCreateRequest = {
  codong: number;
  titulo: string;
  descricao: string;
  meta: number;
  valoratual: number;
  diafinalizado?: string;
  status: 'ATIVA' | 'FINALIZADA' | 'CANCELADA';
};
```

### `CampanhaUpdateRequestDTO`

```ts
type CampanhaUpdateRequest = {
  titulo: string;
  descricao: string;
  meta: number;
  valoratual: number;
  diafinalizado: string;
  status: 'ATIVA' | 'FINALIZADA' | 'CANCELADA';
};
```

## Validacoes recomendadas no frontend

Como o backend atual nao garante todas as validacoes automaticamente, o frontend deve validar antes de enviar:

| Campo | Validacao recomendada |
|---|---|
| `nome` de usuario | Obrigatorio, 3 a 100 caracteres |
| `email` | Obrigatorio, formato de email |
| `senha` | Obrigatoria, definir minimo conforme regra de produto |
| `tipo` | Apenas `ONG`, `DOADOR`, `ADMIN` |
| `documento` | Obrigatorio, mascara/validacao CPF ou CNPJ conforme regra de produto |
| `telefone` | Obrigatorio, aplicar mascara brasileira se desejado |
| `estado` | UF com 2 caracteres |
| `codusuario` | Numero de usuario existente |
| `codong` | Numero de ONG existente |
| `meta` | Numero maior que zero |
| `valoratual` | Numero maior ou igual a zero |
| `status` | Apenas `ATIVA`, `FINALIZADA`, `CANCELADA` |
| `diafinalizado` | Data futura ou regra definida pelo produto |

## Tratamento de erros no frontend

O projeto ainda nao possui um formato padrao de erro. Recomenda-se tratar por status e fallback generico:

```ts
type ApiErrorView = {
  title: string;
  message: string;
};
```

Sugestoes de mensagens:

| Situacao | Mensagem amigavel |
|---|---|
| Login falhou | `Email ou senha invalidos.` |
| Usuario/ONG/Campanha nao encontrada | `Nao encontramos esse registro. Atualize a pagina e tente novamente.` |
| Erro ao criar | `Nao foi possivel salvar agora. Verifique os dados e tente novamente.` |
| Erro de conexao | `Nao foi possivel conectar ao servidor.` |
| Erro inesperado | `Algo deu errado. Tente novamente em instantes.` |

## Pontos de atencao para alinhar com o backend

Estes pontos nao impedem o frontend de comecar, mas devem ser considerados no planejamento:

| Ponto | Impacto no frontend | Ajuste ideal no backend |
|---|---|---|
| Delete e busca usam `@RequestParam` apesar do `{id}` na rota | Frontend precisa chamar `/recurso/1?id=1` | Trocar para `@PathVariable Long id` |
| Login retorna string simples | Nao da para manter sessao segura | Retornar JWT ou objeto de sessao |
| Senha retorna nas respostas | Risco de exposicao no frontend | Usar DTO sem `senha` |
| Ausencia de CORS | Frontend em outra porta pode ser bloqueado | Configurar CORS |
| Ausencia de handler global de erro | Erros podem vir como `500` generico | Criar `@RestControllerAdvice` |
| Criacao de campanha ignora `diafinalizado` | Campo pode aparecer nulo apos cadastro | Setar `diafinalizado` no service |
| DTOs de response nao sao usados nos controllers | JSON pode vir grande/ciclico por entidades JPA | Retornar DTOs nos controllers |
| `@Valid` ausente nos controllers | Validacoes dos DTOs podem nao rodar | Adicionar `@Valid` nos request bodies |
| `@NotBlank` usado em `Long`/`float` | Se validado, pode gerar erro de tipo | Usar `@NotNull`, `@Positive`, `@PositiveOrZero` |

## Checklist para implementar cliente HTTP

- Definir `API_BASE_URL=http://localhost:8080` em ambiente local.
- Enviar header `Content-Type: application/json` em `POST` e `PUT`.
- Criar funcoes separadas por recurso: `usuariosApi`, `ongsApi`, `campanhasApi`.
- Remover/ignorar `senha` de qualquer objeto usado em UI depois da resposta.
- Tratar `diafinalizado` como opcional em campanhas criadas.
- Implementar fallback para erros sem corpo JSON padronizado.
- Usar as chamadas especiais atuais para delete/busca ate o backend corrigir `@RequestParam` para `@PathVariable`.
