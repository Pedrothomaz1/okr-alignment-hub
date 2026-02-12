

## Reorganizar Menu Lateral

Unificar as seções "Administração" e "Configurações" em uma única seção "Configurações", mantendo a visibilidade dos itens admin condicionada ao papel do usuário.

### Mudanças

**Arquivo: `src/components/layout/AppSidebar.tsx`**

- Remover o array `adminItems` e o array `settingsItems` separados
- Criar um único array `settingsItems` com os itens de configuração (Meu Perfil, Autenticação 2FA)
- Remover a seção "Administração" do JSX
- Na seção "Configurações", renderizar os itens de settings fixos e, se o usuário for admin, renderizar também os itens administrativos (Usuários e Papéis, Logs de Auditoria, Change Requests) logo abaixo

A estrutura final do menu ficará:

```text
Principal
  - Dashboard
  - Ciclos
  - Alinhamento

Configurações
  - Meu Perfil
  - Autenticação 2FA
  - Usuários & Papéis      (somente admin)
  - Logs de Auditoria       (somente admin)
  - Change Requests         (somente admin)
```

