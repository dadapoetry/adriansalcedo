// Capa WebGL opcional del rotlle: paper amb fibra, cilindres a les vores i
// tinta que es dissol a la portada. El text real continua sent DOM.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';

const PAPER = 'vec3(0.949, 0.937, 0.906)';
const INK = 'vec3(0.071, 0.067, 0.059)';

export function createPaper(canvas, { width, height, title } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);

  let w = width || window.innerWidth;
  let h = height || window.innerHeight;
  const camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100);
  camera.position.z = 10;
  const scene = new THREE.Scene();

  const paperMat = new THREE.ShaderMaterial({
    uniforms: {
      uResolution: { value: new THREE.Vector2(w, h) },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec2 uResolution;
      uniform vec2 uPointer;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec2 px = vUv * uResolution;
        float grain = hash(floor(px * 0.75)) - 0.5;
        float fiber = sin(px.y * 0.9 + hash(floor(px * 0.02)) * 6.28) * 0.0035;
        vec3 col = ${PAPER} + grain * 0.014 + fiber;
        col += exp(-distance(vUv, uPointer) * 3.0) * 0.012;
        float edge = min(vUv.x, 1.0 - vUv.x);
        col -= (1.0 - smoothstep(0.0, 0.055, edge)) * 0.055;
        col += smoothstep(0.045, 0.065, edge) * (1.0 - smoothstep(0.065, 0.09, edge)) * 0.01;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), paperMat);
  sheet.position.z = -5;
  scene.add(sheet);

  const radius = 34;
  const rollMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      void main() {
        float shade = 0.72 + 0.28 * clamp(vNormal.x * 0.8 + 0.4, 0.0, 1.0);
        float seam = 1.0 - smoothstep(0.0, 0.015, abs(fract(vUv.x) - 0.5));
        vec3 col = ${PAPER} * shade - seam * 0.06;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const left = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 28, 1, true), rollMat);
  const right = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 28, 1, true), rollMat);
  scene.add(left, right);

  const inkMat = new THREE.ShaderMaterial({
    uniforms: { uProgress: { value: 0 }, uDpr: { value: dpr } },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute vec3 aSeed;
      uniform float uProgress;
      uniform float uDpr;
      varying float vFade;
      void main() {
        vec3 p = position + vec3(aSeed.xy * 90.0, 0.0) * uProgress;
        p.y -= uProgress * uProgress * 60.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = 2.4 * uDpr * (1.0 - uProgress * 0.55);
        vFade = min(1.0, uProgress * (1.0 - uProgress) * 4.0);
      }
    `,
    fragmentShader: `
      varying float vFade;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(${INK}, vFade * (1.0 - d * 1.6));
      }
    `
  });
  let ink = null;

  function buildInk() {
    if (!title) return;
    const rect = title.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(rect.width);
    cv.height = Math.ceil(rect.height);
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#000';
    for (const span of title.querySelectorAll('span')) {
      const r = span.getBoundingClientRect();
      const cs = getComputedStyle(span);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(span.textContent, r.left - rect.left, r.top - rect.top + parseFloat(cs.fontSize) * 0.82);
    }
    const pixels = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const positions = [];
    const seeds = [];
    for (let y = 0; y < cv.height; y += 3) {
      for (let x = 0; x < cv.width; x += 3) {
        if (pixels[(y * cv.width + x) * 4 + 3] < 128) continue;
        positions.push(x + rect.left - w / 2, h / 2 - y - rect.top, 0);
        const a = Math.random() * Math.PI * 2;
        seeds.push(Math.cos(a), Math.sin(a), Math.random());
      }
    }
    if (ink) {
      scene.remove(ink);
      ink.geometry.dispose();
      ink = null;
    }
    if (!positions.length) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 3));
    ink = new THREE.Points(geometry, inkMat);
    ink.position.z = 1;
    ink.visible = false;
    scene.add(ink);
  }

  function resize(nextW, nextH) {
    w = nextW || window.innerWidth;
    h = nextH || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
    sheet.scale.set(w, h, 1);
    paperMat.uniforms.uResolution.value.set(w, h);
    for (const roll of [left, right]) {
      roll.scale.y = h + 8;
      roll.position.x = (roll === left ? -1 : 1) * (w / 2 - radius * 0.28);
    }
    buildInk();
  }

  window.addEventListener('pointermove', (event) => {
    paperMat.uniforms.uPointer.value.set(event.clientX / w, 1 - event.clientY / h);
  }, { passive: true });

  resize(w, h);

  return {
    resize,
    update(current) {
      left.rotation.y = current / radius;
      right.rotation.y = -current / radius;
      if (ink) {
        const progress = Math.min(1, Math.max(0, current / (w * 0.6)));
        inkMat.uniforms.uProgress.value = progress;
        ink.visible = progress > 0 && progress < 1;
        const base = parseFloat(title.style.opacity);
        title.style.opacity = ((Number.isFinite(base) ? base : 1) * (1 - progress)).toFixed(3);
      }
      renderer.render(scene, camera);
    }
  };
}
