# Testes Automatizados Pata Digital

Este diretório contém todos os testes automatizados do projeto, organizados seguindo as melhores práticas de engenharia de software.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Diretórios](#estrutura-de-diretórios)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Executando os Testes](#executando-os-testes)
5. [Testes de Lógica de Negócio](#testes-de-lógica-de-negócio)
6. [Testes de Componentes UI](#testes-de-componentes-ui)
7. [Helpers e Mocks](#helpers-e-mocks)
8. [Métricas de Cobertura](#métricas-de-cobertura)
9. [Padrões e Convenções](#padrões-e-convenções)
10. [Guia de Desenvolvimento de Testes](#guia-de-desenvolvimento-de-testes)

---

## Visão Geral

O projeto implementa uma estratégia de testes em duas camadas:

| Camada    | Diretório      | Foco                     | Quantidade  |
| --------- | -------------- | ------------------------ | ----------- |
| **Logic** | `tests/logic/` | Services, Facades, Hooks | 14 arquivos |
| **UI**    | `tests/ui/`    | Componentes React        | 22 arquivos |

### Cobertura

- 37 arquivos de teste
- > 99% de cobertura em lógica de negócio
- Testes de integração para health checks
- Mocks isolados para APIs

---

## Estrutura de Diretórios

```
src/tests/
├── setup.ts                          # Configuração global do Vitest
│
├── helpers/                          # Utilitários de teste
│   ├── facade-mocks.ts               # Factory de mocks para Facades
│   └── facade-mocks.spec.ts          # Testes dos próprios mocks
│
├── mocks/                            # Dados mockados (fixtures)
│   ├── pets.json                     # Payload de pets
│   └── tutores.json                  # Payload de tutores
│
├── logic/                            # Testes de lógica de negócio
│   │
│   │ # Core - API
│   ├── api.endpoints.spec.ts         # Validação de endpoints
│   ├── http.service.spec.ts          # HTTP client + interceptors
│   │
│   │ # Core - Health
│   ├── health.service.spec.ts        # Probes de saúde
│   ├── health.store.spec.ts          # Estado reativo de saúde
│   ├── health-check.integration.spec.ts  # Integração health
│   │
│   │ # Feature - Auth
│   ├── auth.service.spec.ts          # Chamadas HTTP de auth
│   ├── auth.facade.spec.ts           # Estados e lógica de auth
│   │
│   │ # Feature - Pets
│   ├── pets.service.spec.ts          # CRUD de pets
│   ├── pets.facade.spec.ts           # Estado reativo de pets
│   │
│   │ # Feature - Tutores
│   ├── tutores.service.spec.ts       # CRUD de tutores
│   ├── tutores.facade.spec.ts        # Estado reativo de tutores
│   │
│   │ # Shared - Hooks
│   ├── useDebounce.spec.ts           # Hook de debounce
│   ├── useMask.spec.ts               # Hook de máscaras
│   └── useValidatedId.spec.ts        # Hook de validação de IDs
│
└── ui/                               # Testes de componentes React
    │
    │ # Core - Layouts
    ├── navbar.spec.tsx               # Barra de navegação
    ├── footer.spec.tsx               # Rodapé
    ├── main-layout.spec.tsx          # Layout principal
    │
    │ # Core - Routing
    ├── protected-route.spec.tsx      # Guard de autenticação
    │
    │ # Shared - Components
    ├── spinner.spec.tsx              # Loading indicator
    ├── empty-state.spec.tsx          # Estado vazio
    ├── pagination.spec.tsx           # Paginação
    ├── confirm-modal.spec.tsx        # Modal de confirmação
    ├── image-upload.spec.tsx         # Upload de imagens
    ├── api-status.spec.tsx           # Indicador API
    │
    │ # Shared - Toast
    ├── toast.spec.tsx                # Notificações
    ├── toast-container.spec.tsx      # Container de toasts
    │
    │ # Feature - Pets
    ├── pet-card.spec.tsx             # Card de pet
    ├── pets-list-page.spec.tsx       # Listagem de pets
    ├── pet-detail-page.spec.tsx      # Detalhes do pet
    ├── pet-form-page.spec.tsx        # Formulário de pet
    ├── link-tutor-page.spec.tsx      # Vincular tutor ao pet
    │
    │ # Feature - Tutores
    ├── tutor-card.spec.tsx           # Card de tutor
    ├── tutores-list-page.spec.tsx    # Listagem de tutores
    ├── tutor-detail-page.spec.tsx    # Detalhes do tutor
    ├── tutor-form-page.spec.tsx      # Formulário de tutor
    └── link-pet-page.spec.tsx        # Vincular pet ao tutor
```

---

## Tecnologias Utilizadas

| Biblioteca                    | Versão | Propósito                  |
| ----------------------------- | ------ | -------------------------- |
| **vitest**                    | 2.1.9  | Test runner Vite-native    |
| **@vitest/coverage-v8**       | 2.1.9  | Cobertura de código        |
| **@testing-library/react**    | 16.3.2 | Utilitários de teste React |
| **@testing-library/jest-dom** | 6.9.1  | Custom matchers para DOM   |
| **jsdom**                     | 25.0.1 | DOM virtual para testes    |

### Configuração (vitest.config.ts)

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    coverage: {
      reporter: ["text", "html", "clover"],
      include: [
        "src/app/core/api/**/*.ts",
        "src/app/core/health/**/*.ts",
        "src/app/features/**/api/**/*.ts",
        "src/app/features/**/facades/**/*.ts",
        "src/app/shared/hooks/**/*.ts",
      ],
    },
  },
});
```

---

## Executando os Testes

### Comandos Disponíveis

```bash
# Executar todos os testes
npm test

# Executar com cobertura
npm run test:coverage

# Modo watch (re-executa ao modificar)
npm run test:watch

# Executar categoria específica
npm test -- logic/        # Apenas lógica
npm test -- ui/           # Apenas UI

# Executar arquivo específico
npm test -- pets.facade
npm test -- auth.service

# Executar com verbose
npm test -- --reporter=verbose
```

### Output Esperado

```
 ✓ src/tests/logic/auth.facade.spec.ts (10 tests) 45ms
 ✓ src/tests/logic/auth.service.spec.ts (5 tests) 23ms
 ✓ src/tests/logic/pets.facade.spec.ts (8 tests) 32ms
 ✓ src/tests/logic/pets.service.spec.ts (7 tests) 28ms
 ...

 Test Files  36 passed (36)
      Tests  147 passed (147)
   Start at  10:30:15
   Duration  2.34s
```

### Cobertura de Código

```bash
npm run test:coverage
```

Output gerado em:

- **Terminal:** Resumo em texto
- **HTML:** `coverage/index.html`
- **Clover:** `coverage/clover.xml` (para CI/CD)

---

## Testes de Lógica de Negócio

### auth.facade.spec.ts

Testa o gerenciamento de estado de autenticação:

| Teste                                               | Descrição                      |
| --------------------------------------------------- | ------------------------------ |
| `deve iniciar em estado não autenticado`            | Estado inicial correto         |
| `deve efetuar login com sucesso`                    | Login e armazenamento de token |
| `deve emitir estados de carregamento durante login` | Estados de carregamento        |
| `deve tratar falha no login`                        | Tratamento de erros            |
| `deve realizar logout e limpar estado`              | Logout e limpeza               |
| `deve auto-login com credenciais de env`            | Auto-login via variáveis       |
| `deve restaurar sessão a partir de token existente` | Restauração de sessão          |
| `deve renovar token expirado`                       | Renovação automática           |
| `deve tratar falha no refresh`                      | Fallback em falha de refresh   |
| `deve prevenir logins concorrentes`                 | Prevenção de race conditions   |

### auth.service.spec.ts

Testa as chamadas HTTP de autenticação:

| Teste                                   | Descrição                    |
| --------------------------------------- | ---------------------------- |
| `deve chamar POST /autenticacao/login`  | Endpoint correto             |
| `deve retornar token e usuário`         | Payload de resposta          |
| `deve chamar PUT /autenticacao/refresh` | Refresh endpoint             |
| `deve tratar erros 401`                 | Tratamento de não autorizado |
| `deve limpar estado local no logout`    | Limpeza no logout            |

### pets.facade.spec.ts

Testa o gerenciamento de estado de pets:

| Teste                                        | Descrição             |
| -------------------------------------------- | --------------------- |
| `deve carregar pets com paginação`           | Carregamento paginado |
| `deve emitir estados de carregamento`        | Estados de loading    |
| `deve tratar resposta vazia`                 | Lista vazia           |
| `deve obter pet por ID`                      | Busca por ID          |
| `deve validar ID do pet antes da requisição` | Validação de entrada  |
| `deve salvar novo pet`                       | Criação de pet        |
| `deve atualizar pet existente`               | Atualização de pet    |
| `deve deletar pet`                           | Exclusão de pet       |

### pets.service.spec.ts

Testa as chamadas HTTP de pets:

| Teste                                             | Descrição         |
| ------------------------------------------------- | ----------------- |
| `deve chamar GET /v1/pets com paginação`          | Listagem paginada |
| `deve chamar GET /v1/pets/{id}`                   | Busca por ID      |
| `deve chamar POST /v1/pets`                       | Criação           |
| `deve chamar PUT /v1/pets/{id}`                   | Atualização       |
| `deve chamar DELETE /v1/pets/{id}`                | Exclusão          |
| `deve chamar POST /v1/pets/{id}/fotos`            | Upload de foto    |
| `deve chamar DELETE /v1/pets/{id}/fotos/{fotoId}` | Remoção de foto   |

### tutores.facade.spec.ts

Testa o gerenciamento de estado de tutores:

| Teste                                 | Descrição             |
| ------------------------------------- | --------------------- |
| `deve carregar tutores com paginação` | Carregamento paginado |
| `deve obter tutor por ID`             | Busca por ID          |
| `deve salvar tutor`                   | Criação/Atualização   |

### tutores.service.spec.ts

Testa as chamadas HTTP de tutores:

| Teste                                              | Descrição           |
| -------------------------------------------------- | ------------------- |
| `deve chamar GET /v1/tutores com paginação`        | Listagem            |
| `deve chamar GET /v1/tutores/{id}`                 | Busca por ID        |
| `deve chamar POST /v1/tutores`                     | Criação             |
| `deve chamar PUT /v1/tutores/{id}`                 | Atualização         |
| `deve chamar DELETE /v1/tutores/{id}`              | Exclusão            |
| `deve chamar POST /v1/tutores/{id}/fotos`          | Upload              |
| `deve chamar POST /v1/tutores/{id}/pets/{petId}`   | Vincular pet        |
| `deve chamar DELETE /v1/tutores/{id}/pets/{petId}` | Desvincular pet     |
| `deve tratar todos os cenários de erro`            | Tratamento de erros |

### health.service.spec.ts

Testa os health checks (requisito sênior):

| Teste                                          | Descrição                |
| ---------------------------------------------- | ------------------------ |
| `deve checar liveness probe`                   | Verificação de liveness  |
| `deve checar readiness probe`                  | Verificação de readiness |
| `deve retornar status healthy`                 | Status saudável          |
| `deve retornar 'unhealthy' em caso de timeout` | Tratamento de timeout    |
| `deve retornar 'unhealthy' em erro de rede`    | Erro de rede             |
| `deve medir tempo de resposta`                 | Métricas de tempo        |
| ...(15 testes no total)                        |                          |

### Hook Tests

| Arquivo                  | Testes | Descrição                        |
| ------------------------ | ------ | -------------------------------- |
| `useDebounce.spec.ts`    | 3      | Atraso de execução, cancelamento |
| `useMask.spec.ts`        | 2      | Máscara de telefone, CPF         |
| `useValidatedId.spec.ts` | 3      | Validação de IDs numéricos       |

---

## Testes de Componentes UI

### Padrão de Teste de Componente

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PetCard } from '../../app/features/pets/components/PetCard'

describe('PetCard', () => {
  const mockPet = {
    id: 1,
    nome: 'Rex',
    raca: 'Labrador',
    idade: 3,
    fotoUrl: 'http://example.com/rex.jpg'
  }

  it('deve renderizar as informações do pet', () => {
    render(<PetCard pet={mockPet} onClick={vi.fn()} />)

    expect(screen.getByText('Rex')).toBeInTheDocument()
    expect(screen.getByText('Labrador')).toBeInTheDocument()
    expect(screen.getByText('3 anos')).toBeInTheDocument()
  })

  it('deve chamar onClick ao clicar', () => {
    const handleClick = vi.fn()
    render(<PetCard pet={mockPet} onClick={handleClick} />)

    fireEvent.click(screen.getByRole('article'))

    expect(handleClick).toHaveBeenCalledWith(mockPet)
  })

  it('deve renderizar placeholder quando não houver foto', () => {
    const petWithoutPhoto = { ...mockPet, fotoUrl: undefined }
    render(<PetCard pet={petWithoutPhoto} onClick={vi.fn()} />)

    expect(screen.getByTestId('placeholder-image')).toBeInTheDocument()
  })
})
```

### Componentes Testados

#### Core Layouts

| Componente   | Testes | Validações                      |
| ------------ | ------ | ------------------------------- |
| `Navbar`     | 3      | Renderização, links, responsivo |
| `Footer`     | 2      | Renderização, conteúdo          |
| `MainLayout` | 2      | Estrutura, children             |

#### Core Routing

| Componente       | Testes | Validações                    |
| ---------------- | ------ | ----------------------------- |
| `ProtectedRoute` | 4      | Auth guard, redirect, loading |

#### Shared Components

| Componente       | Testes | Validações                  |
| ---------------- | ------ | --------------------------- |
| `Spinner`        | 2      | Renderização, variantes     |
| `EmptyState`     | 3      | Mensagem, ícone, ação       |
| `Pagination`     | 5      | Navegação, estados disabled |
| `ConfirmModal`   | 4      | Abertura, callbacks, teclas |
| `ImageUpload`    | 4      | Upload, preview, validação  |
| `ApiStatus`      | 2      | Status healthy/unhealthy    |
| `Toast`          | 4      | Tipos, dismiss, animação    |
| `ToastContainer` | 3      | Lista, posição, limite      |

#### Feature Components

| Componente        | Testes | Validações                              |
| ----------------- | ------ | --------------------------------------- |
| `PetCard`         | 3      | Dados, click, foto                      |
| `TutorCard`       | 3      | Dados, click, foto                      |
| `PetsListPage`    | 4      | Lista, paginação, busca, loading        |
| `PetDetailPage`   | 3      | Dados, tutor vinculado, ações           |
| `PetFormPage`     | 5      | Formulário, validação, upload, submit   |
| `TutoresListPage` | 4      | Lista, paginação, busca, loading        |
| `TutorDetailPage` | 4      | Dados, pets vinculados, ações           |
| `TutorFormPage`   | 5      | Formulário, validação, máscaras, submit |
| `LinkTutorPage`   | 3      | Seleção, vinculação, navegação          |
| `LinkPetPage`     | 3      | Seleção, vinculação, navegação          |

---

## Helpers e Mocks

### facade-mocks.ts

Factory para criação de mocks de Facades com observables:

```typescript
import { BehaviorSubject } from "rxjs";
import { vi } from "vitest";

export const createMockPetsFacade = () => {
  const _pets$ = new BehaviorSubject<Pet[]>([]);
  const _isLoading$ = new BehaviorSubject<boolean>(false);
  const _error$ = new BehaviorSubject<string | null>(null);

  return {
    pets$: _pets$.asObservable(),
    isLoading$: _isLoading$.asObservable(),
    error$: _error$.asObservable(),

    getAllPets: vi.fn(),
    getPetById: vi.fn(),
    savePet: vi.fn(),
    deletePet: vi.fn(),

    // Helpers para testes
    __setPets: (pets: Pet[]) => _pets$.next(pets),
    __setLoading: (loading: boolean) => _isLoading$.next(loading),
    __setError: (error: string | null) => _error$.next(error),
  };
};
```

### Fixtures (mocks/\*.json)

**pets.json:**

```json
{
  "content": [
    {
      "id": 1,
      "nome": "Rex",
      "raca": "Labrador",
      "especie": "Cachorro",
      "idade": 3,
      "foto": { "id": 1, "url": "http://example.com/rex.jpg" }
    }
  ],
  "pageCount": 1,
  "total": 1
}
```

**tutores.json:**

```json
{
  "content": [
    {
      "id": 1,
      "nome": "João Silva",
      "telefone": "(65) 99999-9999",
      "endereco": "Rua Principal, 123",
      "foto": { "id": 1, "url": "http://example.com/joao.jpg" }
    }
  ],
  "pageCount": 1,
  "total": 1
}
```

---

## Métricas de Cobertura

### Categorias Cobertas

| Categoria        | Arquivos | Statements | Branches | Functions | Lines    |
| ---------------- | -------- | ---------- | -------- | --------- | -------- |
| Core API         | 4        | >99%       | >99%     | >99%      | >99%     |
| Core Health      | 2        | >99%       | >99%     | >99%      | >99%     |
| Feature Services | 3        | >99%       | >99%     | >99%      | >99%     |
| Feature Facades  | 3        | >99%       | >99%     | >99%      | >99%     |
| Shared Hooks     | 3        | >99%       | >99%     | >99%      | >99%     |
| **Total**        | **15**   | **>99%**   | **>99%** | **>99%**  | **>99%** |

### Arquivos Excluídos da Cobertura

- `**/*.d.ts` - Declarações de tipo
- `**/*.spec.ts` - Arquivos de teste
- `src/tests/setup.ts` - Configuração
- `src/app/core/api/api-types.ts` - Apenas types
- `src/app/features/**/models/**/*.ts` - Apenas interfaces

---

## Padrões e Convenções

### Nomenclatura

| Tipo             | Padrão                   | Exemplo                    |
| ---------------- | ------------------------ | -------------------------- |
| Arquivo de teste | `nome-modulo.spec.ts(x)` | `pets.facade.spec.ts`      |
| Describe         | Nome do módulo           | `describe('PetsFacade')`   |
| It               | Comportamento esperado   | `it('deve carregar pets')` |

### Estrutura de Teste

```typescript
describe("NomeDoModulo", () => {
  // Setup compartilhado
  let facade: PetsFacade;
  let mockService: MockPetsService;

  beforeEach(() => {
    // Arrange - preparar dados e mocks
    mockService = createMockPetsService();
    facade = new PetsFacade(mockService);
  });

  afterEach(() => {
    // Cleanup
    vi.clearAllMocks();
  });

  describe("metodo()", () => {
    it("deve comportamento esperado", async () => {
      // Arrange - setup específico
      mockService.getAll.mockResolvedValue(mockData);

      // Act - executar ação
      await facade.getAllPets(1);

      // Assert - verificar resultado
      expect(mockService.getAll).toHaveBeenCalledWith(1, "", 10);
    });
  });
});
```

### Imports Padronizados

```typescript
// Utilitários de teste
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Módulo sob teste
import { PetsFacade } from "../../app/features/pets/facades/pets.facade";

// Mocks e helpers
import { createMockPetsService } from "../helpers/facade-mocks";
import petsFixture from "../mocks/pets.json";
```

---

## Guia de Desenvolvimento de Testes

### Criando um Novo Teste de Service

1. Criar arquivo em `tests/logic/`:

```typescript
// novo.service.spec.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { novoService } from "../../app/features/novo/api/novo.service";

vi.mock("../../app/core/api/api.client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("NovoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve chamar o endpoint correto", async () => {
    // ...
  });
});
```

### Criando um Novo Teste de Componente

1. Criar arquivo em `tests/ui/`:

```typescript
// novo-component.spec.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { NovoComponent } from '../../app/features/novo/components/NovoComponent'

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('NovoComponent', () => {
  it('deve renderizar corretamente', () => {
    renderWithRouter(<NovoComponent />)

    expect(screen.getByText('Título')).toBeInTheDocument()
  })
})
```

### Boas Práticas

1. **Isolar testes:** Cada teste deve ser independente
2. **Mock externo:** Sempre mockar APIs e serviços externos
3. **Testar comportamento:** Foque em comportamento, não implementação
4. **Nomes descritivos:** `should {verbo} {resultado} when {condição}`
5. **AAA Pattern:** Arrange, Act, Assert
6. **Evitar magic numbers:** Use constantes com nomes significativos

---

## Referências

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices - Kent C. Dodds](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [RxJS Testing](https://rxjs.dev/guide/testing/marble-testing)
