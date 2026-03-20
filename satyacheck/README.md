# SatyaCheck — Automated Vernacular Fact Checker

AI-powered fact-checking pipeline for Indian vernacular news and social media posts.
Supports Hindi, Bengali, Tamil, Telugu, and English.

## Deploy to Vercel (5 minutes, free)

### 1. Upload to GitHub
- Create a new **public** repo on [github.com](https://github.com)
- Upload all files keeping this folder structure:
  ```
  satyacheck/
  ├── api/
  │   └── check.js        ← serverless backend (hides your API key)
  ├── public/
  │   └── index.html      ← frontend
  ├── vercel.json
  └── README.md
  ```

### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub (free)
2. Click **Add New Project** → Import your GitHub repo
3. Click **Deploy** (no build settings needed)

### 3. Add your API key (secret — never exposed)
1. In Vercel dashboard → your project → **Settings → Environment Variables**
2. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-your-key-here`
3. Click **Save** → then **Redeploy**

Your app is now live at `https://your-project.vercel.app` 🎉

## How it works
- Frontend calls `/api/check` — your own Vercel serverless function
- The serverless function adds your API key and calls Anthropic
- **Your key is never in the frontend code** — zero exposure risk
