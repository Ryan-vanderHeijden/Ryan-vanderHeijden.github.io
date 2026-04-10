/**
 * Animated ASCII background — three layered flow fields using sine-wave noise.
 * Each cell is "won" by whichever layer has the highest brightness there.
 * Layer colors: --fg, --fg-muted, --accent
 */

const CHARS = ' -_:,;^+/|\\?0oOQ#%@';

// Four sine-wave components per sample; constants chosen for organic flow

// DEFAULTS
// const NX   = [0.120, 0.072, 0.154, 0.090];
// const NY   = [0.092, 0.140, 0.068, 0.113];
// const NXY  = [0.051, 0.083, 0.062, 0.041];
// const NXMY = [0.063, 0.044, 0.091, 0.072];
// const NT   = [0.00042, 0.00061, 0.00035, 0.00055];
// const PH   = [0, Math.PI * 0.5, Math.PI * 1.1, Math.PI * 1.7];

// CUSTOM
const NX   = [0.120, 0.072, 0.154, 0.090];
const NY   = [0.092, 0.140, 0.068, 0.113];
const NXY  = [0.051, 0.083, 0.062, 0.041];
const NXMY = [0.063, 0.044, 0.091, 0.072];
const NT   = [0.00042, 0.00061, 0.00035, 0.00055];
const PH   = [0, Math.PI * 0.5, Math.PI * 1.1, Math.PI * 1.7];

// Layer phase offsets so each layer looks distinct
const LAYER_OFFSET = [0, Math.PI * 0.73, Math.PI * 1.45];

function sample(x: number, y: number, t: number, layer: number): number {
  const lp = LAYER_OFFSET[layer];
  let s = 0;
  for (let i = 0; i < 4; i++) {
    s += Math.sin(x * NX[i] + y * NY[i] + (x + y) * NXY[i] + (x - y) * NXMY[i] + t * NT[i] + PH[i] + lp);
  }
  // normalise from [-4,4] → [0,1], slightly compressed to keep mid-tones
  return Math.max(0, Math.min(1, s / 4 * 0.85 + 0.5));
}

function charFor(b: number): string {
  return CHARS[Math.floor(b * (CHARS.length - 1))] ?? ' ';
}

function init() {
  const container = document.getElementById('ascii-bg');
  if (!container) return;

  // Measure actual monospace character dimensions
  const ruler = Object.assign(document.createElement('span'), { textContent: 'X' });
  Object.assign(ruler.style, {
    position: 'absolute', visibility: 'hidden',
    fontFamily: 'inherit', fontSize: 'inherit', lineHeight: '1',
  });
  container.appendChild(ruler);
  const charW = ruler.offsetWidth  || 7.2;
  const charH = ruler.offsetHeight || 12;
  container.removeChild(ruler);

  // Three <pre> elements — one per layer
  const COLORS = ['var(--fg)', 'var(--fg-muted)', 'var(--accent)'];
  const pres = COLORS.map(color => {
    const pre = document.createElement('pre');
    Object.assign(pre.style, {
      position: 'absolute', inset: '0',
      margin: '0', padding: '0',
      fontFamily: 'inherit', fontSize: 'inherit',
      lineHeight: '1',
      color,
      overflow: 'hidden',
      pointerEvents: 'none',
    });
    container.appendChild(pre);
    return pre;
  });

  let cols = 0;
  let rows = 0;

  function resize() {
    cols = Math.ceil(window.innerWidth  / charW) + 1;
    rows = Math.ceil(window.innerHeight / charH) + 1;
  }
  resize();
  window.addEventListener('resize', resize);

  let rafId: number;

  function frame(t: number) {
    // Build each layer's string — non-winning cells are spaces
    const out: string[][] = [[], [], []];

    for (let y = 0; y < rows; y++) {
      const row: string[][] = [[], [], []];
      for (let x = 0; x < cols; x++) {
        const b = [0, 1, 2].map(l => sample(x, y, t, l));
        const winner = b[1] > b[0] ? (b[2] > b[1] ? 2 : 1) : (b[2] > b[0] ? 2 : 0);
        for (let l = 0; l < 3; l++) {
          row[l].push(l === winner ? charFor(b[l]) : ' ');
        }
      }
      for (let l = 0; l < 3; l++) out[l].push(row[l].join(''));
    }

    for (let l = 0; l < 3; l++) pres[l].textContent = out[l].join('\n');

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  // Clean up on Astro page transitions
  document.addEventListener('astro:before-swap', () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
  }, { once: true });
}

// Works for both initial load and Astro client-side navigation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
