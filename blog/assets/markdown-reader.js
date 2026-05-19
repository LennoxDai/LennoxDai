const post = window.BLOG_POST;
const markdownEl = document.getElementById("markdown");
const statusEl = document.getElementById("readerStatus");
const tocEl = document.getElementById("toc");

function normalizeMarkdown(markdown) {
  return markdown
    .replace(/!\[([^\]]*)\]\(D:\\class\\image\\([^)]+)\)/g, "![$1](image/$2)")
    .replace(/!\[([^\]]*)\]\(image\\([^)]+)\)/g, "![$1](image/$2)")
    .replace(/!\[([^\]]*)\]\(image\/([^)]+)\)/g, "![$1](image/$2)");
}

function normalizeDisplayMath(math) {
  const body = math.trim();
  const hasAlignment = /(^|[^\\])&|\\\\/.test(body);
  const hasEnvironment = /\\begin\{/.test(body);
  const tagMatch = body.match(/\\tag\{[^}]+\}\s*(?:\\\\)?\s*$/);

  if (hasAlignment && !hasEnvironment) {
    if (tagMatch) {
      const tag = tagMatch[0].match(/\\tag\{[^}]+\}/)[0];
      const equationBody = body.slice(0, tagMatch.index).trim().replace(/\\\\\s*$/, "").trim();
      return "\\begin{aligned}\n" + equationBody + "\n\\end{aligned} " + tag;
    }

    return "\\begin{aligned}\n" + body.replace(/\\\\\s*$/, "").trim() + "\n\\end{aligned}";
  }

  return body;
}

function setReaderStatus(message, visible = true) {
  statusEl.textContent = message;
  statusEl.hidden = !visible;
}

function normalizeMathContent(math) {
  return math.replace(/\\color\{ForestGreen\}/g, "\\color{green}").replace(/\\color\{RoyalBlue\}/g, "\\color{blue}");
}

function protectMath(markdown) {
  const mathItems = [];

  function saveMath(content, display) {
    const token = `@@MATH_${mathItems.length}@@`;
    const normalized = normalizeMathContent(display ? normalizeDisplayMath(content) : content.trim());
    const html = display
      ? `<div class="math math-display">\\[${escapeHtml(normalized)}\\]</div>`
      : `<span class="math math-inline">\\(${escapeHtml(normalized)}\\)</span>`;

    mathItems.push(html);
    return token;
  }

  let protectedMarkdown = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (_, content) => saveMath(content, true));
  protectedMarkdown = protectedMarkdown.replace(/\\\[([\s\S]*?)\\\]/g, (_, content) => saveMath(content, true));
  protectedMarkdown = protectedMarkdown.replace(/\\\(([\s\S]*?)\\\)/g, (_, content) => saveMath(content, false));
  protectedMarkdown = protectedMarkdown.replace(/(^|[^$\\])\$([^\n$]+?)\$(?!\$)/g, (match, prefix, content) => prefix + saveMath(content, false));

  return { markdown: protectedMarkdown, mathItems };
}

function restoreMath(html, mathItems) {
  return html
    .replace(/@@MATH_(\d+)@@/g, (_, index) => mathItems[Number(index)] || "")
    .replace(/<p>\s*(<div class="math math-display">[\s\S]*?<\/div>)\s*<\/p>/g, "$1");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fallbackRender(markdown) {
  return escapeHtml(markdown)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function enhanceArticle() {
  const headings = Array.from(markdownEl.querySelectorAll("h2, h3"));
  const seen = new Map();

  tocEl.innerHTML = "";
  headings.forEach((heading) => {
    const base = slugify(heading.textContent) || "section";
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    heading.id = count ? base + "-" + count : base;

    const link = document.createElement("a");
    link.href = "#" + heading.id;
    link.textContent = heading.textContent;
    link.className = heading.tagName.toLowerCase();
    tocEl.append(link);
  });

  if (!headings.length) {
    tocEl.innerHTML = '<a href="#article">article</a>';
  }

  markdownEl.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (/^https?:\/\//.test(href)) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
  });

  markdownEl.querySelectorAll("img").forEach((img) => {
    img.loading = "lazy";
  });
}

async function renderMarkdown() {
  try {
    const response = await fetch(post.markdown);
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const raw = await response.text();
    const markdown = normalizeMarkdown(raw);
    const protectedMath = protectMath(markdown);
    const renderer = window.marked
      ? window.marked.parse(protectedMath.markdown, { gfm: true, breaks: false })
      : fallbackRender(protectedMath.markdown);

    markdownEl.innerHTML = restoreMath(renderer, protectedMath.mathItems);
    enhanceArticle();
    setReaderStatus("", false);
  } catch (error) {
    setReaderStatus("markdown fetch failed");
    markdownEl.innerHTML =
      '<blockquote><p>Could not fetch the Markdown from this browser context. Open the raw Markdown or PDF from the links above, or serve this folder through a local/static web server.</p></blockquote>';
    return;
  }

  if (window.MathJax && window.MathJax.typesetPromise) {
    try {
      await window.MathJax.typesetPromise([markdownEl]);
      setReaderStatus("", false);
    } catch (error) {
      setReaderStatus("formula render warning");
      console.warn("MathJax typeset failed:", error);
    }
  }
}

window.addEventListener("load", renderMarkdown);
