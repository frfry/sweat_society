// All reads/writes go through here so every key is namespaced to the
// currently logged-in user (see userKeyPrefix() in auth.js).

async function getProgress(name) {
  try {
    const v = localStorage.getItem(userKeyPrefix() + "hist_" + name);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
}

async function setProgress(name, maxWeight) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    localStorage.setItem(
      userKeyPrefix() + "hist_" + name,
      JSON.stringify({ maxWeight, date: today })
    );
  } catch (e) {}
}

async function getDayData(num) {
  try {
    const v = localStorage.getItem(userKeyPrefix() + "day_" + num);
    return v ? JSON.parse(v) : {};
  } catch (e) {
    return {};
  }
}

async function setDayData(num, data) {
  try {
    localStorage.setItem(userKeyPrefix() + "day_" + num, JSON.stringify(data));
  } catch (e) {}
}

async function getDayDate(num) {
  try {
    return localStorage.getItem(userKeyPrefix() + "date_" + num) || "";
  } catch (e) {
    return "";
  }
}

async function setDayDate(num, dateStr) {
  try {
    const key = userKeyPrefix() + "date_" + num;
    if (dateStr) localStorage.setItem(key, dateStr);
    else localStorage.removeItem(key);
  } catch (e) {}
}

function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function sixMonthsAgoISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().slice(0, 10);
}

function exportBackup() {
  const prefix = userKeyPrefix();
  const backup = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      backup[k] = localStorage.getItem(k);
    }
  }
  const user = getCurrentUser();
  const payload = {
    app: APP_TITLE,
    user: user ? user.firstName : "unknown",
    exportedAt: new Date().toISOString(),
    data: backup,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = todayISO();
  a.href = url;
  a.download = `sweat-society-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function handleRestoreFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      const data = payload.data || payload;
      const keys = Object.keys(data);
      if (!keys.length) {
        alert("That file didn't have any logged workout data in it.");
        return;
      }
      if (
        !confirm(
          `Restore ${keys.length} saved item(s) from this backup? This will overwrite any matching data you have now.`
        )
      )
        return;
      const prefix = userKeyPrefix();
      keys.forEach((k) => {
        if (k.startsWith(prefix)) {
          localStorage.setItem(k, data[k]);
        }
      });
      alert("Backup restored.");
      renderHome();
    } catch (err) {
      alert("That file could not be read as a Sweat Society backup.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

async function clearAll() {
  if (!confirm("Erase every weight you have logged? This cannot be undone.")) return;
  try {
    const prefix = userKeyPrefix();
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    keys.forEach((k) => {
      if (k && k.startsWith(prefix)) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) {}
  renderHome();
}
