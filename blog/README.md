# Blog Structure

Each post lives in its own numbered folder:

```text
blog/
  posts.json
  index.html
  assets/
  1/
    index.html
    1.md
    1.pdf
    image/
```

To add a post:

1. Create a new folder, for example `blog/2/`.
2. Put the Markdown, optional PDF, and images in that folder.
3. Copy `blog/1/index.html` and update `window.BLOG_POST`.
4. Add one entry to `blog/posts.json` so the blog index can render the card.

Markdown image paths are normalized by `assets/markdown-reader.js`, including paths like `image\1.png` and `D:\class\image\1.png`.
