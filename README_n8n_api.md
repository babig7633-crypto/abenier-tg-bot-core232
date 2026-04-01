# n8n API Tooling

- This local tooling is only for reading and backing up n8n workflows through the n8n API.
- `.env` stays local only and should not be committed.
- Run `npm install` once so `dotenv` is available.
- Use the test workflow first, then production only when needed.
- `npm run n8n:get:test` reads the test workflow JSON.
- `npm run n8n:get:prod` reads the production workflow JSON.
- `npm run n8n:backup:test` saves a test backup into `backups/`.
- `npm run n8n:backup:prod` saves a production backup into `backups/`.
