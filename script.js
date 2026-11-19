const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
menuToggle?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
navLinks?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
}));
document.getElementById("year").textContent = new Date().getFullYear();

// Load public repositories from GitHub. The featured projects above remain visible
// even if GitHub's public API is temporarily unavailable.
async function loadRepositories() {
  const list = document.getElementById("repoList");
  const count = document.getElementById("repoCount");
  const error = document.getElementById("repoError");
  try {
    const response = await fetch("https://api.github.com/users/sreecharanpujari/repos?sort=updated&per_page=100");
    if (!response.ok) throw new Error("GitHub API response was not successful");
    const repos = await response.json();
    const publicRepos = repos.filter(repo => !repo.fork);
    count.textContent = `${publicRepos.length} public`;
    if (!publicRepos.length) {
      list.innerHTML = '<p class="repo-loading">No public repositories found yet.</p>';
      return;
    }
    list.innerHTML = publicRepos.map(repo => `
      <article class="repo-item">
        <a href="${repo.html_url}" target="_blank" rel="noreferrer">${escapeHTML(repo.name)} ↗</a>
        <p>${escapeHTML(repo.description || "No description added yet.")}</p>
        <div class="repo-meta"><span>${escapeHTML(repo.language || "Language not specified")}</span><span>★ ${repo.stargazers_count}</span><span>Updated ${new Date(repo.updated_at).toLocaleDateString()}</span></div>
      </article>`).join("");
  } catch (err) {
    count.textContent = "GitHub";
    list.innerHTML = "";
    error.hidden = false;
  }
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
loadRepositories();
