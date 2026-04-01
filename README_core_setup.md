# Core Setup

- `/core` contains reusable bot logic and architecture docs.
- `.env` is only for n8n API editing.
- Never commit a real `.env` file.
- Real secrets belong in Railway and n8n credentials.
- `/clients` contains sample client configs only.
- Always test workflow edits with `TEST_WORKFLOW_ID` first.
