

# Plano: Tela de Cadastro e Gestao de Usuarios (Revisado)

## Contexto

Implementar a tela de gestao de usuarios conforme as imagens de referencia, com os campos ajustados conforme solicitado pelo usuario.

---

## Campos finais do formulario

### Dados pessoais
- Nome completo (ja existe)
- CPF
- Email (ja existe, readonly)
- Data de nascimento
- Idioma (Select: pt-BR, en, es)

### Dados organizacionais
- Funcao (job_title)
- Vice-Presidencia (department)
- Gerencia (management)
- Gestor (manager_id - Select com lista de profiles)
- Status (Select: Ativo/Inativo)

### Preferencias
- Receber emails de feedback (receive_feedback_emails)

### Permissoes
- Elegivel para bonificacao (eligible_for_bonus)
- OKR Master (is_okr_master)
- Acesso ao painel de configuracoes (config_panel_access)

---

## O que sera feito

### 1. Migracao de banco de dados

Adicionar colunas a tabela `profiles`:

| Campo | Tipo | Default |
|---|---|---|
| cpf | text | null |
| birth_date | date | null |
| language | text | 'pt-BR' |
| job_title | text | null |
| department | text | null |
| management | text | null |
| manager_id | uuid (FK profiles) | null |
| status | text | 'active' |
| receive_feedback_emails | boolean | true |
| eligible_for_bonus | boolean | false |
| config_panel_access | boolean | false |

Nota: o campo `is_okr_master` nao sera adicionado como coluna pois ja existe o role `okr_master` na tabela `user_roles`. O toggle na UI ira adicionar/remover esse role.

### 2. Criar pagina UserDetail (`src/pages/admin/UserDetail.tsx`)

Layout em duas colunas:

**Coluna esquerda**:
- Avatar grande com botao "Mudar imagem" (reutilizando logica do Profile.tsx e bucket avatars)
- Nome do usuario
- Card "Preferencias" com Switch para email de feedback

**Coluna direita**:
- Card "Dados pessoais": Nome, CPF, Email (readonly), Data de nascimento, Idioma
- Card "Dados organizacionais": Funcao, Vice-Presidencia, Gerencia, Gestor (Select), Status (Select)
- Card "Permissoes": Toggles para Elegivel para bonificacao, OKR Master, Acesso ao painel de configuracoes

Botao "Salvar" com `variant="cta"` no rodape.

### 3. Criar hook useUserDetail (`src/hooks/useUserDetail.ts`)

- Query para buscar perfil completo por ID (incluindo novos campos)
- Mutation para atualizar perfil
- Mutation para upload de avatar
- Logica para adicionar/remover role `okr_master` via tabela `user_roles`

### 4. Atualizar UsersRoles.tsx

- Adicionar coluna "Status" na tabela
- Tornar linhas clicaveis, navegando para `/admin/users/:id`
- Adicionar campo de busca por nome/email

### 5. Atualizar rotas (App.tsx)

- Adicionar rota `/admin/users/:id` apontando para `UserDetail`

---

## Detalhes Tecnicos

### SQL da migracao

```text
ALTER TABLE profiles ADD COLUMN cpf text;
ALTER TABLE profiles ADD COLUMN birth_date date;
ALTER TABLE profiles ADD COLUMN language text DEFAULT 'pt-BR';
ALTER TABLE profiles ADD COLUMN job_title text;
ALTER TABLE profiles ADD COLUMN department text;
ALTER TABLE profiles ADD COLUMN management text;
ALTER TABLE profiles ADD COLUMN manager_id uuid REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN status text DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN receive_feedback_emails boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN eligible_for_bonus boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN config_panel_access boolean DEFAULT false;
```

### Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/admin/UserDetail.tsx` | Criar |
| `src/hooks/useUserDetail.ts` | Criar |
| `src/pages/admin/UsersRoles.tsx` | Modificar |
| `src/App.tsx` | Modificar |

### Componentes do design system utilizados

- `Card` com `card-elevated`
- `Button variant="cta"` para salvar
- `Switch` para toggles
- `Select` para Idioma, Status, Gestor
- `Input` para campos de texto
- `Avatar` para foto do usuario
- `Badge` para status na lista

### Seguranca

- Acesso protegido pelo `AdminRoute` existente
- RLS policies de `profiles` ja permitem admins visualizar e editar todos os perfis
- Upload de avatar usa o bucket `avatars` publico ja existente

