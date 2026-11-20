# Happy Birthday & 5 Years 💌

A little website made for one person: letters, our photos, small games and a
date invitation, all in one place. It is a fully static Next.js site (no server),
hosted on GitHub Pages, with a small Supabase database so you can add letters
and photos from your phone through the **Admin Studio**, without redeploying.

---

## What's inside

| Page | What she sees |
| --- | --- |
| `/` Home | Greeting, the "together for…" counter (once the anniversary date is set), polaroids scattered around the page, little surprises. |
| `/letters` | Every letter you write in the Admin Studio, newest first. |
| `/memories` | The photo album, locked behind a fill-in-the-blanks love letter ("the safe"). |
| `/gift` | The date invitation: she picks a day and a place, sees that day's menu, hours and price, and her answer is sent to you. |
| `/games` | The games hub with her best scores. |

**Games** (all made for her, using our own photos and words):

- **Memory Match**: flip our photos and find every pair.
- **Picture Puzzle**: slide the tiles to put a memory back together.
- **Heart Catcher**: catch the falling hearts.
- **Secret Word**: guess the hidden five-letter love word in six tries.
- **Wheel of Love**: spin and win a little something from you.
- **Love Coupons**: scratch to reveal coupons she can redeem anytime.

The words the games use (nicknames, reasons, coupons, wheel prizes, secret
words) are editable in **Admin Studio → Site & Games**.

