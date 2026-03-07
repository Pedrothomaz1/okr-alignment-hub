

# Sliders de Distribuição de Pesos + Validação de Soma

## Resumo
Criar um componente visual de sliders para redistribuir pesos dos KRs inline na ObjectiveDetail, e adicionar validação no KeyResultForm que impede salvar quando a soma dos pesos ultrapassa 100%.

## Mudanças

### 1. Novo componente `WeightDistributor`
- Card na ObjectiveDetail (acima da lista de KRs) que aparece quando há 2+ KRs com pesos customizados
- Um slider (`@radix-ui/react-slider`) por KR, mostrando nome + peso atual
- Barra visual de progresso total (soma) com cor verde se = 100%, amarela/vermelha se diferente
- Botão "Distribuir igualmente" que divide 100% entre todos os KRs
- Ao soltar o slider, chama `updateKeyResult` para persistir o novo peso
- Os sliders operam no range 1-100 com step 1

### 2. Validação no `KeyResultForm`
- Receber prop `existingWeights: number[]` (pesos dos outros KRs do objetivo, excluindo o que está sendo editado)
- No `onSubmit`, calcular `somaOutros + novoPeso` e se > 100, mostrar toast de erro e não submeter
- Exibir texto de ajuda abaixo do campo de peso: "Disponível: X%" baseado na soma dos outros KRs

### 3. Ajustes na `ObjectiveDetail`
- Renderizar `WeightDistributor` quando `keyResults.length >= 2` e `canEdit`
- Passar `existingWeights` para o `KeyResultForm` (create e edit), filtrando o KR sendo editado
- Sempre mostrar a soma dos pesos (remover a condição `hasCustomWeights` que esconde quando todos são 1)

### Arquivos modificados
- `src/components/okr/WeightDistributor.tsx` (novo)
- `src/components/okr/KeyResultForm.tsx` (validação + prop existingWeights)
- `src/pages/objectives/ObjectiveDetail.tsx` (integração do WeightDistributor + passar props)

