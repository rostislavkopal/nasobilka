# Matematika hrou (Násobilka)

Procvičování matematiky pro 3. třídu: násobilka, sčítání a odčítání do 100, přednost operací,
jednotky délky a slovní úlohy. Statická SPA – React 19, Vite 7, Tailwind CSS v4, lucide-react.
Podrobná dokumentace: [nasobilka-dokumentace.md](nasobilka-dokumentace.md).

## Vývoj

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testy generátorů příkladů a stavu testu
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
