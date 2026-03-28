## Plano: Redesign das telas de Login e Signup

A tela atual usa "OKR Platform" como titulo e tem um design basico. Vamos transformar em algo profissional com a marca **Veri** (by VektorFlow).

### Mudancas

**1. `src/pages/Login.tsx**` — Redesign completo

- Layout split-screen: lado esquerdo com branding (gradient hero, logo "Veri", tagline, decorative elements), lado direito com o formulario
- Em mobile, so mostra o formulario com branding compacto no topo
- Trocar "OKR Platform" por "Vektor Flow" 
- Adicionar tagline tipo "Alinhe objetivos. Acelere resultados."
- Usar o Button component (variant cta) em vez do btn-cta raw
- Melhorar espacamento e hierarquia visual

**2. `src/pages/Signup.tsx**` — Mesmo redesign

- Manter consistencia visual com a tela de login
- Mesmo layout split-screen
- Trocar "OKR Platform" por "Vektor Flow"

**3. `src/pages/ForgotPassword.tsx**` — Atualizar branding

- Trocar "OKR Platform" por "Vektor Flow" e manter consistencia

### Design visual

- Lado esquerdo: fundo com gradient-hero (verde escuro), nome "Vektor Flow" grande em branco/dourado, tagline, icones decorativos ou formas geometricas em CSS
- Lado direito: fundo claro, card com formulario limpo
- Mobile: formulario centralizado com logo "Vektor Flow" no topo
- Botoes usando a variante `cta` do Button component

### Tecnico

- Sem dependencias novas
- Usa tokens do design system existente (--gradient-hero, --cta, --primary)
- Responsivo com Tailwind (lg:grid-cols-2)