# Sweat Society

A private workout log built from your program, with per-exercise history,
skip tracking, and a lightweight login gate. Runs entirely in the browser —
no backend, no database. Your logged data lives in that browser's local
storage.

## File structure

```
index.html            the app shell
css/style.css          all styling
js/config.js            <-- edit this to add/remove who can log in
js/auth.js              login gate logic
js/storage.js           save/load helpers (namespaced per user)
js/app.js               main app: rendering, history, skip/complete logic
js/main.js               loads the data files and boots everything
data/days.json           your program: days, exercises, sets/reps goals
data/images.json         small thumbnail images (base64)
data/images-hires.json   larger images shown when you tap to zoom
```

## Adding who can log in

Open `js/config.js` and add an entry for each person, like:

```js
const ALLOWED_USERS = [
  { firstName: "Alex", last4: "1234" },
  { firstName: "Jamie", last4: "5678" },
];
```

- `firstName` matching is case-insensitive.
- `last4` should be exactly 4 digits (the last 4 of that person's phone number).
- There's no sign-up flow on purpose — you control this list directly.

**Heads up:** this is a *simple* client-side gate, not real security. Anyone
who looks at this file's source (or your GitHub repo, if it's public) can see
the names/numbers on the list. That's fine for keeping casual/accidental
visitors out, but don't rely on it to protect anything sensitive. If you want
your repo private, GitHub lets you set that in the repo settings, and GitHub
Pages still works from a private repo.

Each approved person's workout log is stored separately (keyed by their name
+ last4), so multiple people can use the same device without clashing.

## Publishing on GitHub Pages

1. Create a new repository on GitHub (public, or private if you're on a paid
   plan that supports Pages from private repos — otherwise use public).
2. Upload all the files in this folder, keeping the folder structure intact
   (`css/`, `js/`, `data/` should stay as subfolders).
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment," set **Source** to **Deploy from a branch**,
   pick your default branch (usually `main`) and `/ (root)`, then **Save**.
5. Wait a minute or two, then your app will be live at:
   `https://<your-username>.github.io/<repo-name>/`
6. Open that link on your phone in Safari, then **Share → Add to Home Screen**
   for an app-like icon.

## Backing up your data

On the home screen there's a **Save backup** button — it downloads a small
`.json` file with everything you've logged. Worth doing occasionally, or
before clearing your browser's storage. **Restore backup** loads one back in.
