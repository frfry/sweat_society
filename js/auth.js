// Simple client-side login gate. Not real security -- anyone who can read
// this file's source can see the allowed list. It's just a light gate so
// only the couple of people you approve can get past the login screen on
// a shared link, and so each person's workout log stays separate.

const AUTH_STORAGE_KEY = "ss_current_user";

function normalizeName(name) {
  return (name || "").trim().toLowerCase();
}

function findUser(firstName, last4) {
  const n = normalizeName(firstName);
  const l = (last4 || "").trim();
  return ALLOWED_USERS.find(
    (u) => normalizeName(u.firstName) === n && u.last4 === l
  );
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// Storage keys are namespaced per user so more than one approved person
// can share the same device/browser without overwriting each other's logs.
function userKeyPrefix() {
  const u = getCurrentUser();
  if (!u) return "anon_";
  return `u_${normalizeName(u.firstName)}_${u.last4}_`;
}

function renderLoginScreen() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="login-screen">
      <div class="login-brand">${APP_TITLE}</div>
      <div class="login-title">Sign in</div>
      <form id="login-form">
        <div class="login-field">
          <label class="login-label">First name</label>
          <input class="login-input" id="login-name" type="text" autocomplete="given-name" autocapitalize="words" required>
        </div>
        <div class="login-field">
          <label class="login-label">Last 4 digits of phone number</label>
          <input class="login-input" id="login-last4" type="tel" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required>
        </div>
        <button class="login-btn" type="submit">Sign in</button>
        <div class="login-error" id="login-error"></div>
      </form>
    </div>
  `;

  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const firstName = document.getElementById("login-name").value;
    const last4 = document.getElementById("login-last4").value;
    const match = findUser(firstName, last4);
    const errorEl = document.getElementById("login-error");

    if (!match) {
      errorEl.textContent = "That name and number don't match. Try again.";
      return;
    }
    setCurrentUser({ firstName: match.firstName, last4: match.last4 });
    startApp();
  });
}

// Entry point called by main.js once data is loaded.
function requireAuthThenStart() {
  const existing = getCurrentUser();
  if (existing && findUser(existing.firstName, existing.last4)) {
    startApp();
  } else {
    clearCurrentUser();
    renderLoginScreen();
  }
}

function logout() {
  clearCurrentUser();
  location.hash = "";
  renderLoginScreen();
}
