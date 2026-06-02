# Rush Tiles

A fast, mobile-friendly Python-backed web game built for desktop, laptop, and phone.

## How it works

- Frontend: `index.html`, `style.css`, `game.js`
- Backend: `api/new_round.py` generates randomized rounds and challenge data in Python
- Deployment: configured for Vercel with `vercel.json`

## Play

1. Open `index.html` in a browser for local testing.
2. Tap or click only the target tiles before time runs out.
3. Each round gets more challenging and keeps the gameplay fresh.

## Deploy to Vercel

1. Install Vercel CLI if you want local deployment tools:

   ```bash
   npm install -g vercel
   ```

2. From the project folder run:

   ```bash
   vercel
   ```

3. Follow the prompts to deploy the site.

The Python function is automatically detected under `api/new_round.py`.

## Notes

- No extra Python packages are required.
- The game stores the high score locally in your browser.
- The experience is responsive for desktop and mobile screens.
