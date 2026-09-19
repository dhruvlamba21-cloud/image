# Da Vinci Portrait

Static GitHub Pages-ready site for turning an uploaded image into a Renaissance-style digital study.

## Run locally
Open `index.html` in a browser.

## Publish on GitHub Pages
Upload the contents of this folder to a new GitHub repository, then enable GitHub Pages from the `main` branch and `/ (root)`.

## Important
The current `app.js` includes a client-side stylization pipeline so the demo works without a server. A true generative AI transformation (new hand-drawn artwork rather than an image treatment) would require connecting `stylizeCanvas()` to a server-side image-generation API. Never put a private API key directly in GitHub Pages JavaScript.
