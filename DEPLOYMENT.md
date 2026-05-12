# Free Deployment Guide

This guide deploys the project for free using:

- Render for the Node.js web service.
- Supabase for PostgreSQL.
- Upstash for Redis.

The frontend is served by the same Express app, so you only need one Render service.

## 1. Push The Project To GitHub

After finishing your local changes:

```bash
git add .
git commit -m "Prepare project for deployment"
git push
```

## 2. Create The PostgreSQL Database On Supabase

Open:

```text
https://supabase.com
```

Steps:

1. Sign in or create an account.
2. Click `New project`.
3. Choose an organization.
4. Enter a project name, for example `accounting-engine`.
5. Set a strong database password and save it somewhere safe.
6. Choose the nearest region.
7. Create the project.
8. Go to `Project Settings`.
9. Open `Database`.
10. Copy the connection string.

Use the direct connection string or transaction pooler string. Make sure it includes SSL, usually:

```text
?sslmode=require
```

This value will become:

```text
DATABASE_URL
```

## 3. Create Redis On Upstash

Open:

```text
https://upstash.com
```

Steps:

1. Sign in or create an account.
2. Create a new Redis database.
3. Choose the free plan.
4. Choose the nearest region.
5. Open the database details.
6. Copy the Redis connection URL.

Use the Redis URL that starts with:

```text
rediss://
```

This value will become:

```text
REDIS_URL
```

## 4. Create The Web Service On Render

Open:

```text
https://render.com
```

Steps:

1. Sign in or create an account.
2. Click `New`.
3. Choose `Web Service`.
4. Connect your GitHub account.
5. Select the `Accounting-Engine` repository.
6. Choose the free instance type.
7. Set the build and start commands below.

Build Command:

```bash
npm install && npm run build
```

Start Command:

```bash
npm start
```

## 5. Add Environment Variables On Render

In the Render service, open `Environment` and add:

```text
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=any_long_random_secret
JWT_REFRESH_SECRET=another_long_random_secret
REDIS_URL=your_upstash_rediss_url
NODE_ENV=production
```

You do not need to set `PORT` on Render. Render provides a port automatically, and the app reads it from `process.env.PORT`.

## 6. Deploy

After adding the variables:

1. Click `Manual Deploy`.
2. Choose `Deploy latest commit`.
3. Wait for the build to finish.
4. Open the Render URL.

The URL will look like:

```text
https://your-service-name.onrender.com
```

## 7. Test The Live App

Open the Render URL and test:

1. Register a company.
2. Add two accounts.
3. Add a customer.
4. Create an invoice.
5. Record a payment.
6. Create a balanced journal entry.
7. Check the dashboard and trial balance.

## Important Free-Tier Notes

- Render free services spin down after inactivity, so the first request can be slow.
- Supabase free projects can pause after inactivity.
- Upstash free Redis is enough for this project demo and portfolio use.
- This setup is excellent for a portfolio demo, not for a real production accounting product.

## Troubleshooting

If Render build fails:

- Check that `DATABASE_URL` exists.
- Check that `JWT_SECRET` and `JWT_REFRESH_SECRET` exist.
- Check the build logs for Prisma errors.
- Make sure your Supabase password is correct.

If login/register works locally but not on Render:

- Recheck `DATABASE_URL`.
- Make sure Supabase is not paused.
- Run a manual redeploy after changing environment variables.

If Redis errors appear:

- Recheck `REDIS_URL`.
- Use the `rediss://` URL from Upstash.
- Make sure the Upstash database is active.
