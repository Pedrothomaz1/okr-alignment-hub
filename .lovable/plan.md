

## Plano: Expandir Cobertura de Testes Unitarios

O projeto tem 5 arquivos de teste cobrindo validações, error boundary, safe-error e auth guards. Faltam testes para os hooks principais de negocio e utilitarios criticos.

### Arquivos de teste a criar

**1. `src/test/useAuth.test.ts`** — Testes do hook de autenticacao
- Mock do supabase client (auth.signUp, signIn, signOut, resetPasswordForEmail, mfa.*)
- Verifica que signUp passa email, password e full_name corretamente
- Verifica que signIn retorna erro quando credenciais invalidas
- Verifica que signOut chama supabase.auth.signOut
- Verifica que resetPassword usa redirectTo correto

**2. `src/test/useObjectives.test.ts`** — Testes do hook de objetivos
- Mock do supabase e react-query
- Retorna lista vazia quando cycleId undefined
- Mapeia owner_name e kr_count corretamente dos dados retornados
- createObjective usa user.id como fallback para owner_id
- createObjective lanca erro quando nao autenticado

**3. `src/test/useKeyResults.test.ts`** — Testes do hook de KRs
- Retorna lista vazia quando objectiveId undefined
- Mapeia owner_name corretamente
- createKeyResult usa user.id como fallback
- createKeyResult lanca erro sem autenticacao

**4. `src/test/useCycles.test.ts`** — Testes do hook de ciclos
- createCycle lanca erro sem autenticacao
- createCycle passa created_by com user.id

**5. `src/test/useCheckins.test.ts`** — Testes do hook de check-ins
- Retorna lista vazia sem keyResultId
- createCheckin adiciona author_id do user
- createCheckin lanca erro sem autenticacao

**6. `src/test/useRoles.test.ts`** — Testes do hook de roles
- Retorna lista vazia sem userId
- hasRole retorna true/false corretamente
- isAdmin mapeia role "admin"

### Abordagem tecnica

- Todos os testes mocam `@/integrations/supabase/client` com `vi.mock`
- Hooks com react-query serao testados com `renderHook` + `QueryClientProvider` wrapper
- Mock do `useAuth` onde necessario para injetar user fake
- Padrao consistente com os testes existentes (vitest, describe/it/expect)

### Resultado esperado
- Cobertura dos fluxos criticos de CRUD (objectives, KRs, cycles, checkins)
- Validacao de guards de autenticacao em cada mutation
- Base solida para rodar antes de cada deploy

