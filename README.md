# Násobilka

Procvičování malé násobilky (násobení a dělení). Statická SPA – React 19, Vite 7, Tailwind CSS v4.
Podrobná dokumentace: [nasobilka-dokumentace.md](nasobilka-dokumentace.md).

## Vývoj

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # výstup do dist/
```

## Nasazení přes Coolify

1. Nahrajte projekt do Git repozitáře (GitHub/GitLab/Gitea).
2. V Coolify: **New Resource → Public/Private Repository**, vyberte repo a větev.
3. **Build Pack: Dockerfile** (soubor `Dockerfile` v kořeni).
4. **Ports Exposes: 80**.
5. Nastavte doménu a klikněte na **Deploy**.

Docker image se sestaví ve dvou krocích (Node → build, nginx → servírování `dist/`),
výsledný kontejner je malý nginx bez Node.js.
