

## Diagnóstico

O site publicado mostra tela branca porque o `createClient()` do Supabase recebe `undefined` para URL e chave, causando um crash imediato. O preview funciona porque o servidor de desenvolvimento injeta as variáveis do `.env` corretamente, mas o build publicado pode ter sido gerado antes das variáveis estarem configuradas.

O arquivo `client.ts` é auto-gerado e não pode ser editado. Porém, o app não tem nenhuma proteção contra falha na inicialização do Supabase.

## Plano

### 1. Adicionar guard de inicialização no `App.tsx`

Adicionar uma verificação no início do App que detecta se as variáveis de ambiente estão ausentes e mostra uma mensagem de erro amigável em vez de uma tela branca. Isso previne o crash silencioso.

```tsx
// No início do App, antes do render
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  return (
    <div>Erro de configuração: variáveis de ambiente não encontradas. Tente republicar o site.</div>
  );
}
```

### 2. Forçar re-deploy

A mudança no código vai habilitar o botão "Update" no painel de publicação, forçando um novo build que incluirá as variáveis de ambiente corretamente.

### Detalhes técnicos

- **Arquivo alterado**: `src/App.tsx` — adicionar early return com mensagem de erro se env vars estiverem undefined
- **Efeito colateral**: nenhum impacto no funcionamento normal; a guard só ativa se as variáveis estiverem ausentes
- Após a implementação, o usuário precisará clicar em **Publish → Update** para gerar um novo build

