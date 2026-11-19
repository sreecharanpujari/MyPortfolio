"use strict";

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const themeToggle = document.getElementById("themeToggle");
const backToTop = document.getElementById("backToTop");

// Mobile navigation: closes on selection, Escape, or switching to desktop.
function closeMenu() {
  navLinks?.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Open navigation");
  if (menuToggle) menuToggle.textContent = "☰";
}

menuToggle?.addEventListener("click", () => {
  const open = navLinks?.classList.toggle("open") ?? false;
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  menuToggle.textContent = open ? "✕" : "☰";
});

navLinks?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMenu();
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 600) closeMenu();
});

// Theme preference with a safe fallback if browser storage is unavailable.
const themeStorageKey = "portfolio-theme";
const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
let savedTheme = null;
try { savedTheme = localStorage.getItem(themeStorageKey); } catch (error) {
  console.warn("Theme preference storage is unavailable.", error);
}

function applyTheme(dark) {
  document.body.classList.toggle("light-mode", !dark);
  if (themeToggle) {
    themeToggle.textContent = dark ? "☀️" : "🌙";
    themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    themeToggle.setAttribute("aria-pressed", String(dark));
    themeToggle.title = dark ? "Switch to light mode" : "Switch to dark mode";
  }
}
applyTheme(savedTheme ? savedTheme === "dark" : prefersDark);

themeToggle?.addEventListener("click", () => {
  const dark = document.body.classList.contains("light-mode");
  applyTheme(dark);
  try { localStorage.setItem(themeStorageKey, dark ? "dark" : "light"); } catch (error) {
    console.warn("Could not save theme preference.", error);
  }
});

// Copyright year.
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Escape untrusted GitHub API text before inserting it into HTML.
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

// Load public, non-fork repositories from the GitHub API.
async function loadRepositories() {
  const list = document.getElementById("repoList");
  const count = document.getElementById("repoCount");
  const error = document.getElementById("repoError");
  if (!list || !count || !error) return;

  try {
    const response = await fetch(
      "https://api.github.com/users/sreecharanpujari/repos?sort=updated&per_page=100",
      { headers: { Accept: "application/vnd.github+json" } }
    );
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

    const repos = await response.json();
    const publicRepos = repos
      .filter(repo => !repo.fork && typeof repo.html_url === "string" && repo.html_url.startsWith("https://github.com/"))
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    count.textContent = `${publicRepos.length} public`;
    list.setAttribute("aria-busy", "false");
    error.hidden = true;

    if (!publicRepos.length) {
      list.innerHTML = '<p class="repo-loading">No public repositories found yet.</p>';
      return;
    }

    list.innerHTML = publicRepos.map(repo => `
      <article class="repo-item">
        <a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(repo.name)} ↗</a>
        <p>${escapeHTML(repo.description || "No description added yet.")}</p>
        <div class="repo-meta">
          <span>${escapeHTML(repo.language || "Not specified")}</span>
          <span>★ ${Number(repo.stargazers_count) || 0}</span>
          <span>Updated ${new Date(repo.updated_at).toLocaleDateString()}</span>
        </div>
      </article>
    `).join("");
  } catch (error) {
    console.error("GitHub repository loading failed:", error);
    count.textContent = "GitHub";
    list.setAttribute("aria-busy", "false");
    list.innerHTML = "";
    error.hidden = false;
  }
}
loadRepositories();

// Back-to-top control.
backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
const updateBackToTop = () => backToTop?.classList.toggle("visible", window.scrollY > 500);
window.addEventListener("scroll", updateBackToTop, { passive: true });
updateBackToTop();

// Highlight the navigation link for the section currently in view.
const sectionLinks = [...(navLinks?.querySelectorAll('a[href^="#"]') ?? [])];
const sections = sectionLinks
  .map(link => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const current = "#" + entry.target.id;
      sectionLinks.forEach(link => {
        if (link.getAttribute("href") === current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-28% 0px -62% 0px" });
  sections.forEach(section => sectionObserver.observe(section));
}

// Subtle reveal motion; content remains visible if reduced motion is requested.
const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
if (!reduceMotion && "IntersectionObserver" in window) {
  document.documentElement.classList.add("has-reveal");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".about-panel, .section-heading, .skill-pill, .project-card, .repo-panel, .badge-card, .contact-card, .exploring-card, .roadmap-item, .pinned-repo")
    .forEach(element => {
      element.classList.add("reveal");
      revealObserver.observe(element);
    });
}


// Copy email address from the contact section.
const copyEmailButton = document.getElementById("copyEmail");
const siteToast = document.getElementById("siteToast");
let toastTimeout;
function showSiteToast(message) {
  if (!siteToast) return;
  siteToast.textContent = message;
  siteToast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => siteToast.classList.remove("visible"), 2600);
}
copyEmailButton?.addEventListener("click", async () => {
  const email = copyEmailButton.dataset.email;
  if (!email) return;
  try {
    await navigator.clipboard.writeText(email);
    showSiteToast("Email address copied!");
  } catch (error) {
    showSiteToast("Copy unavailable — use sreecharanpujari@gmail.com");
  }
});
