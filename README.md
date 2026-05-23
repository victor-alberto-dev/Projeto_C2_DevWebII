# Biblioteca Digital - API REST

API REST completa para um sistema de biblioteca digital, desenvolvida como projeto da C2 da disciplina de Desenvolvimento Web II.

## Domínio

Sistema para gerenciamento de **biblioteca digital** com as seguintes entidades:

| Entidade | Descrição |
|---|---|
| **User** | Usuários do sistema (roles: `USER` e `ADMIN`) |
| **Author** | Autores de livros |
| **Book** | Livros do acervo (vinculado a um autor) |
| **Loan** | Empréstimos de livros por usuários |
| **Reservation** | Reservas de livros por usuários |

## Stack

- **Runtime:** Node.js 22 + TypeScript (ES Modules)
- **Framework:** Express.js 5
- **ORM:** Prisma 7 + SQLite
- **Autenticação:** JWT + bcryptjs
- **Validação:** Zod
- **Testes:** Vitest + Supertest

## Instalação e uso

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env e defina um JWT_SECRET seguro

# 3. Criar o banco de dados e rodar migrations
npx prisma migrate dev --name init

# 4. Iniciar servidor em desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

## Rotas da API

### Autenticação
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/auth/register` | Público | Criar conta |
| POST | `/auth/login` | Público | Login e retorno de JWT |
| GET | `/auth/me` | Autenticado | Dados do usuário logado |

### Autores
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/authors` | Público | Listar autores |
| GET | `/authors/:id` | Público | Buscar autor com livros |
| POST | `/authors` | ADMIN | Criar autor |
| PUT | `/authors/:id` | ADMIN | Atualizar autor |
| DELETE | `/authors/:id` | ADMIN | Remover autor |

### Livros
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/books` | Público | Listar livros com autor |
| GET | `/books/:id` | Público | Buscar livro com detalhes |
| POST | `/books` | ADMIN | Criar livro |
| PUT | `/books/:id` | ADMIN | Atualizar livro |
| DELETE | `/books/:id` | ADMIN | Remover livro |

### Empréstimos
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/loans` | Autenticado | Listar empréstimos (ADMIN vê todos) |
| GET | `/loans/:id` | Autenticado | Buscar empréstimo |
| POST | `/loans` | Autenticado | Criar empréstimo |
| PATCH | `/loans/:id/return` | Dono/ADMIN | Devolver livro |
| DELETE | `/loans/:id` | ADMIN | Remover registro |

### Reservas
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/reservations` | Autenticado | Listar reservas (ADMIN vê todas) |
| GET | `/reservations/:id` | Autenticado | Buscar reserva |
| POST | `/reservations` | Autenticado | Criar reserva |
| PATCH | `/reservations/:id/confirm` | ADMIN | Confirmar reserva |
| DELETE | `/reservations/:id` | Dono/ADMIN | Cancelar reserva |

## Exemplos de requisição (curl)

```bash
# Registrar usuário
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João Silva","email":"joao@email.com","password":"senha123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@email.com","password":"senha123"}'

# Criar autor (ADMIN)
curl -X POST http://localhost:3000/authors \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Machado de Assis","bio":"Escritor brasileiro"}'

# Listar livros (público)
curl http://localhost:3000/books

# Criar reserva
curl -X POST http://localhost:3000/reservations \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookId":"ID_DO_LIVRO"}'
```

## Testes

```bash
# Rodar todos os testes
npm test

# Rodar com cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

## Cobertura de testes

O projeto atinge **≥ 70%** de cobertura de linhas e funções (threshold configurado no `vitest.config.ts`).

O print do relatório de cobertura está disponível em [`docs/`](docs/).

## Tornar usuário ADMIN (via Prisma Studio)

```bash
npx prisma studio
# Acesse http://localhost:51212, edite o campo 'role' do usuário para 'ADMIN'
```
