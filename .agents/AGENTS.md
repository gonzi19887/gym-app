# Gym App Workspace Rules

## Context of the Integration Session
- **GitHub SSH & Branches**: SSH keys are configured for pushing/pulling branches `test` and `dev`. Both branches are kept 100% identical and synchronized.
- **Database (Supabase)**: The exercises catalog has 1279 exercises synced with Supabase at URL `https://qitboisspvnfbazvndnq.supabase.co` using the Service Role Key.
- **Vercel Envs**: The variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured globally in Vercel settings for `production`, `preview`, and `development` targets to prevent client-side configuration errors.
- **Session Notes**: Detailed credentials, tokens, and logic are documented in the Obsidian vault note `Gym App Integration Session.md` (synced via Obsidian Sync).
- **Installed Skills**: supabase, supabase-postgres-best-practices, find-skills, vercel-react-best-practices, vercel-cli, vercel-cli-with-tokens, agent-browser, obsidian-vault, obsidian-markdown, obsidian-cli, obsidian-second-brain. All of these are available under the `.agents/skills/` directory.

## Directives
- When the user asks you to read or update their Second Brain (Obsidian Vault), look for the file `Gym App Integration Session.md` inside their Obsidian vault or query it using the installed `obsidian-second-brain` and `obsidian-vault` skills.
