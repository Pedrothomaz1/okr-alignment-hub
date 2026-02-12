

## Phase 6: Check-ins de Key Results

Na metodologia OKR, registrar check-ins periodicos nos Key Results e fundamental para acompanhar a evolucao ao longo do tempo. Esta fase adiciona um historico de atualizacoes com notas, permitindo que a equipe veja como o progresso evoluiu.

---

### O que sera construido

1. **Tabela `kr_checkins`** no banco de dados para armazenar o historico de cada atualizacao de valor em um Key Result, incluindo nota/comentario opcional e quem fez o check-in.

2. **Timeline de check-ins** na pagina de detalhe do Objetivo, dentro de cada `KeyResultCard`:
   - Ao expandir um KR, o usuario ve a lista de check-ins anteriores (data, valor atualizado, nota, autor)
   - Formulario inline para registrar novo check-in (valor + nota)

3. **Atualizacao automatica do `current_value`** do KR ao criar um check-in (trigger no banco), eliminando a necessidade de atualizar manualmente.

---

### Detalhes Tecnicos

**Migracao de banco de dados (1 migracao):**

- CREATE TABLE `kr_checkins`:
  - `id` UUID PK DEFAULT gen_random_uuid()
  - `key_result_id` UUID NOT NULL FK -> key_results.id ON DELETE CASCADE
  - `author_id` UUID NOT NULL FK -> profiles.id
  - `value` numeric NOT NULL (o valor registrado neste check-in)
  - `note` text (comentario opcional)
  - `created_at` timestamptz DEFAULT now()
  - Index em `key_result_id`, `created_at`

- RLS policies:
  - SELECT: todos autenticados
  - INSERT: admin, okr_master, ou dono do KR (via subquery em key_results.owner_id)
  - DELETE: admin apenas

- Trigger function `sync_kr_value_on_checkin()`:
  - AFTER INSERT em `kr_checkins`, atualiza `key_results.current_value` com o valor do check-in mais recente
  - Isso ja dispara o trigger existente `update_objective_progress()` em cascata

- Audit trigger reutilizando `audit_trigger_fn`

**Novos arquivos frontend (2):**
- `src/hooks/useCheckins.ts` -- Hook com query `["checkins", krId]` para listar check-ins de um KR e mutation para criar novo check-in
- `src/components/okr/CheckinTimeline.tsx` -- Componente que exibe a lista de check-ins em formato timeline e formulario inline para novo check-in (campo de valor + nota + botao salvar)

**Arquivos modificados (1):**
- `src/components/okr/KeyResultCard.tsx` -- Adicionar botao "Historico" que expande/colapsa o `CheckinTimeline` dentro do card. Remover a edicao inline de valor atual (substituida pelo check-in)

**Nenhuma dependencia nova necessaria.**

**Resumo de arquivos:**
- Criados (2): `src/hooks/useCheckins.ts`, `src/components/okr/CheckinTimeline.tsx`
- Modificados (1): `src/components/okr/KeyResultCard.tsx`
- Migracao (1): nova tabela `kr_checkins` + trigger + RLS