**Admin Studio** (`/admin`, passcode protected) is where you manage everything;
see [Admin Studio](#admin-studio) below.

---

## Run it on your computer

You need [Node.js 22](https://nodejs.org) (20+ works).

```bash
npm ci          # install exactly the versions in package-lock.json
npm run dev     # start the dev server
```

Open <http://localhost:3000>. Pages reload as you edit files.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Builds the static site into `./out` (this is what gets deployed). |
| `npx serve out` | Preview the built site locally after `npm run build`. |
| `npm run photos` | Turns `assets/photos` into web-ready images (see below). |
| `npm run lint` / `npm run typecheck` | Check the code for mistakes. |

Settings for local development go in `.env.local` (copy `.env.example`).
Everything there is optional.

---

## Adding photos

The photos used across the site (games, galleries, home page) are built into
the site from the `assets/photos` folder.

1. **Drop the original photos** into `assets/photos`.
   JPG, PNG, WebP and AVIF work. iPhone **HEIC** photos usually can't be read:
   export them as JPG first. Short videos (`.mp4`, `.mov`, `.webm`) work too.
2. **Optional: add a caption, a story or a date** in `assets/photos/stories.json`:

   ```json
   [
     {
       "file": "20240722_174317.jpg",
       "caption": "Where our story began",
       "story": "The first time we…",
       "date": "2024:07:22 17:43:18"
     }
   ]
   ```

   `file` must match the file name exactly. Dates in phone file names
   (`20240722_174317.jpg`, `IMG-20240722-WA0001.jpg`, `PXL_…`) are picked up
   automatically, so `date` is only needed for photos without one.
3. **Run** `npm run photos`. It writes resized images to `public/photos`
   (full size up to 1600 px and thumbnails up to 640 px, as WebP) and the list
   of photos to `src/data/photos.generated.json`.
4. **Commit both** `public/photos/` and `src/data/photos.generated.json`, then
   push. The site updates on the next deploy.

> Re-running the script rebuilds `public/photos` from scratch, so a photo you
> remove from `assets/photos` disappears from the site too.

Photos you add from **Admin Studio → Memories / Polaroids** don't need any of
this: they are uploaded to the cloud and show up immediately.

---

## Admin Studio

Go to `/admin` and enter the passcode.

- **Passcode**: by default it's the built-in passcode defined in
  `src/lib/storage.ts`. To choose your own, set `NEXT_PUBLIC_ADMIN_PASSWORD`
  (in `.env.local` locally, and in the deploy settings, see
  [Deploying](#deploying)). Once it is set, the built-in default stops working.
  The login screen never shows a hint, so she can't stumble into it.
- **Letters**: write, edit and delete letters.
- **Memories**: upload extra photos for the album, edit captions, change the
  order. Large photos are shrunk in the browser before uploading.
- **Polaroids Vault**: the polaroids scattered on the home page.
- **Love Letter Safe**: the letter she fills in to open the Memories page.
  Write blanks as `[hint|answer]`, e.g. `I love your [feature|smile]`. The
  page lists every blank so you can check the answers. There is also a switch
  to open the safe for everyone.
- **Gift & Date**: choose the featured date spot, add your own spots (with
  their own open days and weekday/weekend menus), upload the "cute fella"
  photo, and see her RSVP when she accepts.
- **Site & Games**: her name, your sign-off, the anniversary and birthday
  dates, nicknames, reasons, coupons, wheel prizes, secret words and your
  WhatsApp number. Every section has a "Reset section to defaults" button,
  and nothing changes for her until you press **Save changes**.
  The home page "together for…" counter appears once the anniversary date is set.
- **Cloud Database**: shows whether the database answers, lets you test the
  connection and copy the one-time setup SQL.
- **Export backup**: downloads everything (letters, memories, polaroids,
  places, settings) as one JSON file. Worth doing once in a while.

### The cloud database (Supabase)

Letters, uploaded photos, polaroids and all settings live in a free
[Supabase](https://supabase.com) project, so every phone and computer sees the
same thing. Without it, the site still works with the copy saved in the
browser.

- Tables: `letters`, `memories`, `polaroids`, plus a public storage bucket
  called `memories` for uploaded photos. Settings are rows in `letters` whose
  title starts with `[` (for example `[SITE_CONFIG]`); the public pages hide them.
- **First-time setup** of a new project: Admin Studio → Cloud Database →
  *Copy SQL*, then paste it into Supabase → SQL Editor → Run.
- **Using a different project**: set `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Project Settings → API) as build
  settings, or paste them in the Cloud Database panel to try them on one device.
  Only ever use the **anon / publishable** key, never `service_role`.
- Free Supabase projects **pause after about a week without visits**. If the
  admin says the cloud isn't answering, open the Supabase dashboard and press
  *Restore project*.

> **Good to know:** the passcode and the database key are part of the public
> website code, and the database accepts changes from the site. That's fine for
> keeping a surprise hidden, but it isn't a bank vault: don't store anything
> truly private there.

---

## Deploying

### GitHub Pages (the normal way)

`.github/workflows/deploy.yml` builds and publishes the site on every push to
`main` (and from the Actions tab via *Run workflow*).

1. In the GitHub repository: **Settings → Pages → Source: GitHub Actions**.
2. Push to `main`. The *Deploy to GitHub Pages* action builds the site and
   publishes `./out`.

The site usually lives at `https://<user>.github.io/<repo>/`. The workflow
sets `PAGES_BASE_PATH` to `/<repo>` automatically, and the code adds that
prefix to every page link and every photo (`asset()` in `src/lib/basePath.ts`).
With a custom domain or a `<user>.github.io` repository the base path is empty.

Optional repository secrets (**Settings → Secrets and variables → Actions**):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). When they are missing, the built-in
project is used.

To use your own admin passcode on the live site, add a secret called
`NEXT_PUBLIC_ADMIN_PASSWORD` and add this line under `env:` in the
*Build static site* step of `deploy.yml`:

```yaml
NEXT_PUBLIC_ADMIN_PASSWORD: ${{ secrets.NEXT_PUBLIC_ADMIN_PASSWORD }}
```

### Netlify (alternative)

`netlify.toml` is ready: connect the repository in Netlify and it runs
`npm run build` and publishes `out` from the domain root (no base path).
Add the same `NEXT_PUBLIC_*` variables in Netlify's environment settings if
you need them.

---

## Privacy note about photos

Everything in `public/` (including `public/photos`) is published with the
site: anyone who has a photo's URL can open it, even without going through the
Memories safe. Photos uploaded in the Admin Studio are in a public Supabase
bucket and work the same way. If the GitHub repository itself is public, the
original photos in `assets/photos` can be browsed there too, so consider making
the repository private (GitHub Pages from a private repository needs a paid
GitHub plan; Netlify works from private repositories for free).

---

## Where things are

```
assets/photos/              original photos + stories.json (input of npm run photos)
public/photos/              generated web images (commit these)
scripts/build-photos.mjs    the photo pipeline
src/app/                    pages (/, letters, memories, gift, games/*, admin/*)
src/components/             shared UI, effects and game building blocks
src/data/love.ts            default words: nicknames, reasons, coupons, prizes, secret words
src/data/places.ts          the built-in date spots and their schedules
src/data/photos.generated.json   generated photo list (don't edit by hand)
src/lib/storage.ts          letters, memories, polaroids and settings (cloud + local copy)
src/lib/supabase.ts         Supabase connection, uploads, settings helpers
src/lib/siteConfig.ts       the Site & Games settings
```

Built with Next.js (static export), React, Tailwind CSS, Framer Motion and Supabase.
