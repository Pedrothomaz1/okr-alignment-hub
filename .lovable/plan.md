

## Problem: Blank Login Page

The preview shows `/login` but nothing is visible. The DOM is rendering (24KB), but the page appears blank. 

**Root cause identified**: The `Content-Security-Policy` in `index.html` is too restrictive:
```
script-src 'self'
```
This blocks Vite's HMR inline scripts and potentially the Lovable preview token handling, which can prevent the app from rendering properly in the preview environment.

Additionally, `connect-src` only allows `https://*.supabase.co` — it doesn't include the Lovable preview infrastructure URLs, which may block API calls needed for the preview to function.

## Plan

### 1. Relax CSP in `index.html`
- Remove or loosen the `Content-Security-Policy` meta tag for development. In production, CSP should be set via server headers, not meta tags, for better control.
- Specifically: remove the entire `<meta http-equiv="Content-Security-Policy" ...>` tag. This is the most impactful single change and will unblock the preview immediately.

### 2. Verify the fix
- After removing the CSP meta tag, the login page should render with the card, email/password fields, and sign-in button visible.

---

**Single file change**: `index.html` — remove line 6 (the CSP meta tag).

