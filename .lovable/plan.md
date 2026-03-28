

## Atualização inline do progresso nas Iniciativas

Em vez de abrir o modal de edição para atualizar o valor atual, o progresso será editável **diretamente na tabela**.

### Como vai funcionar

**Para valores numéricos (R$, %, un, horas):**
- A célula de "Progresso" na tabela passa a ser clicável (quando não expirado e o usuário tem permissão)
- Ao clicar, aparece um **Popover** com:
  - Input numérico preenchido com o valor atual
  - Label mostrando a unidade e o alvo (ex: "de R$ 100.000,00")
  - Botão "Salvar" que faz update direto via `updateInitiative`
- Fora do popover, continua mostrando a barra de progresso + valor formatado

**Para booleano (Sim/Não):**
- Em vez de mostrar apenas o ícone estático, exibe um **Switch/toggle** clicável diretamente na célula
- Um clique já salva automaticamente (toggle entre 0 e 1)

**Regras:**
- Desabilitado se o prazo expirou
- Desabilitado se o usuário não é admin, okr_master, nem o dono da iniciativa

### Arquivo modificado
- `src/pages/initiatives/InitiativesList.tsx` — substituir a célula de progresso estática por componentes inline editáveis (Popover + input para numéricos, Switch para booleano)

