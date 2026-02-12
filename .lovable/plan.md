

## Phase 7: Grafico de Evolucao nos Key Results

Adicionar um grafico de linha dentro de cada Key Result mostrando como o valor evoluiu ao longo do tempo, baseado nos check-ins registrados. Isso da visibilidade clara da tendencia de progresso.

---

### O que sera construido

1. **Grafico de linha** dentro do `KeyResultCard`, visivel ao expandir o historico:
   - Eixo X: datas dos check-ins
   - Eixo Y: valores registrados
   - Linha de referencia (dashed) no target_value para visualizar a meta
   - Linha de referencia no start_value
   - Tooltip com valor, data e nota ao passar o mouse

2. **Abas "Timeline" e "Grafico"** no conteudo expansivel do KeyResultCard para alternar entre a lista de check-ins e a visualizacao grafica

---

### Detalhes Tecnicos

**Novo arquivo (1):**
- `src/components/okr/CheckinChart.tsx` -- Componente que recebe os check-ins, start_value, target_value e unit, e renderiza um `LineChart` do Recharts com:
  - `Line` para os valores dos check-ins
  - `ReferenceLine` no target_value (meta) e start_value
  - `Tooltip` customizado mostrando valor, data formatada e nota
  - Responsivo com `ResponsiveContainer`
  - Cores alinhadas ao design system (usa CSS variables)

**Arquivo modificado (1):**
- `src/components/okr/KeyResultCard.tsx` -- Adicionar `Tabs` (do Radix/shadcn) dentro do `CollapsibleContent` com duas abas:
  - "Timeline" -> renderiza `CheckinTimeline` (comportamento atual)
  - "Grafico" -> renderiza `CheckinChart` passando os dados do hook `useCheckins`
  - O hook `useCheckins` sera chamado no `KeyResultCard` e os dados repassados para ambos os componentes

**Arquivo modificado (2):**
- `src/hooks/useCheckins.ts` -- Sem mudancas estruturais; os dados retornados ja contem tudo necessario (value, created_at, note). Apenas garantir que a ordenacao por `created_at ASC` esta disponivel para o grafico (atualmente ordena DESC para a timeline; o componente do grafico fara o reverse).

**Nenhuma mudanca de banco de dados.**

**Nenhuma dependencia nova** -- Recharts ja esta instalado.

**Resumo de arquivos:**
- Criado (1): `src/components/okr/CheckinChart.tsx`
- Modificados (1): `src/components/okr/KeyResultCard.tsx`

