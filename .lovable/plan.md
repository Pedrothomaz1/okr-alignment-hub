

# Plano de Implementacao Completo — Veri OKR + Weekdone Features

Este plano cobre a validacao das funcionalidades ja existentes e a implementacao das 8 novas features inspiradas no Weekdone, organizadas em 4 sprints incrementais.

---

## Funcionalidades Ja Existentes (validadas no codigo)

As seguintes funcionalidades ja estao implementadas e funcionais:

| Funcionalidade | Status | Arquivos Principais |
|---|---|---|
| Arvore hierarquica de OKRs | Implementado | OKRTreeView, OKROrgChart, useOKRTree |
| Check-ins com confianca | Implementado | useCheckins, CheckinTimeline, CheckinChart |
| Ciclos configuraveis com travamento | Implementado | useCycles, CycleDetail, lock_cycle_on_active trigger |
| Dashboard com progresso e feed | Implementado | Dashboard, useDashboardStats, ActivityFeed |
| Gestao de equipe e colaboradores | Implementado | MyTeam, useMyTeam, useOKRCollaborators |
| Change requests para ciclos travados | Implementado | ChangeRequestCard, useChangeRequests, decide_change_request |
| Newsfeed Social (parcial) | Implementado | ActivityFeed com comentarios via activity_comments |

---

## Sprint 1 — PPP Semanal + Pulse Survey (Engajamento Individual)

### 1.1 PPP Semanal (Plans, Progress, Problems)

**Banco de dados** — Nova tabela `weekly_ppp`:

```text
weekly_ppp
- id: uuid PK
- user_id: uuid FK profiles(id) NOT NULL
- week_start: date NOT NULL
- plans: text NOT NULL
- progress: text NOT NULL  
- problems: text NOT NULL
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
- UNIQUE(user_id, week_start)
```

RLS:
- SELECT: usuario ve os seus + gestor ve subordinados (via profiles.manager_id) + admin ve todos
- INSERT: usuario so insere com user_id = auth.uid()
- UPDATE: usuario so edita os seus
- DELETE: apenas admin

**Frontend:**
- Hook `useWeeklyPPP.ts` — CRUD com filtro por semana
- Pagina `/weekly` — formulario com 3 campos de texto (Plans, Progress, Problems), seletor de semana, historico
- Componente `WeeklyPPPCard.tsx` — card resumo para dashboard
- Link na sidebar: "PPP Semanal" com icone ClipboardList

### 1.2 Pulse Survey

**Banco de dados** — Nova tabela `pulse_surveys`:

```text
pulse_surveys
- id: uuid PK
- user_id: uuid FK profiles(id) NOT NULL
- week_start: date NOT NULL
- score: integer NOT NULL (1-5)
- comment: text nullable
- created_at: timestamptz DEFAULT now()
- UNIQUE(user_id, week_start)
```

RLS:
- SELECT: usuario ve os seus + gestor ve subordinados + admin ve todos
- INSERT: user_id = auth.uid()
- UPDATE/DELETE: apenas admin

**Frontend:**
- Hook `usePulseSurvey.ts`
- Pagina `/pulse` — votacao rapida (1-5 estrelas) + grafico de tendencia (Recharts)
- Widget `PulseWidget.tsx` no dashboard — votacao inline da semana + media da equipe
- Link na sidebar: "Pulse" com icone Heart

---

## Sprint 2 — Kudos + Notificacoes

### 2.1 Kudos / Reconhecimento

**Banco de dados** — Nova tabela `kudos`:

```text
kudos
- id: uuid PK
- from_user_id: uuid FK profiles(id) NOT NULL
- to_user_id: uuid FK profiles(id) NOT NULL
- message: text NOT NULL
- category: text DEFAULT 'general' (general, teamwork, innovation, results)
- objective_id: uuid FK objectives(id) nullable
- created_at: timestamptz DEFAULT now()
```

RLS:
- SELECT: todos autenticados podem ver (feed publico)
- INSERT: from_user_id = auth.uid()
- DELETE: admin ou from_user_id = auth.uid()

**Frontend:**
- Hook `useKudos.ts`
- Componente `KudosFeed.tsx` — feed publico no dashboard com avatares e animacao
- Dialog `SendKudosDialog.tsx` — selecionar destinatario, categoria, mensagem opcional, vincular a OKR
- Pagina `/kudos` — historico completo com filtros
- Botao "Dar Parabens" no header do dashboard

### 2.2 Sistema de Notificacoes / Lembretes

**Banco de dados** — Nova tabela `notifications`:

```text
notifications
- id: uuid PK
- user_id: uuid FK profiles(id) NOT NULL
- type: text NOT NULL (checkin_reminder, ppp_reminder, pulse_reminder, kudos_received, cycle_update)
- title: text NOT NULL
- body: text nullable
- entity_type: text nullable
- entity_id: uuid nullable
- read: boolean DEFAULT false
- created_at: timestamptz DEFAULT now()
```

RLS:
- SELECT: user_id = auth.uid()
- UPDATE: user_id = auth.uid() (marcar como lida)
- INSERT: via trigger/edge function (service role)
- DELETE: user_id = auth.uid() ou admin

