# readIQ OpenAI proxy

This folder is deployed as a separate Vercel project. It keeps `OPENAI_API_KEY`
server-side and forwards only the OpenAI endpoints readIQ uses.

After deployment, visit `/api/ai` in a browser. A successful health check returns
`ok: true`; `configured: true` confirms that Vercel can read the secret without
ever revealing it.

## Vercel environment variables

Add these in **Project Settings → Environment Variables**:

```text
OPENAI_API_KEY=...
OPENAI_CHAT_MODEL=gpt-5.6
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

The Expo app receives only the deployed URL through `EXPO_PUBLIC_AI_PROXY_URL`.
Never add `OPENAI_API_KEY` to the Expo project or a client-side environment file.
