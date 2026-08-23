# Your Space 1 · Laundry

Hostel washing machine board for **Your Space 1**.

There are **3 floors** and **2 machines on each floor**. Before someone starts a wash, they register their name and phone on that machine. When clothes are left behind, the next person can call or WhatsApp them to collect the clothes.

Wash timers are kept on the **server**. A phone clock, browser inspect, or extra fields in the request cannot start, extend, or shorten a cycle.

## Run the server

```bash
npm install
npm run build
npm start
```

This starts the hostel board on port 3000, reachable on this computer at [http://localhost:3000](http://localhost:3000) and on other phones on the same Wi‑Fi at `http://YOUR-COMPUTER-IP:3000`.

For local work while changing the site:

```bash
npm run dev
```

Everyone in the hostel must use the same running server so they all see the same board.

## Deploy on Vercel

The site already has APIs (`/api/machines`). On your laptop they save to `data/machines.json`. On Vercel that disk is read-only (`EROFS`), so production needs a small Redis database.

1. Create a free Redis database at [Upstash](https://console.upstash.com/).
2. Copy **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN**.
3. In the Vercel project: **Settings → Environment Variables**, add both names and values.
4. Redeploy the site.

After that, every phone sees the same board and timers stay locked on the server.

## Google sign-in

Google sign-in is **required** to start a wash. It fills **name** and **phone** when Google shares them. Room number is still typed. If Google has no phone number, they enter it by hand.

1. In [Google Cloud Console](https://console.cloud.google.com/) create an OAuth client (Web application).
2. Enable the **People API**.
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-VERCEL-DOMAIN/api/auth/callback/google`
4. In Vercel (and a local `.env.local`) set:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET` (any long random string)
   - `NEXTAUTH_URL` (`http://localhost:3000` locally, or the live site URL)
5. Redeploy.

Without these keys, people cannot start a wash.

## How to use it

1. Open the floor you are on.
2. Tap **I am using this machine** and sign in with Google.
3. Enter your room number and wash time (30 / 45 / 60 minutes).
4. The countdown starts on the server at that moment and cannot be edited.
5. When clothes are left behind, the next person taps **Call** or **WhatsApp**.
6. After the clothes are taken out, tap **Clothes collected** so the machine shows as free.