**Frontend:**
- Hook `useNotifications.ts` — com realtime subscription
- Componente `NotificationBell.tsx` — icone Bell no header com badge de contagem
- Dropdown com lista de notificacoes e "marcar todas como lidas"
- Habilitar realtime na tabela notifications

**Edge Function `send-reminders`:**
- Cron semanal (segunda-feira) que verifica quem nao fez check-in/PPP/pulse na semana anterior
- Insere notificacoes na tabela para cada usuario pendente

---

## Sprint 3 — Leader Dashboard + Newsfeed Aprimorado

### 3.1 Dashboard de Lider

**Frontend (sem novas tabelas — usa dados existentes):**
- Pagina `/leader` — acessivel para roles manager, okr_master e admin
- Componentes:
  - `TeamProgressTable.tsx` — tabela com todos subordinados diretos, progresso medio, ultimo check-in, status PPP
  - `TeamPulseChart.tsx` — grafico de tendencia do pulse da equipe
  - `CheckinComplianceCard.tsx` — porcentagem de subordinados que fizeram check-in esta semana
  - `TeamPPPSummary.tsx` — resumo consolidado dos PPPs da equipe
- Filtros por ciclo e periodo
- Link na sidebar: "Minha Equipe" com icone UsersRound (visivel apenas para manager/admin)

### 3.2 Newsfeed Social Aprimorado

**Melhorias no ActivityFeed existente:**
- Integrar kudos no feed (kudos aparecem como cards especiais com destaque visual)
- Adicionar reacoes rapidas (like/aplaudir) nos itens do feed
- Nova tabela `feed_reactions`:

```text
feed_reactions
- id: uuid PK
- user_id: uuid FK profiles(id) NOT NULL
- entity_type: text NOT NULL (audit_log, kudos)
- entity_id: uuid NOT NULL
- reaction: text NOT NULL (like, clap, fire)
- created_at: timestamptz DEFAULT now()
- UNIQUE(user_id, entity_type, entity_id, reaction)
```

---

## Sprint 4 — Relatorios + Integracao Slack

### 4.1 Relatorios Exportaveis

**Edge Function `generate-report`:**
- Aceita parametros: cycle_id, team_id (opcional), format (pdf/csv)
- Gera CSV com resumo de progresso por objetivo, KR, responsavel
- Para PDF: gera HTML formatado e converte via Lovable AI ou retorna HTML para impressao do navegador

**Frontend:**
- Componente `ExportReportDialog.tsx` — selecionar ciclo, equipe, formato
- Botao "Exportar Relatorio" nas paginas de ciclo e leader dashboard
- Opcao de "Imprimir" que abre versao formatada para print

### 4.2 Integracao com Slack

**Prerequisitos:** Configuracao do Slack connector

**Edge Function `slack-notify`:**
- Envia notificacoes para canal Slack configurado
- Eventos: novo check-in, KR concluido, kudos recebido, ciclo ativado
- Webhook configuravel por projeto

**Frontend:**
- Pagina `/settings/integrations` — configurar webhook URL do Slack
- Toggle por tipo de notificacao

---

## Alteracoes na Navegacao

Sidebar atualizada:

```text
Principal
  - Dashboard (Home)
  - Ciclos (CalendarDays)
  - Alinhamento (GitBranch)

Engajamento
  - PPP Semanal (ClipboardList)
  - Pulse Survey (Heart)
  - Kudos (Award)

Gestao
  - Minha Equipe (UsersRound) — visivel para manager/admin
  - Relatorios (FileBarChart) — visivel para manager/admin

Configuracoes (footer dropdown - mantido)
  - Meu Perfil
  - 2FA
  - Integracoes (novo)
  - Admin (se admin)
```

---

## Rotas Novas no App.tsx

```text
/weekly          — PPP Semanal
/pulse           — Pulse Survey
/kudos           — Feed de Kudos
/leader          — Dashboard do Lider
/settings/integrations — Integracoes (Slack)
```

---

## Resumo de Tabelas Novas

| Tabela | Sprint | Realtime |
|---|---|---|
| weekly_ppp | 1 | Nao |
| pulse_surveys | 1 | Nao |
| kudos | 2 | Sim |
| notifications | 2 | Sim |
| feed_reactions | 3 | Nao |

## Resumo de Edge Functions

| Funcao | Sprint | Tipo |
|---|---|---|
| send-reminders | 2 | Cron semanal |
| generate-report | 4 | On-demand |
| slack-notify | 4 | Webhook |

## Ordem de Implementacao Sugerida

1. Migracoes de banco (todas as 5 tabelas de uma vez)
2. Sprint 1: PPP + Pulse (hooks, paginas, sidebar)
3. Sprint 2: Kudos + Notificacoes (hooks, paginas, bell, edge function)
4. Sprint 3: Leader Dashboard + Feed aprimorado
5. Sprint 4: Relatorios + Slack

Cada sprint sera implementado em mensagens separadas para manter o controle de qualidade.

