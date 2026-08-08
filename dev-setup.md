# Dev Setup — Frontend (Livora)

Opcional: Crear proyecto Next.js en esta carpeta o en otro repo. Estos son pasos recomendados.

1) Crear el proyecto Next.js (recomendado TypeScript)
```bash
# en d:/Livora/frontend
npx create-next-app@latest . --ts
npm install axios @tanstack/react-query ethers socket.io-client @supabase/supabase-js
```

2) Copiar `api-spec.md`, `requirements.md` y `ui-guidelines.md` al repo del frontend.
3) Añadir `.env.local` con variables (ver `api-spec.md` y `.env.example` del backend).
4) Implementar rutas por roles y componentes según `requirements.md`.

Comandos útiles:
```bash
npm run dev
npm run build
npm run start
```

Si quieres que genere un scaffold completo con `pages` de ejemplo, puedo hacerlo aquí mismo y dejarlo listo para `npm install`.
