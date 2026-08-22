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

## How to use it

1. Open the floor you are on.
2. Tap **I am using this machine**.
3. Enter your name, 10-digit phone number, and wash time (30 / 45 / 60 minutes).
4. The countdown starts on the server at that moment and cannot be edited.
5. When clothes are left behind, the next person taps **Call** or **WhatsApp**.
6. After the clothes are taken out, tap **Clothes collected** so the machine shows as free.
