

## Phase 4: Dashboard Analitico com Metricas OKR

O Dashboard atual exibe apenas uma mensagem de boas-vindas e os papeis do usuario. Esta fase transforma a pagina inicial em um painel analitico com dados reais dos ciclos, objetivos e Key Results.

---

### O que sera construido

1. **Cards de metricas (stat cards)** no topo do dashboard:
   - Total de ciclos ativos
   - Total de objetivos (nos ciclos ativos)
   - Progresso medio geral (dos objetivos ativos)
   - Key Results concluidos vs total

2. **Grafico de progresso por objetivo** usando Recharts (ja instalado):
   - Grafico de barras horizontais mostrando cada objetivo do ciclo ativo com seu percentual de progresso
   - Cores baseadas no status (verde/amarelo/vermelho/azul)

3. **Lista resumida dos ciclos ativos** com progresso agregado:
   - Nome do ciclo, periodo, barra de progresso media, contagem de objetivos

4. **Acoes rapidas**: botoes para ir direto a Ciclos ou criar novo objetivo

---

### Detalhes Tecnicos

**Novo hook:**
- `src/hooks/useDashboardStats.ts` -- Query unica que busca ciclos ativos com objetivos e key results aninhados para calcular todas as metricas no frontend. Usa queryKey `["dashboard-stats"]`.

**Arquivo modificado:**
- `src/pages/Dashboard.tsx` -- Substitui o conteudo atual pelo dashboard analitico completo:
  - 4 stat cards usando as classes `.stat-card-*` do design system
  - Grafico de barras com Recharts (`BarChart`)
  - Lista de ciclos ativos com `ProgressBar` reutilizado
  - Botoes de acao rapida com `.btn-cta`

**Nenhuma mudanca de banco de dados necessaria** -- todos os dados ja existem nas tabelas `cycles`, `objectives` e `key_results`.

**Nenhuma dependencia nova** -- Recharts ja esta instalado.

**Arquivos:**
- Criado (1): `src/hooks/useDashboardStats.ts`
- Modificado (1): `src/pages/Dashboard.tsx`

