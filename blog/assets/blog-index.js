const fallbackPosts = [
  {
    id: "diffusion-intro",
    title: "Diffusion Model 简单介绍",
    kicker: "featured / diffusion",
    date: "2026-05-15",
    path: "1/index.html",
    markdown: "1/1.md",
    pdf: "1/1.pdf",
    thumbnail: "1/image/1.png",
    summary:
      "DDPM, DDIM, score-based models, flow matching, text-conditioned generation, CFG, acceleration, RL alignment, caching, and tooling.",
    tags: ["Diffusion", "DDPM", "DDIM", "Flow Matching", "Markdown"],
  },
];

const postListEl = document.getElementById("postList");
const postCountEl = document.getElementById("postCount");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPost(post) {
  const tags = (post.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");

  return `
    <article class="post-card">
      <a class="post-thumb" href="${escapeHtml(post.path)}">
        <img src="${escapeHtml(post.thumbnail)}" alt="${escapeHtml(post.title)} preview" />
      </a>
      <div>
        <div class="post-kicker">${escapeHtml(post.kicker || post.date || "post")}</div>
        <h2 class="post-title"><a href="${escapeHtml(post.path)}">${escapeHtml(post.title)}</a></h2>
        <p class="post-desc">${escapeHtml(post.summary)}</p>
        <div class="post-tags">${tags}</div>
        <div class="post-actions">
          <a class="post-link" href="${escapeHtml(post.path)}">read md</a>
          <a class="post-link" href="${escapeHtml(post.pdf)}" target="_blank" rel="noreferrer">pdf</a>
        </div>
      </div>
    </article>
  `;
}

async function loadPosts() {
  try {
    const response = await fetch("posts.json");
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    return await response.json();
  } catch (error) {
    return fallbackPosts;
  }
}

async function renderIndex() {
  const posts = await loadPosts();
  postListEl.innerHTML = posts.map(renderPost).join("");
  postCountEl.textContent = `~/blog contains ${posts.length} post${posts.length === 1 ? "" : "s"}`;
}

renderIndex();
