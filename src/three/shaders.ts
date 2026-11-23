import * as THREE from 'three';

export function createGalaxySkyboxMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uPrimary: { value: new THREE.Color('#070516') },
      uNebulaA: { value: new THREE.Color('#4C1D95') },
      uNebulaB: { value: new THREE.Color('#C026D3') },
      uNebulaC: { value: new THREE.Color('#0EA5E9') },
    },
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uPrimary;
      uniform vec3 uNebulaA;
      uniform vec3 uNebulaB;
      uniform vec3 uNebulaC;
      varying vec3 vWorldDir;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
        );
      }

      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p = p * 2.05 + vec3(0.15);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float horizon = smoothstep(-0.35, 0.75, dir.y);
        vec3 col = mix(uPrimary * 0.65, uPrimary, horizon);

        float n1 = fbm(dir * 2.6 + vec3(uTime * 0.015, -uTime * 0.01, 0.0));
        float n2 = fbm(dir * 4.2 - vec3(0.0, uTime * 0.02, uTime * 0.012));

        float band = exp(-pow((dir.y - 0.18 + sin(dir.x * 2.2) * 0.22) * 2.8, 2.0));
        col += uNebulaA * smoothstep(0.35, 0.85, n1) * (0.4 + 0.6 * band);
        col += uNebulaB * smoothstep(0.52, 0.92, n2) * band * 0.55;
        col += uNebulaC * smoothstep(0.58, 0.95, n1 * n2 * 1.8) * 0.45;

        // Luminous silver-lavender Moon & halo bloom in the night sky backdrop
        vec3 moonDir = normalize(vec3(0.26, 0.34, -0.90));
        float moonDot = max(0.0, dot(dir, moonDir));
        float moonDisc = smoothstep(0.991, 0.9935, moonDot);
        float moonInnerHalo = pow(moonDot, 42.0) * 0.52;
        float moonOuterHalo = pow(moonDot, 8.0) * 0.16;
        vec3 moonGlow = vec3(0.92, 0.93, 1.0) * (moonDisc * 0.92 + moonInnerHalo)
                      + vec3(0.74, 0.62, 0.98) * moonOuterHalo;
        col += moonGlow;

        // Crisp procedural twinkling starfield
        vec3 starCell = floor(dir * 165.0);
        float starRnd = hash(starCell);
        if (starRnd > 0.974) {
          float twinkle = 0.55 + 0.45 * sin(uTime * (2.5 + starRnd * 5.0) + starRnd * 40.0);
          float brightness = smoothstep(0.974, 1.0, starRnd) * twinkle;
          vec3 starColor = mix(vec3(0.88, 0.92, 1.0), vec3(1.0, 0.90, 0.72), fract(starRnd * 73.1));
          col += starColor * brightness * 1.5;
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

export function createAmbientSparkleField(count = 280): {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  dispose: () => void;
} {
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const palette = [
    new THREE.Color('#FDE68A'),
    new THREE.Color('#F0ABFC'),
    new THREE.Color('#67E8F9'),
    new THREE.Color('#C4B5FD'),
    new THREE.Color('#FFFFFF'),
  ];

  for (let i = 0; i < count; i++) {
    const radius = 1.4 + Math.random() * 5.8;
    const angle = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.15 + Math.random() * 4.4;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    scales[i] = 0.6 + Math.random() * 1.8;
    phases[i] = Math.random() * Math.PI * 2;

    const c = palette[i % palette.length];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uPixelRatio: { value: 1.0 },
    },
    vertexShader: `
      attribute float aScale;
      attribute float aPhase;
      attribute vec3 aColor;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = aColor;
        vec3 pos = position;
        pos.y += sin(uTime * 0.8 + aPhase) * 0.18;
        pos.x += cos(uTime * 0.45 + aPhase) * 0.08;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float twinkle = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * 2.8 + aPhase * 3.0), 2.0);
        vAlpha = twinkle;
        gl_PointSize = aScale * (22.0 * uPixelRatio) / max(1.0, -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform float uIntensity;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;

        // 4-point cosmic star sparkle shape
        float crossX = exp(-abs(uv.y) * 18.0) * exp(-abs(uv.x) * 4.5);
        float crossY = exp(-abs(uv.x) * 18.0) * exp(-abs(uv.y) * 4.5);
        float core = exp(-d * 9.0);
        float spark = clamp(core + (crossX + crossY) * 0.85, 0.0, 1.0);

        gl_FragColor = vec4(vColor, spark * vAlpha * uIntensity);
      }
    `,
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;

  return {
    points,
    material,
    dispose: () => {
      geo.dispose();
      material.dispose();
    },
  };
}
