# Sweat Society

A private workout log built from your program, with per-exercise history,
skip tracking, and a lightweight login gate. Runs entirely in the browser —
no backend, no database. Your logged data lives in that browser's local
storage.

## File structure

```
index.html            the app shell
css/style.css          all styling
js/config.js            
js/auth.js              login gate logic
js/storage.js           save/load helpers (namespaced per user)
js/app.js               main app: rendering, history, skip/complete logic
js/main.js               loads the data files and boots everything
data/days.json           your program: days, exercises, sets/reps goals
data/images.json         small thumbnail images (base64)
data/images-hires.json   larger images shown when you tap to zoom
```

