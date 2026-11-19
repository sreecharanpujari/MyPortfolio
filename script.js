
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const themeToggle = document.getElementById("themeToggle");

// Mobile navigation
function closeMenu() {
  navLinks?.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Open navigation");
}

menuToggle?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation"
  );
});

navLinks?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMenu();
});

// Dark / light theme
const savedTheme = localStorage.getItem("portfolio-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

function applyTheme(dark) {
  document.body.classList.toggle("dark-mode", dark);
  themeToggle.textContent = dark ? "☀️" : "🌙";
  themeToggle.setAttribute(
    "aria-label",
    dark ? "Switch to light mode" : "Switch to dark mode"
  );
}

applyTheme(savedTheme ? savedTheme === "dark" : prefersDark);

themeToggle?.addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark-mode");
  applyTheme(dark);
  localStorage.setItem("portfolio-theme", dark ? "dark" : "light");
});

// Automatic copyright year
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Safely escape GitHub API text
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// GitHub repositories
async function loadRepositories() {
  const list = document.getElementById("repoList");
  const count = document.getElementById("repoCount");
  const error = document.getElementById("repoError");

  if (!list || !count || !error) return;

  try {
    const response = await fetch(
      "https://api.github.com/users/sreecharanpujari/repos?sort=updated&per_page=100"
    );

    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`);
    }

    const repos = await response.json();
    const publicRepos = repos
      .filter(repo => !repo.fork)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    count.textContent = `${publicRepos.length} public`;
    error.hidden = true;

    if (!publicRepos.length) {
      list.innerHTML =
        '<p class="repo-loading">No public repositories found yet.</p>';
      return;
    }

    list.innerHTML = publicRepos.map(repo => `
      <article class="repo-item">
        <a href="${escapeHTML(repo.html_url)}"
           target="_blank" rel="noopener noreferrer">
          ${escapeHTML(repo.name)} ↗
        </a>
        <p>${escapeHTML(repo.description || "No description added yet.")}</p>
        <div class="repo-meta">
          <span>${escapeHTML(repo.language || "Not specified")}</span>
          <span>★ ${Number(repo.stargazers_count) || 0}</span>
          <span>Updated ${new Date(repo.updated_at).toLocaleDateString()}</span>
        </div>
      </article>
    `).join("");

  } catch (err) {
    console.error("GitHub repository loading failed:", err);
    count.textContent = "GitHub";
    list.innerHTML = "";
    error.hidden = false;
  }
}

loadRepositories();
