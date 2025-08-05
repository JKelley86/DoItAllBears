// main.js
// Import your wallpapers from separate files
import { stars } from './wallpapers/stars.js';
import { waves } from './wallpapers/waves.js';
import { fireflies } from './wallpapers/fireflies.js';
import { cursorTrail } from './wallpapers/cursorTrail.js';
import { blackHole } from './wallpapers/blackHole.js';
import { meteorShower } from './wallpapers/meteorShower.js';
import { starfieldWarp } from './wallpapers/starfieldWarp.js';
import { galaxySwirl } from './wallpapers/galaxySwirl.js';
import { auroraBorealis } from './wallpapers/auroraBorealis.js';
import { deepOcean } from './wallpapers/deepOcean.js';

// Map wallpaper names to imported functions
const wallpapers = {
  Stars: stars,
  Waves: waves,
  Fireflies: fireflies,
  CursorTrail: cursorTrail,
  BlackHole: blackHole,
  MeteorShower: meteorShower,
  StarfieldWarp: starfieldWarp,
  GalaxySwirl: galaxySwirl,
  AuroraBorealis: auroraBorealis,
  DeepOcean: deepOcean,
};

const gallery = document.querySelector('.wallpaper-gallery');
const viewer = document.getElementById('fullscreen-viewer');
const closeBtn = document.getElementById('closeBtn');
const canvasContainer = document.getElementById('wallpaper-canvas');

// Create previews for thumbnails
gallery.querySelectorAll('.wallpaper-thumb').forEach(thumb => {
  const name = thumb.getAttribute('data-wallpaper');
  const previewCanvas = document.createElement('canvas');
  const ctx = previewCanvas.getContext('2d');
  previewCanvas.width = 200;
  previewCanvas.height = 150;
  thumb.appendChild(previewCanvas);

  if (wallpapers[name]) {
    wallpapers[name](previewCanvas, ctx, 200, 150);
  }

  // On click, open fullscreen with chosen wallpaper
  thumb.addEventListener('click', () => {
    viewer.style.display = 'flex';
    canvasContainer.innerHTML = '';
    const fullCanvas = document.createElement('canvas');
    const fullCtx = fullCanvas.getContext('2d');
    fullCanvas.width = window.innerWidth;
    fullCanvas.height = window.innerHeight;
    canvasContainer.appendChild(fullCanvas);

    if (wallpapers[name]) {
      wallpapers[name](fullCanvas, fullCtx, fullCanvas.width, fullCanvas.height);
    }
  });
});

closeBtn.addEventListener('click', () => {
  viewer.style.display = 'none';
  canvasContainer.innerHTML = '';
});

// Handle window resize when fullscreen wallpaper is active
window.addEventListener('resize', () => {
  if (viewer.style.display === 'flex') {
    const canvas = canvasContainer.querySelector('canvas');
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }
});
