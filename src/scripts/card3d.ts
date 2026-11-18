/**
 * Tarjeta Capta Card en 3D (Three.js).
 *
 * Cuerpo con grosor real y esquinas redondeadas (proporción ISO 85.6 × 54 mm),
 * frente y reverso texturizados con los SVG de la marca, acabado con brillo y
 * luces verdes que retoman las luciérnagas de la identidad.
 *
 * Se monta sobre un contenedor que ya muestra la versión plana; si WebGL falla,
 * la función devuelve null y la versión plana sigue visible.
 */
import {
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  NoToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export interface Card3D {
  /** Gira la tarjeta para mostrar el otro lado. Devuelve true si queda el reverso. */
  flip(): boolean;
  /** Inclinación con el mouse, de -0.5 a 0.5 en cada eje. */
  tilt(x: number, y: number): void;
  isBack(): boolean;
  destroy(): void;
}

interface Options {
  front: string;
  back: string;
  /** Se llama cuando el usuario gira la tarjeta arrastrando. */
  onSideChange?: (isBack: boolean) => void;
}

const CARD_W = 3.2;
const CARD_H = CARD_W * (54 / 85.6);
const CARD_DEPTH = 0.028;
const CORNER = CARD_W * (3.18 / 85.6);
/** El lienzo es más grande que la tarjeta para que al girar no se recorte. */
const CANVAS_SCALE = 1.5;

function roundedRect(w: number, h: number, r: number) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Cara plana con UV normalizadas a 0–1 para que la textura cubra toda la tarjeta. */
function faceGeometry(shape: Shape) {
  const geo = new ShapeGeometry(shape, 12);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / CARD_W + 0.5, pos.getY(i) / CARD_H + 0.5);
  }
  uv.needsUpdate = true;
  return geo;
}

/**
 * Rasteriza el SVG a un lienzo con la proporción exacta de la tarjeta
 * (recorte tipo "cover", sin deformar) y alta resolución para que se vea nítido.
 */
