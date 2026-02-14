
# Plano: Dashboard Pessoal, Feed de Atividades e Check-in Aprimorado (estilo CoBlue)

## Resumo

Vamos transformar o Dashboard atual em uma experiencia inspirada no CoBlue, com tres grandes blocos: (1) Dashboard pessoal com "Meus Resultados-Chave" e "Minha Equipe", (2) Feed de atividades recentes com opcao de comentar, e (3) Check-in aprimorado com indicador de sentimento e campos de comentarios/dificuldades.

---

## 1. Banco de Dados - Novas tabelas e colunas

### 1.1 Coluna `confidence` na tabela `kr_checkins`
Adicionar um campo de sentimento/confianca ao check-in (valores: `confident`, `neutral`, `concerned`).

### 1.2 Coluna `difficulties` na tabela `kr_checkins`
Campo de texto para registrar dificuldades encontradas, separado do campo `note` (que sera usado como "Comentarios gerais").

### 1.3 Tabela `activity_comments`
Nova tabela para permitir comentarios no feed de atividades (vinculada ao `audit_logs`):

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador |
| audit_log_id | uuid (FK) | Referencia ao audit_log |
| author_id | uuid | Quem comentou |
| content | text | Texto do comentario |
| created_at | timestamptz | Data de criacao |

RLS: autenticados podem ver todos; autenticados podem inserir (author_id = auth.uid()); admin pode deletar.

---

## 2. Dashboard Pessoal (reformulacao de `Dashboard.tsx`)

Layout em duas colunas, inspirado no CoBlue:

### Coluna Esquerda (2/3)

**Secao "Meus Resultados-Chave"**
- Lista os KRs onde o usuario logado e o `owner_id`
- Cada linha mostra: avatar do dono, titulo do KR, barra de progresso, botao de check-in rapido
- Dados vindos de um novo hook `useMyKeyResults` que filtra por `owner_id = user.id`

**Secao "Minha Equipe"**
- Mostra membros da equipe (usuarios que compartilham objetivos ou sao colaboradores nos mesmos ciclos)
- Cada card mostra: avatar/iniciais, nome, progresso medio, contagem de check-ins em dia vs pendentes
- Dados vindos de um novo hook `useMyTeam`

### Coluna Direita (1/3)

**Secao "Check-in" (cabecalho)**
- Data atual e periodo/ciclo ativo

**Secao "Minhas Atualizacoes" (Feed de Atividades)**
- Busca `audit_logs` filtrados pelo `actor_id = user.id`
- Cada item mostra: avatar, "Fulano editou/criou/deletou [entidade] **Titulo**", tempo relativo
- Link clicavel para o objetivo/KR
- Botao "Comentar (N)" em cada item
- Componente inline para adicionar comentarios

---

## 3. Check-in Aprimorado

Modificar o componente `CheckinTimeline.tsx` (formulario de check-in):

### Campos do formulario:
- **Valor atual** (ja existe) com unidade ao lado
- **Como estou me sentindo?** - 3 icones clicaveis (confiante/neutro/preocupado) mapeados para `confident`, `neutral`, `concerned`
- **Comentarios gerais** (campo `note` existente) 
- **Dificuldades encontradas** (novo campo `difficulties`)
- Exibir "Ultimo valor de check-in" e "Valor da meta" como referencia no topo

### Timeline atualizada:
- Exibir o indicador de sentimento ao lado de cada check-in historico
- Mostrar dificuldades quando preenchidas

---

## 4. Arquivos a criar/modificar

### Novos arquivos:
- `src/hooks/useMyKeyResults.ts` - busca KRs do usuario logado
- `src/hooks/useMyTeam.ts` - busca membros da equipe do usuario
- `src/hooks/useActivityFeed.ts` - busca audit_logs do usuario com profiles
- `src/hooks/useActivityComments.ts` - CRUD de comentarios no feed
- `src/components/dashboard/MyKeyResults.tsx` - secao "Meus Resultados-Chave"
- `src/components/dashboard/MyTeam.tsx` - secao "Minha Equipe"
- `src/components/dashboard/ActivityFeed.tsx` - feed de atividades com comentarios

### Arquivos modificados:
- `src/pages/Dashboard.tsx` - layout completo reformulado
- `src/components/okr/CheckinTimeline.tsx` - formulario aprimorado com sentimento e dificuldades
- `src/components/okr/KeyResultCard.tsx` - exibir sentimento nos check-ins

---

## 5. Sequencia de Implementacao

1. Migracao do banco (colunas em `kr_checkins` + tabela `activity_comments`)
2. Hooks novos (`useMyKeyResults`, `useMyTeam`, `useActivityFeed`, `useActivityComments`)
3. Componentes do dashboard (`MyKeyResults`, `MyTeam`, `ActivityFeed`)
4. Reformular `Dashboard.tsx` com novo layout
5. Aprimorar `CheckinTimeline.tsx` com sentimento e dificuldades
6. Atualizar timeline e cards para exibir os novos campos

---

## Detalhes Tecnicos

### Migracao SQL
```sql
-- Novos campos em kr_checkins
ALTER TABLE kr_checkins ADD COLUMN confidence text DEFAULT 'neutral';
ALTER TABLE kr_checkins ADD COLUMN difficulties text;

-- Tabela de comentarios no feed
CREATE TABLE activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid NOT NULL REFERENCES audit_logs(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
-- Policies...
```

### Hook useMyKeyResults
Consulta `key_results` onde `owner_id = auth.uid()`, juntando com `objectives(title, cycle_id)` para contexto.

### Hook useMyTeam
Busca perfis de usuarios que sao donos de objetivos nos mesmos ciclos ativos que o usuario logado, com contagem de check-ins.

### Feed de Atividades
Usa `audit_logs` filtrado por `actor_id = user.id`, com join em `profiles` para nome/avatar, limitado aos ultimos 20 registros. Os titulos das entidades sao extraidos de `after_state` (jsonb) do audit log.
