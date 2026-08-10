window.addEventListener("error", function (e) {
  const appEl = document.getElementById("app");
  if (appEl && !appEl.dataset.rendered) {
    appEl.innerHTML = `
      <div style="padding:40px 20px;color:#f2eef8;font-family:sans-serif;text-align:center;">
        <div style="font-size:15px;font-weight:700;margin-bottom:10px;">Something went wrong loading the app</div>
        <div style="font-size:13px;color:#9992ab;">${(e.message || "Unknown error").replace(/</g, "&lt;")}</div>
        <div style="font-size:12px;color:#9992ab;margin-top:16px;">
          Make sure you're opening this over http(s):// (e.g. your GitHub Pages URL),
          not as a local double-clicked file.
        </div>
      </div>`;
  }
});

async function loadData() {
  const [days, images, imagesHi] = await Promise.all([
    fetch("data/days.json").then((r) => r.json()),
    fetch("data/images.json").then((r) => r.json()),
    fetch("data/images-hires.json").then((r) => r.json()),
  ]);
  DAYS = days;
  IMAGES = images;
  IMAGES_HI = imagesHi;
  buildExerciseIndex();
}

(async function boot() {
  await loadData();
  requireAuthThenStart();
})();