async function svgTexture(url: string, maxAnisotropy: number) {
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();

  const width = 2048;
  const height = Math.round(width * (CARD_H / CARD_W));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sin contexto 2D");

  const srcW = img.naturalWidth || 482;
  const srcH = img.naturalHeight || 300;
  const scale = Math.max(width / srcW, height / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  ctx.drawImage(img, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export async function createCard3D(container: HTMLElement, options: Options): Promise<Card3D | null> {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  // Sin tone mapping: los colores de marca del SVG se mantienen fieles
  renderer.toneMapping = NoToneMapping;

  const canvas = renderer.domElement;
  canvas.className = "card3d-canvas";
  canvas.setAttribute("aria-hidden", "true");

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // El entorno solo da reflejo al canto; las caras no lo usan para no velar el diseño

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);

  // Luces: una principal cálida, relleno suave y dos verdes como luciérnagas
  scene.add(new AmbientLight(0xffffff, 0.08));
  const key = new DirectionalLight(0xffffff, 0.7);
  key.position.set(2.5, 3, 4);
  scene.add(key);
  const greenLeft = new PointLight(0x4ade80, 3, 8);
  greenLeft.position.set(-2.6, -1.2, 1.8);
  scene.add(greenLeft);
  const limeRight = new PointLight(0xa3e635, 2, 8);
  limeRight.position.set(2.4, 1.4, 1.6);
  scene.add(limeRight);

  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  let frontMap: CanvasTexture;
  let backMap: CanvasTexture;
  try {
    [frontMap, backMap] = await Promise.all([
      svgTexture(options.front, anisotropy),
      svgTexture(options.back, anisotropy),
    ]);
  } catch {
    renderer.dispose();
    return null;
  }

  const shape = roundedRect(CARD_W, CARD_H, CORNER);
  const card = new Group();

  // Cuerpo: canto verde oscuro con un ligero bisel
  const bodyGeo = new ExtrudeGeometry(shape, {
    depth: CARD_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 16,
  });
  bodyGeo.translate(0, 0, -CARD_DEPTH / 2);
  const bodyMat = new MeshPhysicalMaterial({
    envMap: envTexture,
    envMapIntensity: 0.6,
    color: 0x123d27,
    roughness: 0.35,
    metalness: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.25,
  });
  card.add(new Mesh(bodyGeo, bodyMat));

  const faceGeo = faceGeometry(shape);
  const faceMaterial = (map: CanvasTexture) =>
    new MeshPhysicalMaterial({
      // El diseño se "emite" tal cual (colores exactos del SVG) y la superficie
      // negra solo aporta los brillos especulares de las luces.
      color: 0x000000,
      emissive: 0xffffff,
      emissiveMap: map,
      emissiveIntensity: 1,
      roughness: 0.32,
      metalness: 0,
      specularIntensity: 0.6,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
    });

  const frontMat = faceMaterial(frontMap);
  const front = new Mesh(faceGeo, frontMat);
  front.position.z = CARD_DEPTH / 2 + 0.0045;
  card.add(front);

  const backMat = faceMaterial(backMap);
  const back = new Mesh(faceGeo, backMat);
  back.rotation.y = Math.PI;
  back.position.z = -(CARD_DEPTH / 2 + 0.0045);
  card.add(back);

  scene.add(card);

  // ── Tamaño: la tarjeta ocupa el mismo ancho que la versión plana ──
  const resize = () => {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, rect.width * CANVAS_SCALE);
    const h = Math.max(1, rect.height * CANVAS_SCALE);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const visibleWidth = CARD_W * CANVAS_SCALE;
    const visibleHeight = visibleWidth / camera.aspect;
    camera.position.set(0, 0, visibleHeight / 2 / Math.tan(MathUtils.degToRad(camera.fov / 2)));
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  container.appendChild(canvas);

  // ── Estado de rotación ──
  let side = 0; // 0 = frente, 1 = reverso
  let dragOffset = 0;
  let tiltX = 0;
  let tiltY = 0;
  let rotY = 0;
  let rotX = 0;

  const targetY = () => side * Math.PI + dragOffset;

  // Arrastrar para girar (horizontal); el desplazamiento vertical sigue haciendo scroll
  let dragStartX = 0;
  let dragging = false;
  let moved = false;
  let suppressClick = false;

  const onPointerDown = (event: PointerEvent) => {
    dragging = true;
    moved = false;
    dragStartX = event.clientX;
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return;
    const dx = event.clientX - dragStartX;
    if (Math.abs(dx) > 6 && !moved) {
      moved = true;
      try {
        container.setPointerCapture(event.pointerId);
      } catch {
        /* sin captura el arrastre sigue funcionando dentro de la tarjeta */
      }
    }
    if (moved) dragOffset = (dx / container.clientWidth) * Math.PI;
  };
  const onPointerUp = () => {
    if (!dragging) return;
    dragging = false;
    if (!moved) return;
    // Basta con girar un 30 % para pasar al otro lado; si no, regresa
    const turns = dragOffset / Math.PI;
    const step = Math.abs(turns) > 0.3 ? Math.sign(turns) * Math.max(1, Math.round(Math.abs(turns))) : 0;
    side += step;
    dragOffset -= step * Math.PI;
    suppressClick = true;
    options.onSideChange?.(isBack());
  };
  // Evita que el clic que termina un arrastre voltee la tarjeta otra vez
  const onClickCapture = (event: MouseEvent) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.stopImmediatePropagation();
    event.preventDefault();
  };

  container.addEventListener("pointerdown", onPointerDown);
  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("pointerup", onPointerUp);
  container.addEventListener("pointercancel", onPointerUp);
  container.addEventListener("click", onClickCapture, true);
  const preventNativeDrag = (event: DragEvent) => event.preventDefault();
  container.addEventListener("dragstart", preventNativeDrag);

  // ── Bucle de render: solo cuando la tarjeta está en pantalla ──
  let visible = true;
  let frame = 0;
  const start = performance.now();

  const render = (now: number) => {
    frame = 0;
    const t = (now - start) / 1000;

    if (!dragging) dragOffset *= 0.86;
    const idleY = Math.sin(t * 0.45) * 0.22;
    const idleX = Math.sin(t * 0.35) * 0.06;
    const goalY = targetY() + idleY + tiltX * 0.5;
    const goalX = idleX - tiltY * 0.35;

    rotY += (goalY - rotY) * (dragging ? 0.35 : 0.08);
    rotX += (goalX - rotX) * 0.08;
    card.rotation.set(rotX, rotY, 0);
    card.position.y = Math.sin(t * 0.8) * 0.03;

    renderer.render(scene, camera);
    if (visible && !document.hidden) frame = requestAnimationFrame(render);
  };

  const kick = () => {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render);
  };

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    kick();
  });
  intersection.observe(container);
  document.addEventListener("visibilitychange", kick);
  kick();

  function isBack() {
    return Math.abs(side) % 2 === 1;
  }

  return {
    flip() {
      side += 1;
      kick();
      return isBack();
    },
    tilt(x, y) {
      tiltX = x;
      tiltY = y;
    },
    isBack,
    destroy() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", kick);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      container.removeEventListener("click", onClickCapture, true);
      container.removeEventListener("dragstart", preventNativeDrag);
      [bodyGeo, faceGeo].forEach((g) => g.dispose());
      [bodyMat, frontMat, backMat].forEach((m) => m.dispose());
      [frontMap, backMap, envTexture].forEach((tx) => tx.dispose());
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
