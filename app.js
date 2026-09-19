const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const dropzone = document.getElementById('dropzone');
const generateButton = document.getElementById('generateButton');
const fileMeta = document.getElementById('fileMeta');
const thumb = document.getElementById('thumb');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const clearFile = document.getElementById('clearFile');
const status = document.getElementById('status');
const beforeImage = document.getElementById('beforeImage');
const demoArt = document.getElementById('demoArt');
const artCanvas = document.getElementById('artCanvas');
const artFrame = document.getElementById('artFrame');
const beforeFrame = document.getElementById('beforeFrame');
const header = document.querySelector('.site-header');

let selectedFile = null;
let objectUrl = null;

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function setStatus(message) {
  status.textContent = message;
}

function selectFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    setStatus('Please choose a PNG, JPG, or WEBP image.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    setStatus('That image is over the 10 MB limit.');
    return;
  }

  selectedFile = file;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  thumb.src = objectUrl;
  beforeImage.src = objectUrl;
  fileName.textContent = file.name;
  fileSize.textContent = `${formatSize(file.size)} · Ready to render`;
  uploadButton.hidden = true;
  fileMeta.hidden = false;
  generateButton.disabled = false;
  artCanvas.style.display = 'none';
  demoArt.style.display = 'block';
  setStatus('Image loaded. Click “Generate artwork”.');
}

uploadButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => selectFile(e.target.files[0]));

['dragenter', 'dragover'].forEach(type => {
  dropzone.addEventListener(type, e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('drag-active');
  });
});
['dragleave', 'drop'].forEach(type => {
  dropzone.addEventListener(type, e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('drag-active');
  });
});
dropzone.addEventListener('drop', e => selectFile(e.dataTransfer.files[0]));

clearFile.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
  uploadButton.hidden = false;
  fileMeta.hidden = true;
  generateButton.disabled = true;
  beforeImage.src = 'assets/demo-source.jpg';
  artCanvas.style.display = 'none';
  demoArt.style.display = 'block';
  setStatus('');
});

function fitImage(ctx, image, canvas) {
  const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  const x = (canvas.width - w) / 2;
  const y = (canvas.height - h) / 2;
  ctx.drawImage(image, x, y, w, h);
}

function stylizeCanvas(image) {
  const maxWidth = 1100;
  const ratio = Math.min(1, maxWidth / image.naturalWidth);
  artCanvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  artCanvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const ctx = artCanvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, artCanvas.width, artCanvas.height);
  ctx.fillStyle = '#d7c39b';
  ctx.fillRect(0, 0, artCanvas.width, artCanvas.height);
  fitImage(ctx, image, artCanvas);

  const data = ctx.getImageData(0, 0, artCanvas.width, artCanvas.height);
  const p = data.data;
  const w = artCanvas.width;
  const h = artCanvas.height;

  // Warm monochrome / ink treatment.
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i + 1], b = p[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const shadowLift = Math.pow(lum / 255, 0.92) * 255;
    p[i] = Math.min(255, shadowLift * 0.93 + 26);
    p[i + 1] = Math.min(255, shadowLift * 0.83 + 18);
    p[i + 2] = Math.min(255, shadowLift * 0.67 + 8);
    p[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);

  // Fine line emphasis from luminance differences.
  const edge = ctx.getImageData(0, 0, w, h);
  const e = edge.data;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const right = idx + 4;
      const down = idx + w * 4;
      const here = e[idx];
      const diff = Math.abs(here - e[right]) + Math.abs(here - e[down]);
      if (diff > 34) {
        const ink = Math.min(120, diff * 1.4);
        e[idx] = Math.max(18, e[idx] - ink);
        e[idx + 1] = Math.max(14, e[idx + 1] - ink);
        e[idx + 2] = Math.max(8, e[idx + 2] - ink);
      }
    }
  }
  ctx.putImageData(edge, 0, 0);

  // Vignette / paper wash.
  const vignette = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*.18, w/2, h/2, Math.max(w,h)*.72);
  vignette.addColorStop(0, 'rgba(255,241,210,0)');
  vignette.addColorStop(1, 'rgba(46,30,15,.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

generateButton.addEventListener('click', async () => {
  if (!selectedFile) return;
  generateButton.disabled = true;
  setStatus('Rendering your portrait…');
  generateButton.querySelector('span').textContent = 'Rendering…';

  try {
    const image = await loadImage(objectUrl);
    await new Promise(r => setTimeout(r, 650));
    stylizeCanvas(image);
    artFrame.classList.remove('floating-slow');
    beforeFrame.classList.remove('floating');
    demoArt.style.display = 'none';
    artCanvas.style.display = 'block';
    setStatus('Your Renaissance study is ready.');

    const downloadButton = document.createElement('button');
    downloadButton.type = 'button';
    downloadButton.className = 'generate-button';
    downloadButton.style.marginTop = '8px';
    downloadButton.innerHTML = '<span>Download artwork</span><span class="button-arrow">↓</span>';
    downloadButton.addEventListener('click', () => {
      const a = document.createElement('a');
      a.download = 'da-vinci-portrait.jpg';
      a.href = artCanvas.toDataURL('image/jpeg', .94);
      a.click();
    });
    document.querySelector('.creator').appendChild(downloadButton);
  } catch (error) {
    console.error(error);
    setStatus('Something went wrong. Try another image.');
  } finally {
    generateButton.disabled = false;
    generateButton.querySelector('span').textContent = 'Generate artwork';
  }
});

// Header glass transition.
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// Section reveal.
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Active navigation.
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
sections.forEach(section => navObserver.observe(section));

// Mouse atmosphere.
window.addEventListener('pointermove', e => {
  document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
  document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
  const upload = document.querySelector('.upload-panel');
  if (upload) {
    const rect = upload.getBoundingClientRect();
    upload.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    upload.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }
});

// Animate a subtle cursor glow through the CSS position.
let raf = null;
window.addEventListener('pointermove', e => {
  const light = document.querySelector('.cursor-light');
  if (!light) return;
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    light.style.left = `${e.clientX}px`;
    light.style.top = `${e.clientY}px`;
  });
});
