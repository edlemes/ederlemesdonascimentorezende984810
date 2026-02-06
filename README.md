# Pata Digital Registro de Pets e Tutores (MT)

<div align="center">

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.18-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![RxJS](https://img.shields.io/badge/RxJS-7.8.2-B7178C?style=for-the-badge&logo=reactivex&logoColor=white)
![Coverage](https://img.shields.io/badge/Coverage->99%25-success?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Sistema de Registro Público de Pets e Tutores para o Estado de Mato Grosso**

_Projeto Prático Pata Digital_

[Demonstração](#como-rodar) | [Arquitetura](#arquitetura) | [Testes](#testes) | [Docker](#docker-e-health-checks)

</div>

SPA para o registro público de Pets e Tutores do Estado de Mato Grosso, desenvolvida em React + TypeScript.

---

## Dados do Candidato

| Campo            | Valor                                                         |
| ---------------- | ------------------------------------------------------------- |
| **Nome**         | Eder Lemes do Nascimento Resende                              |
| **CPF**          | 984.810.881-53                                                |
| **Email**        | ederlemesmt@gmail.com                                         |
| **Celular**      | (65) 99209-7227                                               |
| **Telefone**     | (65) 9920-9722                                                |
| **Nº Inscrição** | 16529                                                         |
| **Edital**       | Processo Seletivo Conjunto nº 001/2026/SEPLAG e demais Órgãos |
| **Cargo**        | Analista de Tecnologia da Informação                          |
| **Perfil**       | Engenheiro da Computação - Sênior                             |
| **Local**        | Secretaria de Estado de Planejamento e Gestão Cuiabá/MT       |
| **Projeto**      | ANEXO II-B Implementação Front-End (SPA)                      |

**Sobre o nome do repositório:** O sobrenome correto é **Resende** (com S), conforme documentos oficiais. O repositório foi criado com "rezende" (com Z) por erro de digitação. Como renomear no GitHub alteraria a URL o que poderia impactar a avaliação caso o link já esteja registrado pela banca optou-se por manter o endereço original e registrar a correção aqui.

**Sobre o campo "espécie" nos pets:** O endpoint `POST/PUT /v1/pets` da API não aceita nem retorna o parâmetro `especie` o Swagger confirma que o campo não existe no schema do recurso Pet. Por isso a tela de cadastro/edição não inclui esse campo, já que não há como persistir a informação.

---

## Como Rodar

### Desenvolvimento local

```bash
git clone https://github.com/edlemes/ederlemesdonascimentorezende984810.git
cd ederlemesdonascimentorezende984810
npm install
cp .env.example .env   # editar com as credenciais (ver tabela abaixo)
npm run dev             # abre em http://localhost:5173
```

### Via Docker

```bash
cp .env.example .env
# editar VITE_AUTH_USERNAME e VITE_AUTH_PASSWORD se necessário (default: admin/admin)
docker compose up -d --build
# Acesse http://localhost:3000
```

O `.env` é **obrigatório** sem as credenciais de autenticação, a aplicação não consegue se comunicar com a API. O `.env.example` já vem com os valores padrão, basta copiar.

Para produção customizando a porta: `docker compose -f docker-compose.prod.yml up -d --build` (usa `HOST_PORT` do `.env`, padrão 3000).

Para desenvolvimento com hot reload: `docker compose -f docker-compose.dev.yml up --build` (porta 5173).

### Variáveis de ambiente

| Variável             | Obrigatória | Descrição                                        |
| -------------------- | ----------- | ------------------------------------------------ |
| `VITE_API_URL`       | Não\*       | URL da API (`https://pet-manager-api.geia.vip/`) |
| `VITE_APP_URL`       | Não         | URL da aplicação (`http://localhost:5173/`)      |
| `VITE_PORT`          | Não         | Porta do dev server (padrão: 5173)               |
| `VITE_AUTH_USERNAME` | Sim         | Usuário de autenticação na API (padrão: admin)   |
| `VITE_AUTH_PASSWORD` | Sim         | Senha de autenticação na API (padrão: admin)     |
| `HOST_PORT`          | Não         | Porta do container Docker (padrão: 3000)         |

\*Já tem default no `docker-compose.yml` apontando para a API.

Exemplo de `.env` completo:

```dotenv
VITE_API_URL=https://pet-manager-api.geia.vip/
VITE_APP_URL=http://localhost:5173/
VITE_PORT=5173

VITE_AUTH_USERNAME=admin
VITE_AUTH_PASSWORD=admin
```

Outros scripts úteis: `npm run build`, `npm test`, `npm run test:coverage`, `npm run lint`.

---

## Arquitetura

O projeto usa **Clean Architecture com Facade Pattern**, organizado em vertical slices. A regra central é que nenhum componente React chama HTTP diretamente tudo passa por uma Facade que gerencia estado via RxJS `BehaviorSubject`.

O fluxo de dados é unidirecional:

```
Componente React  ──(ação)──►  Facade  ──(HTTP)──►  Service  ──►  API
       ▲                         │
       └─────(subscribe)─────────┘
            Observable<T>
```

Na prática:

1. O componente assina Observables da Facade (`pets$`, `isLoading$`, `error$`)
2. Quando o usuário faz algo, o componente chama um método da Facade
3. A Facade ativa o loading, delega ao Service, e atualiza o `BehaviorSubject` com o resultado
4. O componente re-renderiza automaticamente pela subscription

### Estrutura de pastas

```
src/app/
├── core/
│   ├── api/
│   ├── health/
│   ├── layouts/
│   └── routing/
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── facades/
│   │   └── models/
│   ├── pets/
│   │   ├── api/
│   │   ├── components/
│   │   ├── facades/
│   │   ├── models/
│   │   ├── pages/
│   │   └── pets.routes.tsx
│   └── tutores/
│       └── (mesma estrutura de pets)
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── layouts/
│   └── toast/
└── tests/
    ├── setup.ts
    ├── helpers/
    ├── logic/
    ├── mocks/
    └── ui/
```

Cada feature é autocontida: tem seu service (HTTP), facade (estado), models (types), pages (telas) e components (visuais). Adicionar uma nova feature não mexe em código existente.

O `core/` concentra infraestrutura compartilhada: o client Axios com interceptors de token, os endpoints centralizados, o health check e os componentes de layout (Navbar, Footer, ProtectedRoute). O `shared/` tem componentes reutilizáveis como Pagination, Spinner, ConfirmModal, ImageUpload e o sistema de toasts.

---

## O que foi implementado

### Requisitos Gerais

- ✅ Comunicação com API via Axios com interceptors
- ✅ Layout responsivo Tailwind CSS 4, mobile first
- ✅ Lazy Loading de rotas com `React.lazy` + `Suspense`
- ✅ Paginação fixa em 10 itens por página
- ✅ TypeScript em strict mode
- ✅ Testes unitários Vitest + Testing Library, 37 arquivos

### Telas

| Tela                     | Endpoints                                               | Observações                                                                                                                  |
| ------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Listagem de Pets         | `GET /v1/pets`                                          | Cards com foto, nome, espécie, idade. Busca por nome. Paginação 10/pg.                                                       |
| Detalhes do Pet          | `GET /v1/pets/{id}`, `GET /v1/tutores/{id}`             | Nome em destaque. Exibe tutor vinculado quando existir.                                                                      |
| Cadastro/Edição de Pet   | `POST/PUT /v1/pets`, `POST /v1/pets/{id}/fotos`         | Campos: nome, espécie, idade, raça. Upload de foto. Máscaras nos inputs.                                                     |
| Cadastro/Edição de Tutor | `POST/PUT /v1/tutores`, `POST /v1/tutores/{id}/fotos`   | Campos: nome, telefone, endereço. Upload de foto. Vincular/desvincular pets via `POST/DELETE /v1/tutores/{id}/pets/{petId}`. |
| Login                    | `POST /autenticacao/login`, `PUT /autenticacao/refresh` | Refresh automático do JWT. Logout limpa token e redireciona.                                                                 |

### Requisitos Sênior

- ✅ **Health Checks** Liveness via `/health.html` (Nginx) e Readiness via `/q/health` (API)
- ✅ **Cobertura de testes** acima de 99% em lógica de negócio
- ✅ **Facade Pattern** `AuthFacade`, `PetsFacade`, `TutoresFacade`
- ✅ **BehaviorSubject** Estado reativo em todas as facades

### Entrega

- ✅ Docker Multi-stage build (Node + Nginx Alpine), imagem final ~25MB
- ✅ README com documentação da arquitetura

---

## Testes

São 37 arquivos de teste:

- **`tests/logic/`** 14 specs de facades, services, hooks e health checks. Testam lógica pura sem DOM.
- **`tests/ui/`** 22 specs de componentes React, renderizados no jsdom via Testing Library.
- **`tests/helpers/`** 1 spec + utilitários de mock centralizados para as facades.

A cobertura fica acima de **99%** para statements, branches, functions e lines em toda a camada de lógica.

```bash
npm test                # executa tudo
npm run test:coverage   # com relatório
npm test -- logic/      # só lógica
npm test -- ui/         # só componentes
```

A testabilidade vem da injeção de dependência: cada facade recebe o service no construtor com valor default. Em produção, usa o service real. Em teste, passa um mock:

```typescript
const mockService = {
  getAll: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
};
const facade = new PetsFacade(mockService);

await facade.getAllPets(1);
expect(mockService.getAll).toHaveBeenCalledWith(1, "", 10);
```

Os mocks das facades para testes de UI ficam centralizados em `facade-mocks.ts`, evitando duplicação entre os 22 specs de componentes.

---

## Docker e Health Checks

O Dockerfile usa **multi-stage build**: primeiro estágio compila com Node 20 Alpine, segundo serve via Nginx Alpine. Imagem final fica em torno de 25MB.

O container já vem com health check configurado:

| Probe     | Verifica              | Endpoint               |
| --------- | --------------------- | ---------------------- |
| Liveness  | Nginx respondendo     | `GET /health.html`     |
| Readiness | API externa acessível | `GET /q/health` na API |

```bash
docker inspect --format='{{.State.Health.Status}}' pata-digital
docker exec pata-digital /usr/local/bin/healthcheck.sh
```

Se o container aparecer como `unhealthy`, geralmente é a API externa que está fora. O liveness (Nginx) costuma estar OK se esse falhar, o Docker reinicia o container automaticamente.

Fora do Docker, há scripts de validação:

- Windows: `.\scripts\health-check.ps1`
- Linux/macOS: `./scripts/health-check.sh`

### Arquivos docker-compose

| Arquivo                    | Uso principal                            | Observação                                       |
| -------------------------- | ---------------------------------------- | ------------------------------------------------ |
| `docker-compose.yml`       | Produção simples (padrão porta 3000)     | Usa defaults do compose; requer `.env` para auth |
| `docker-compose.prod.yml`  | Produção customizando a porta (`HOST_PORT`) | Mesmo build da imagem final; define porta via `.env` |
| `docker-compose.dev.yml`   | Desenvolvimento com hot reload (porta 5173) | Monta volume do código, roda `npm ci` + `npm run dev -- --host` |

---

## Decisões Técnicas

**Resiliência de token:** O interceptor do Axios captura 401, tenta refresh do JWT e, se falhar, tenta re-autenticar via `.env`. O logout só acontece quando tudo falha. Isso evita que o usuário perca a sessão por expiração.

**Tailwind sem component library:** Usar Shadcn/UI ou DaisyUI poderia agilizar, mas todos os componentes Pagination, Modal, Toast, ImageUpload foram estilizados do zero com Tailwind puro.

---

## Problemas Conhecidos

- O **auto-login** via `.env` é só para desenvolvimento. Em produção essas variáveis não devem existir.
- Uploads de imagem muito grandes (acima de ~5MB) podem retornar 500 da API. O front exibe toast de erro, mas não valida tamanho antes do envio.
- O **hot reload no Docker** em modo dev pode ter atraso de alguns segundos no Windows, por causa do file system bridging entre WSL2 e NTFS.

---

## Stack

### Dependências de produção

| Biblioteca        | Versão  | Propósito                        |
| ----------------- | ------- | -------------------------------- |
| react             | 19.2.0  | Biblioteca UI                    |
| react-dom         | 19.2.0  | Renderização no DOM              |
| react-router-dom  | 7.13.0  | Roteamento e lazy loading        |
| axios             | 1.13.2  | Cliente HTTP com interceptors    |
| rxjs              | 7.8.2   | Estado reativo (BehaviorSubject) |
| tailwindcss       | 4.1.18  | Framework CSS utility-first      |
| @tailwindcss/vite | 4.1.18  | Plugin Tailwind nativo para Vite |
| lucide-react      | 0.563.0 | Ícones SVG                       |

### Dependências de desenvolvimento

| Biblioteca                  | Versão  | Propósito                                       |
| --------------------------- | ------- | ----------------------------------------------- |
| typescript                  | 5.9.3   | Tipagem estática                                |
| vite                        | 7.2.4   | Build tool e dev server                         |
| @vitejs/plugin-react        | 5.1.1   | Suporte React no Vite                           |
| vitest                      | 2.1.9   | Test runner                                     |
| @vitest/coverage-v8         | 2.1.9   | Relatório de cobertura                          |
| @testing-library/react      | 16.3.2  | Utilitários de teste para componentes           |
| @testing-library/jest-dom   | 6.9.1   | Matchers customizados (toBeInTheDocument, etc.) |
| jsdom                       | 25.0.1  | DOM virtual para testes                         |
| eslint                      | 9.39.1  | Linting                                         |
| typescript-eslint           | 8.46.4  | Regras ESLint para TypeScript                   |
| eslint-plugin-react-hooks   | 7.0.1   | Regras para hooks do React                      |
| eslint-plugin-react-refresh | 0.4.24  | Regras para React Refresh (HMR)                 |
| @eslint/js                  | 9.39.1  | Configuração base ESLint                        |
| globals                     | 16.5.0  | Definições de globais para ESLint               |
| postcss                     | 8.5.6   | Processador CSS (pipeline Tailwind)             |
| autoprefixer                | 10.4.23 | Prefixos CSS automáticos                        |
| @types/react                | 19.2.5  | Types do React                                  |
| @types/react-dom            | 19.2.3  | Types do React DOM                              |
| @types/node                 | 24.10.9 | Types do Node.js                                |

---

## Referências

- [Swagger da API](https://pet-manager-api.geia.vip/q/swagger-ui/)
- [React](https://react.dev/)
- [RxJS](https://rxjs.dev/guide/overview)
- [Vitest](https://vitest.dev/)

---

Projeto desenvolvido para avaliação técnica Processo Seletivo SEPLAG/MT.
