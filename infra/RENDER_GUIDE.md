# Render Free Tier Deployment Guide

## Step 1: Create Render Account

Go to https://render.com and sign up (free).

## Step 2: Connect GitHub

1. Click **"New +"** → **"Blueprint"**
2. Connect your GitHub account
3. Select the `hsbc` repository
4. Render will detect `render.yaml` automatically

## Step 3: Set Environment Variables

After the blueprint is created, go to each service → **Environment** tab and set:

### Frontend (hireright-frontend)
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `NEXT_PUBLIC_APP_URL` | `https://hireright-frontend.onrender.com` |
| `OPENAI_API_KEY` | Your OpenAI key |
| `REDIS_URL` | Your Upstash Redis URL |
| `SMTP_USER` | Your Gmail |
| `SMTP_PASS` | Your Gmail app password |
| `UPSTASH_REDIS_REST_URL` | Your Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash REST token |

### Backend (hireright-backend)
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Same Neon connection string |
| `OPENAI_API_KEY` | Same OpenAI key |
| `CORS_ALLOWED_ORIGINS` | `https://hireright-frontend.onrender.com` |

### Agent, Evaluator, ML
| Variable | Value |
|----------|-------|
| `OPENAI_API_KEY` | Same OpenAI key |

## Step 4: Deploy

Click **"Manual Deploy"** → **"Deploy latest commit"** on each service.

## Step 5: Update Frontend API URLs

After deployment, update `NEXT_PUBLIC_APP_URL` in the frontend service to point to the actual Render URL.

## Free Tier Limitations

- Services **spin down after 15 minutes** of no traffic
- First request after idle takes ~30 seconds to wake up
- 750 hours/month per service (enough for all 5)
- 512MB RAM per service
- No custom domains on free tier

## Cost: $0/month

All 5 services run on Render's free tier.
