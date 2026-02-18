
# Plano: Aplicar DataStory em Todos os Graficos do Software

## Resumo

Refatorar todas as visualizacoes de dados existentes e criar as novas do Dashboard OKR Consolidado seguindo os principios do livro "Storytelling com Dados" de Cole Nussbaumer Knaflic, conforme a skill DataStory fornecida.

---

## Diagnostico Atual vs. DataStory

Existem 4 areas com visualizacoes no software:

| Local | Tipo Atual | Problemas segundo DataStory |
|-------|-----------|---------------------------|
| **Dashboard principal** | 4 stat cards (numeros) | OK para 1-2 numeros, mas falta contexto narrativo e destaque estrategico |
| **Leader Dashboard** | 4 stat cards + tabela | Tabela sem mapa de calor, sem destaque visual nos pontos criticos |
| **CheckinChart** | Grafico de linhas (Recharts) | Gridlines visiveis demais, legenda separada, falta rotulo direto nos pontos |
| **AlignmentView** | Apenas arvore, sem metricas | Sem cards resumo, sem grafico de distribuicao |

---

## Principios DataStory que serao aplicados

1. **Eliminacao de saturacao**: remover gridlines desnecessarias, bordas, elementos decorativos
2. **Cor estrategica**: cinza como base, cor forte APENAS no dado que importa (tecnica cinza + destaque)
3. **Legendas proximas aos dados**: rotular diretamente nos pontos/barras, nunca em caixa separada
4. **Nunca pizza/donut/3D/radar**: usar barras horizontais para comparacao de categorias
5. **Texto grande para 1-2 numeros**: stat cards com numero em destaque e contexto narrativo
6. **Tabelas com mapa de calor**: aplicar cor de fundo proporcional ao valor em colunas numericas
7. **Maximo 4 grupos por visual**: respeitar limite da memoria de curto prazo
8. **Espaco em branco como respiro**: nao preencher tudo, deixar margem generosa

---

## Mudancas por Arquivo

### 1. `src/components/okr/CheckinChart.tsx` — Grafico de Linhas de Check-ins

**Antes:** Gridlines visiveis, legenda "Meta" e "Inicio" como labels de ReferenceLine, sem rotulo direto nos pontos.

**Depois (DataStory):**
- Remover `CartesianGrid` completamente (se remover, a mensagem nao muda)
- Remover eixo Y (valores serao rotulados diretamente nos pontos com `<LabelList>`)
- Manter eixo X apenas com datas, fonte leve em cinza
- ReferenceLine da Meta: manter tracejada em cor primary mas com label mais proximo
- Linha principal: unica cor forte (primary), resto cinza
- Tooltip mais limpo: sem borda grossa, sem sombra pesada
- Adicionar rotulo do valor DIRETAMENTE no ultimo ponto da linha (destaque pre-atentivo)

### 2. `src/pages/Dashboard.tsx` — Stat Cards do Dashboard Principal

**Antes:** 4 cards com cor de fundo identica, sem hierarquia visual.

**Depois (DataStory):**
- Aplicar tecnica de destaque: o card MAIS IMPORTANTE (ex: Progresso Medio) recebe cor forte, os outros ficam neutros/cinza
- Adicionar subtexto contextual em cada card (ex: "vs. ciclo anterior" ou seta de tendencia)
- Numero principal em tamanho grande (ja esta), mas com unidade em tamanho menor e cor muted
- Reduzir para 3 cards se possivel (regra dos 4 grupos) ou manter 4 com hierarquia clara

### 3. `src/pages/leader/LeaderDashboard.tsx` — Tabela da Equipe

**Antes:** Tabela simples sem destaque visual nos valores criticos.

**Depois (DataStory):**
- Aplicar **mapa de calor** na coluna "Progresso": fundo com intensidade proporcional ao valor (verde claro a verde escuro)
- Coluna "Pulse": cor de fundo condicional (vermelho se baixo, verde se alto)
- Bordas da tabela leves/invisiveis (remover bordas grossas)
- Linha do membro com pior performance destacada sutilmente (fundo levemente rosado)
- Check-in e PPP: manter icones mas com cor estrategica (verde = ok, cinza = pendente, nao vermelho pois gera alarme desnecessario)

### 4. `src/pages/alignment/AlignmentView.tsx` — Dashboard OKR Consolidado (NOVO)

**Novo conteudo seguindo DataStory:**

**Cards de resumo (topo):**
- 4 metricas: Total OKRs, Concluidos (%), Em Risco (%), Progresso Medio
- Tecnica de destaque: "Em Risco" com cor de alerta (unico card colorido), outros em cinza/neutro
- Numero grande + label pequeno + delta vs periodo anterior (se disponivel)

**Grafico de distribuicao de status:**
- **Barras horizontais** (NAO pizza/donut — regra DataStory)
- 4 barras: No caminho, Em risco, Atrasado, Concluido
- Cor estrategica: "Em risco" e "Atrasado" em cor forte, "No caminho" e "Concluido" em cinza/neutro
- Valores rotulados diretamente nas barras (sem eixo Y)
- Sem gridlines

**Filtro por responsavel:**
- Novo Select com lista de owners (usando `useProfiles`)
- Integrado ao `filterTree` existente

### 5. `src/components/okr/ProgressBar.tsx` — Barra de Progresso

**Antes:** Cores por status (verde, amarelo, vermelho, azul).

**Depois (DataStory):**
- Manter cores por status (faz sentido semantico)
- Adicionar marcador visual no ponto atual (pequeno circulo ou linha vertical) para dar referencia
- Label do percentual em negrito quando >= 70% (destaque pre-atentivo de intensidade)

### 6. Novo: `src/components/charts/DataStoryBarChart.tsx` — Componente Reutilizavel

Componente de barras horizontais seguindo todos os principios DataStory:
- Sem gridlines
- Sem bordas
- Labels direto nas barras
- Cor neutra como base, com prop para destacar barras especificas
- Espaco em branco generoso
- Sera usado no AlignmentView e em qualquer dashboard futuro

---

## Detalhes Tecnicos

### Paleta de Cores DataStory

```text
Neutro/base:    hsl(var(--muted-foreground) / 0.3)  — cinza claro para dados "nao destacados"
Destaque:       hsl(var(--primary))                  — azul/primary para o dado principal
Alerta:         hsl(var(--destructive))               — vermelho para "em risco" / "atrasado"
Sucesso:        hsl(var(--success))                   — verde para "concluido" / "no caminho"
Texto muted:    hsl(var(--muted-foreground))          — labels secundarios
```

### Arquivos a criar
- `src/components/charts/DataStoryBarChart.tsx` — barras horizontais reutilizaveis

### Arquivos a modificar
- `src/components/okr/CheckinChart.tsx` — remover saturacao, rotulos diretos
- `src/pages/Dashboard.tsx` — hierarquia visual nos stat cards
- `src/pages/leader/LeaderDashboard.tsx` — mapa de calor na tabela
- `src/pages/alignment/AlignmentView.tsx` — cards resumo + grafico de barras + filtro owner
- `src/components/okr/ProgressBar.tsx` — refinamento visual

### Ordem de implementacao

1. Criar `DataStoryBarChart.tsx` (componente base reutilizavel)
2. Refatorar `CheckinChart.tsx` (eliminacao de saturacao)
3. Refatorar stat cards do `Dashboard.tsx` (hierarquia de destaque)
4. Refatorar tabela do `LeaderDashboard.tsx` (mapa de calor)
5. Implementar dashboard consolidado no `AlignmentView.tsx` (cards + barras + filtro)
6. Refinamento do `ProgressBar.tsx`
