import * as THREE from 'three';

export function createGalaxyFabricTexture(
  primaryHex: string,
  secondaryHex: string,
  accentHex: string,
  sparkleIntensity: number,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base cosmic gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, primaryHex);
  grad.addColorStop(0.55, secondaryHex);
  grad.addColorStop(1, primaryHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Soft nebula clouds
  for (let i = 0; i < 14; i++) {
    const x = ((i * 137.5) % 1) * size;
    const y = ((i * 73.1 + 0.3) % 1) * size;
    const r = 80 + (i % 4) * 45;
    const neb = ctx.createRadialGradient(x, y, 4, x, y, r);
    neb.addColorStop(0, i % 2 === 0 ? `${secondaryHex}88` : `${accentHex}33`);
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, size, size);
  }

  // Subtle constellation filigree lines
  ctx.strokeStyle = `${accentHex}44`;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 8; i++) {
    const x1 = ((i * 91 + 40) % size);
    const y1 = ((i * 153 + 20) % size);
    const x2 = ((x1 + 75) % size);
    const y2 = ((y1 + 55) % size);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.arc(x1, y1, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shimmering stardust sparkles
  const starCount = Math.floor(120 + sparkleIntensity * 380);
  for (let i = 0; i < starCount; i++) {
    const sx = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * size;
    const sy = ((Math.sin(i * 78.233) * 43758.5453) % 1 + 1) % 1 * size;
    const r = i % 9 === 0 ? 2.4 : 0.8 + (i % 3) * 0.45;
    ctx.fillStyle = i % 5 === 0 ? accentHex : '#ffffff';
    ctx.globalAlpha = 0.35 + (i % 5) * 0.13;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    if (i % 18 === 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(sx - 6, sy);
      ctx.lineTo(sx + 6, sy);
      ctx.moveTo(sx, sy - 6);
      ctx.lineTo(sx, sy + 6);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function createSequinTexture(
  primaryHex: string,
  secondaryHex: string,
  accentHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, size, size);

  const step = 16;
  for (let row = 0; row < size / step; row++) {
    for (let col = 0; col < size / step; col++) {
      const cx = col * step + (row % 2 === 0 ? 0 : step * 0.5);
      const cy = row * step;
      const pick = (row * 7 + col * 13) % 5;
      const color = pick === 0 ? accentHex : pick < 3 ? secondaryHex : primaryHex;
      const g = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, step * 0.52);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.35, color);
      g.addColorStop(1, '#09061a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, step * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createRunwayFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createRadialGradient(size / 2, size / 2, 40, size / 2, size / 2, size * 0.55);
  bg.addColorStop(0, '#1B1145');
  bg.addColorStop(0.45, '#0D0924');
  bg.addColorStop(1, '#05040E');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Concentric celestial rings
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.22)';
  ctx.lineWidth = 2;
  [140, 240, 340, 440].forEach((r, idx) => {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    if (idx % 2 === 1) ctx.setLineDash([8, 12]);
    else ctx.setLineDash([]);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Radial star spokes
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.14)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(size / 2 + Math.cos(a) * 140, size / 2 + Math.sin(a) * 140);
    ctx.lineTo(size / 2 + Math.cos(a) * 440, size / 2 + Math.sin(a) * 440);
    ctx.stroke();
  }

  // Scattered floor stardust
  for (let i = 0; i < 240; i++) {
    const x = ((Math.sin(i * 45.164) * 43758.5453) % 1 + 1) % 1 * size;
    const y = ((Math.sin(i * 93.719) * 43758.5453) % 1 + 1) % 1 * size;
    ctx.fillStyle = i % 4 === 0 ? 'rgba(253,230,138,0.45)' : 'rgba(167,139,250,0.3)';
    ctx.beginPath();
    ctx.arc(x, y, i % 6 === 0 ? 2 : 1, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(3, 2, 12, 0.72)');
  grad.addColorStop(0.55, 'rgba(8, 5, 24, 0.34)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSparkleSpriteTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  const glow = ctx.createRadialGradient(c, c, 2, c, c, c);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.25, 'rgba(240,171,252,0.85)');
  glow.addColorStop(0.6, 'rgba(99,102,241,0.22)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // 4-point star flare
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(c, 4);
  ctx.quadraticCurveTo(c + 5, c - 5, size - 4, c);
  ctx.quadraticCurveTo(c + 5, c + 5, c, size - 4);
  ctx.quadraticCurveTo(c - 5, c + 5, 4, c);
  ctx.quadraticCurveTo(c - 5, c - 5, c, 4);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createNikkiEyeTexture(
  irisHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size * 0.52;

  // Porcelain warm white sclera
  ctx.fillStyle = '#FFFDFD';
  ctx.fillRect(0, 0, size, size);

  // Subtle upper eyelid ambient shadow on sclera
  const scleraShadow = ctx.createLinearGradient(0, 0, 0, size * 0.45);
  scleraShadow.addColorStop(0, 'rgba(139, 92, 246, 0.24)');
  scleraShadow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = scleraShadow;
  ctx.fillRect(0, 0, size, size * 0.45);

  const irisRx = size * 0.31;
  const irisRy = size * 0.35;

  // Clip to oval anime iris
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, irisRx, irisRy, 0, 0, Math.PI * 2);
  ctx.clip();

  // Deep jewel/chestnut base + luminous lower bounce gradient
  const irisGrad = ctx.createLinearGradient(0, cy - irisRy, 0, cy + irisRy);
  irisGrad.addColorStop(0, '#22101A');
  irisGrad.addColorStop(0.35, irisHex);
  irisGrad.addColorStop(0.76, '#FBCFE8');
  irisGrad.addColorStop(1, '#FDE68A');
  ctx.fillStyle = irisGrad;
  ctx.fillRect(cx - irisRx, cy - irisRy, irisRx * 2, irisRy * 2);

  // Soft warm inner ring
  const glowGrad = ctx.createRadialGradient(cx, cy + irisRy * 0.2, 4, cx, cy + irisRy * 0.2, irisRx * 0.72);
  glowGrad.addColorStop(0, 'rgba(255, 232, 210, 0.35)');
  glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(cx - irisRx, cy - irisRy, irisRx * 2, irisRy * 2);

  // Radial iris spokes for depth
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * irisRx * 0.32, cy + Math.sin(a) * irisRy * 0.32);
    ctx.lineTo(cx + Math.cos(a) * irisRx * 0.92, cy + Math.sin(a) * irisRy * 0.92);
    ctx.stroke();
  }

  // Deep pupil
  ctx.fillStyle = '#1E0D1B';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, irisRx * 0.4, irisRy * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tiny 4-point star sparkle in lower iris (classic Nikki anime shimmer)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  const sx = cx;
  const sy = cy + irisRy * 0.56;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 10);
  ctx.lineTo(sx + 3, sy - 3);
  ctx.lineTo(sx + 10, sy);
  ctx.lineTo(sx + 3, sy + 3);
  ctx.lineTo(sx, sy + 10);
  ctx.lineTo(sx - 3, sy + 3);
  ctx.lineTo(sx - 10, sy);
  ctx.lineTo(sx - 3, sy - 3);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Dark limbal outer ring
  ctx.strokeStyle = '#2A1424';
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, irisRx, irisRy, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Large glossy upper-right anime catchlight + smaller lower-left reflection
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(cx + irisRx * 0.45, cy - irisRy * 0.42, 18, 14, -0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx - irisRx * 0.42, cy + irisRy * 0.28, 7, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createBlushTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  const grad = ctx.createRadialGradient(c, c, 4, c, c, size * 0.48);
  grad.addColorStop(0, 'rgba(255, 134, 168, 0.58)');
  grad.addColorStop(0.55, 'rgba(255, 160, 188, 0.24)');
  grad.addColorStop(1, 'rgba(255, 180, 200, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLaceTrimTexture(
  accentHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // Delicate translucent silk band
  const bandGrad = ctx.createLinearGradient(0, 0, 0, h);
  bandGrad.addColorStop(0, 'rgba(255,255,255,0.65)');
  bandGrad.addColorStop(0.65, 'rgba(245,235,255,0.45)');
  bandGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bandGrad;

  const scallops = 12;
  const step = w / scallops;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, h * 0.55);
  for (let i = scallops - 1; i >= 0; i--) {
    const cx = (i + 0.5) * step;
    ctx.quadraticCurveTo(cx, h * 1.02, i * step, h * 0.55);
  }
  ctx.closePath();
  ctx.fill();

  // Scallop gold/lace embroidery outline + tiny pearl dots
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < scallops; i++) {
    const x0 = i * step;
    const cx = (i + 0.5) * step;
    const x1 = (i + 1) * step;
    ctx.moveTo(x0, h * 0.55);
    ctx.quadraticCurveTo(cx, h * 0.96, x1, h * 0.55);
  }
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  for (let i = 0; i < scallops; i++) {
    const cx = (i + 0.5) * step;
    ctx.beginPath();
    ctx.arc(cx, h * 0.42, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(3, 1);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createCasualCrownTeeTexture(
  primaryHex: string,
  secondaryHex: string,
  accentHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Soft cotton base gradient (crisp studio white / chosen primary tint)
  const bg = ctx.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, primaryHex);
  bg.addColorStop(0.75, primaryHex);
  bg.addColorStop(1, secondaryHex === '#F9A8D4' ? '#F8FAFC' : secondaryHex);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Subtle cotton weave shading
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Front chest graphic centered at u = 0.5 (tee mesh is rotated PI on Y)
  const cx = size * 0.5;
  const cy = size * 0.34;

  // Arched MIRACLE NIKKI typography
  const ink = accentHex === '#FDE68A' ? '#334155' : accentHex;
  ctx.save();
  ctx.fillStyle = ink;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = 'MIRACLE NIKKI';
  const radius = 58;
  for (let i = 0; i < label.length; i++) {
    const frac = i / (label.length - 1) - 0.5;
    const ang = frac * 1.35 - Math.PI / 2;
    const tx = cx + Math.cos(ang) * radius;
    const ty = cy + 10 + Math.sin(ang) * radius;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillText(label[i], 0, 0);
    ctx.restore();
  }

  // Signature Nikki Royal Crown silhouette
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(cx - 32, cy + 28);
  ctx.lineTo(cx - 42, cy - 10);
  ctx.lineTo(cx - 18, cy + 8);
  ctx.lineTo(cx, cy - 22);
  ctx.lineTo(cx + 18, cy + 8);
  ctx.lineTo(cx + 42, cy - 10);
  ctx.lineTo(cx + 32, cy + 28);
  ctx.closePath();
  ctx.fill();

  // Crown base band + tiny pink star dots
  ctx.fillRect(cx - 34, cy + 32, 68, 7);
  [cx - 42, cx, cx + 42].forEach((px, idx) => {
    ctx.beginPath();
    ctx.arc(px, idx === 1 ? cy - 27 : cy - 15, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createHosieryTexture(
  style: 'sheer-white' | 'galaxy-stockings' | 'lace-thighhigh',
  accentHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  if (style === 'sheer-white') {
    ctx.fillStyle = 'rgba(255, 250, 254, 0.72)';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(0, 0, size, 22);
  } else if (style === 'galaxy-stockings') {
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, 'rgba(30, 27, 75, 0.86)');
    grad.addColorStop(0.5, 'rgba(76, 29, 149, 0.78)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 65; i++) {
      const sx = ((Math.sin(i * 19.3) * 43758.5) % 1 + 1) % 1 * size;
      const sy = ((Math.sin(i * 71.7) * 43758.5) % 1 + 1) % 1 * size;
      ctx.fillStyle = i % 3 === 0 ? accentHex : '#FFFFFF';
      ctx.beginPath();
      ctx.arc(sx, sy, i % 6 === 0 ? 2.6 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // lace-thighhigh
    ctx.fillStyle = 'rgba(24, 16, 48, 0.82)';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(244, 114, 182, 0.9)';
    ctx.fillRect(0, 0, size, 26);
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= size; x += 32) {
      ctx.arc(x + 16, 26, 12, 0, Math.PI);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}
