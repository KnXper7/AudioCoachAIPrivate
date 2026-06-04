# AuraCheck backend — Google Gemini proxy (Cloudflare Worker)

This tiny Worker holds your Gemini API key and turns a photo into AuraCheck's
scoring JSON. The app calls THIS, never Gemini directly (so your key stays secret).

## One-time setup

1. **Get a free Gemini API key**
   - Go to https://aistudio.google.com/apikey → "Create API key" → copy it.

2. **Install Wrangler (Cloudflare's CLI) and log in**
   ```bash
   npm install -g wrangler
   wrangler login          # opens a browser to authorize (free Cloudflare account)
   ```

3. **Deploy from this folder**
   ```bash
   cd backend
   wrangler secret put GEMINI_API_KEY     # paste your key when prompted
   wrangler deploy
   ```
   Wrangler prints a URL like:
   `https://auracheck-worker.YOURNAME.workers.dev`

4. **Point the app at it**
   - Open `src/config.js`
   - Set `API_URL` to that URL
   - Set `USE_REAL_AI = true`
   - Rebuild:  `eas build --profile preview --platform android`

That's it — the app now sends photos to your Worker, which calls Gemini and
returns real scores, suggestions, and the visibility flag.

## Test the Worker without the app
```bash
curl -X POST https://auracheck-worker.YOURNAME.workers.dev/analyze \
  -H "Content-Type: application/json" \
  -d '{"mode":"face","image":null}'
```
You should get JSON back (with image:null it may say not visible — that's expected).

## Cost
Gemini 1.5 Flash has a generous free tier; Cloudflare Workers' free plan covers
100k requests/day. Fine for testing and early users.

## Switching models
In `auracheck-worker.js`, change `GEMINI_MODEL` to `gemini-1.5-pro` for higher
quality (slower, pricier) or keep `gemini-1.5-flash` for speed.
