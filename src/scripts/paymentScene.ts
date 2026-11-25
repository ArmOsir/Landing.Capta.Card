/**
 * Escena del pago sin contacto de la sección "Paga con un toque",
 * controlada por el scroll.
 *
 * Guion (p = avance del scroll dentro de la sección, 0 → 1):
 *   0.00–0.15  La terminal sube entre luciérnagas; la pantalla pide la tarjeta.
 *   0.14–0.42  La Capta Card entra girando y se acerca a la terminal.
 *   0.42–0.56  Toca la pantalla: ondas de lectura y barra de progreso.
 *   0.53–0.72  "Pago aprobado": destello verde, hojas que brotan y ticket impreso.
 *   0.52–1.00  La tarjeta se retira y se queda flotando junto a la terminal.
 *
 * El avance se suaviza para que la cámara se sienta como un travelling y no
 * dé saltos con la rueda del mouse. El lienzo es transparente: el fondo lo
 * pone el CSS de la sección.
 */
import {
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  DoubleSide,
  Euler,
  InstancedMesh,
  MathUtils,
  MeshBasicMaterial,
  NoToneMapping,
  Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Points,
  PointsMaterial,
  Quaternion,
  Scene,
  Shape,
  ShapeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildCard, svgTexture } from "./card3d";
import { buildTerminal, FRONT_Z } from "./terminal3d";
import { buildPhone, type Phone3D } from "./phone3d";

export interface PaymentScene {
  destroy(): void;
}

interface Options {
  front: string;
  back: string;
  /** Avance real del scroll, 0–1. */
  getProgress(): number;
  /** Se llama en cada frame con el avance suavizado (para sincronizar textos). */
  onFrame?(p: number): void;
  /** Qué se acerca a la terminal: la tarjeta (por defecto) o un celular con Wallet. */
  device?: "card" | "phone";
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
/** Avance 0–1 (con easing) dentro del tramo [a, b]. */
const seg = (p: number, a: number, b: number, ease = easeInOut) => ease(clamp01((p - a) / (b - a)));

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.75)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

function leafShape() {
  const s = new Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(0.34, -0.22, 0.3, 0.28, 0, 0.5);
  s.bezierCurveTo(-0.3, 0.28, -0.34, -0.22, 0, -0.5);
  return s;
}

export async function createPaymentScene(stage: HTMLElement, options: Options): Promise<PaymentScene | null> {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const small = window.matchMedia("(max-width: 720px)").matches;
  // Resolución de render contenida: la escena es suave y no necesita la
  // densidad completa de pantallas retina (es lo que más consume en GPU)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.25 : 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NoToneMapping;
  const canvas = renderer.domElement;
  canvas.className = "tap__canvas";
  canvas.setAttribute("aria-hidden", "true");

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new PerspectiveCamera(35, 1, 0.1, 80);

  // ── Luces ──
  scene.add(new AmbientLight(0xffffff, 0.35));
  const key = new DirectionalLight(0xffffff, 0.9);
  key.position.set(3, 4, 6);
  scene.add(key);
  const rimGreen = new PointLight(0x4ade80, 6, 12);
  rimGreen.position.set(-3, 1.5, 1.5);
  scene.add(rimGreen);
  const rimLime = new PointLight(0xa3e635, 3, 10);
  rimLime.position.set(3, -1, 2.5);
  scene.add(rimLime);
  const flash = new PointLight(0x4ade80, 0, 6);
  scene.add(flash);

  // ── Terminal ──
  const terminal = buildTerminal(env);
  scene.add(terminal.group);

  // ── Tarjeta ──
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  let frontMap, backMap;
  try {
    await document.fonts?.ready;
    [frontMap, backMap] = await Promise.all([
      // En la escena la tarjeta nunca ocupa más de ~600 px: 1024 px basta
      svgTexture(options.front, anisotropy, 1024),
      svgTexture(options.back, anisotropy, 1024),
    ]);
  } catch {
    terminal.dispose();
    renderer.dispose();
    return null;
  }
  const card = buildCard(frontMap, backMap, env);
  // Con device "phone" se acerca un celular con la Capta Card en su Wallet
  const usePhone = options.device === "phone";
  let phone: Phone3D | null = null;
  if (usePhone) {
    try {
      phone = buildPhone(env, await loadImage(options.front));
      scene.add(phone.group);
    } catch {
      phone = null;
    }
  }
  if (!phone) scene.add(card.group);
  // Un celular mide alrededor del 80% del alto de la terminal
  const CARD_SCALE = phone ? 1.25 : 0.6;
  // El celular es más alto que la tarjeta: toca la terminal un poco más abajo
  const touchY = phone ? -0.45 : 0.05;
  const touchX = phone ? 0.5 : 0;
  const spinTurns = phone ? 2 : 3;

  // ── Luciérnagas ──
  const FIREFLIES = small ? 70 : 140;
  const ffBase = new Float32Array(FIREFLIES * 3);
  const ffSeed = new Float32Array(FIREFLIES);
  for (let i = 0; i < FIREFLIES; i++) {
    ffBase[i * 3] = MathUtils.randFloatSpread(16);
    ffBase[i * 3 + 1] = MathUtils.randFloat(-4.5, 5);
    ffBase[i * 3 + 2] = MathUtils.randFloat(-7, 3.5);
    ffSeed[i] = Math.random() * 100;
  }
  const ffGeo = new BufferGeometry();
  const ffPos = new BufferAttribute(new Float32Array(ffBase), 3);
  ffGeo.setAttribute("position", ffPos);
  const glow = glowTexture();
  const ffMat = new PointsMaterial({
    color: 0xa3e635,
    map: glow,
    size: 0.16,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });
  scene.add(new Points(ffGeo, ffMat));

  // ── Hojas que brotan al aprobarse el pago ──
  const LEAVES = small ? 22 : 36;
  const leafGeo = new ShapeGeometry(leafShape(), 6);
  const leafMat = new MeshBasicMaterial({ side: DoubleSide, toneMapped: false, transparent: true });
  const leaves = new InstancedMesh(leafGeo, leafMat, LEAVES);
  const palette = [new Color(0x4ade80), new Color(0xa3e635), new Color(0x22c55e), new Color(0x7dc242)];
  const leafData = Array.from({ length: LEAVES }, (_, i) => {
    const theta = Math.random() * Math.PI * 2;
    const up = Math.random() * 0.9 + 0.1;
    leaves.setColorAt(i, palette[i % palette.length]);
    return {
      dir: new Vector3(Math.cos(theta) * (1 - up * 0.5), up, Math.sin(theta) * 0.6 + 0.7).normalize(),
      speed: MathUtils.randFloat(1.6, 3.4),
      size: MathUtils.randFloat(0.12, 0.26),
      spin: new Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
    };
  });
  leaves.frustumCulled = false;
  scene.add(leaves);
  const dummy = new Object3D();

  // ── Cámara: recorrido suave por puntos clave (uno cada 0.2 de avance) ──
  const camPath = new CatmullRomCurve3(
    [
      new Vector3(1.2, 1.4, 10.5),
      new Vector3(-1.6, 0.5, 7.2),
      new Vector3(-2.2, 1.2, 6.6),
      new Vector3(-0.8, 0.8, 7.0),
      new Vector3(0.6, 0.3, 7.4),
      new Vector3(0, 0, 8),
    ],
    false,
    "centripetal",
  );
  const lookPath = new CatmullRomCurve3(
    [
      new Vector3(0, 0.2, 0),
      new Vector3(0.1, 0.3, 0),
      new Vector3(0.2, 0.7, 0),
      new Vector3(0, 0.6, 0),
      new Vector3(0, 0.1, 0),
      new Vector3(0, 0, 0),
    ],
    false,
    "centripetal",
  );

  // ── Poses de la tarjeta ──
  const q = (x: number, y: number, z: number) => new Quaternion().setFromEuler(new Euler(x, y, z));
  const poseA = { pos: new Vector3(4.8, -1.4, 2.6), quat: q(0.5, -2.4, 0.5) };
  const poseB = { pos: new Vector3(1.5, 0.9, 1.7), quat: q(0.1, -0.9, 0.15) };
  const poseE = { pos: new Vector3(1.05, -1.0, 1.5), quat: q(-0.08, -0.3, -0.1) };
  // El celular viaja más cerca del plano de la terminal: si pasa junto a la
  // cámara se ve más grande que ella
  if (phone) poseA.pos.set(4.2, -1.2, 0.8);
  const hoverLocal = new Vector3(touchX, terminal.screenY + touchY, FRONT_Z + 0.75);
  const touchLocal = new Vector3(touchX, terminal.screenY + touchY, FRONT_Z + 0.3);
  const tmpV = new Vector3();
  const tmpV2 = new Vector3();
  const tmpQ = new Quaternion();
  const spinQ = new Quaternion();
  const yAxis = new Vector3(0, 1, 0);
  const lookTarget = new Vector3();
  const frame = new Vector3();
  const tilt = q(0, 0, 0.08);

  // ── Tamaño ──
  let distScale = 1;
  const resize = () => {
    const W = Math.max(1, stage.clientWidth);
    const H = Math.max(1, stage.clientHeight);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // En pantallas verticales la cámara se aleja para que quepa la terminal
    // y la tarjeta se queda más cerca del centro para no salirse por el lado
    const portrait = camera.aspect < 1;
    distScale = portrait ? Math.min(2, 0.95 / camera.aspect) : 1;
    poseB.pos.x = portrait ? 0.9 : 1.5;
    if (phone) poseB.pos.set(portrait ? 0.9 : 1.6, 0.5, 0.8);
    // Al final la tarjeta queda junto a la parte baja de la terminal (o debajo en móvil)
    poseE.pos.set(portrait ? 0.5 : 1.05, portrait ? -0.9 : -1.0, portrait ? 2.1 : 1.5);
    // El celular es más alto: se queda un poco más arriba para no salirse del cuadro
    if (phone) poseE.pos.set(portrait ? 0.6 : 1.3, portrait ? -0.4 : -0.25, portrait ? 0.9 : 0.5);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();
  stage.prepend(canvas);

  // Compila los shaders antes del primer cuadro, en paralelo si el navegador
  // lo permite, para que la página no se congele al aparecer la escena.
  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    /* si no está disponible, se compilan en el primer render */
  }

  // ── Bucle ──
  let sp = options.getProgress();
  let raf = 0;
  let visible = true;
  let last = performance.now();
  const t0 = last;
  let skip = false;

  const render = (now: number) => {
    raf = 0;
    // Sin scroll en curso, la escena solo tiene movimientos suaves de fondo:
    // basta con la mitad de cuadros (ahorra CPU/GPU y batería)
    const settled = Math.abs(options.getProgress() - sp) < 0.0004;
    skip = settled ? !skip : false;
    if (skip) {
      if (visible && !document.hidden) raf = requestAnimationFrame(render);
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = (now - t0) / 1000;
    const target = options.getProgress();
    // Saltos grandes (anclas, tecla Inicio) van directo, sin recorrer la escena
    if (Math.abs(target - sp) > 0.3) sp = target;
    sp += (target - sp) * (1 - Math.pow(0.0009, dt)); // suavizado independiente del framerate
    if (Math.abs(target - sp) < 0.0004) sp = target;
    const p = sp;
    const pulse = (Math.sin(time * 3) + 1) / 2;

    // Encuadre: en escritorio la terminal queda a la derecha (textos a la
    // izquierda); en móvil, arriba (textos abajo)
    if (camera.aspect >= 1) frame.set(-1.15, 0, 0);
    else frame.set(0, -1.1, 0);
    camPath.getPoint(p, tmpV);
    tmpV.z *= distScale;
    tmpV.x *= distScale > 1 ? 0.6 : 1;
    camera.position.copy(tmpV).add(frame);
    lookPath.getPoint(p, lookTarget).add(frame);
    camera.lookAt(lookTarget);

    // Terminal: sube al inicio y queda recargada hacia atrás, de tres cuartos,
    // para que se vea la impresora detrás del borde superior
    const enter = seg(p, 0, 0.15, easeOut);
    terminal.group.position.set(0, -1.8 * (1 - enter) + Math.sin(time * 0.8) * 0.02, 0);
    terminal.group.rotation.set(0.22 - 0.36 * enter, -0.9 + 1.25 * enter, 0);
    terminal.group.updateMatrixWorld();

    // Pantalla
    if (p < 0.45) terminal.setScreen("amount", 0, pulse);
    else if (p < 0.53) terminal.setScreen("reading", seg(p, 0.45, 0.53, (t) => t), 0);
    else terminal.setScreen("approved", seg(p, 0.53, 0.6, (t) => t), (Math.sin(time * 2.4) + 1) / 2);
    terminal.setEmblem(p < 0.53 ? pulse : 1);
    terminal.setWaves(seg(p, 0.42, 0.46) * (1 - seg(p, 0.52, 0.56)), time);
    terminal.setReceipt(seg(p, 0.56, 0.72));
    if (phone) {
      if (p < 0.45) phone.setState("idle");
      else if (p < 0.53) phone.setState("reading", seg(p, 0.45, 0.53, (t) => t));
      else phone.setState("done");
    }

    // Destello verde al aprobar
    const approve = seg(p, 0.53, 0.56) * (1 - seg(p, 0.6, 0.7));
    terminal.group.localToWorld(flash.position.set(0, terminal.screenY, FRONT_Z + 0.6));
    flash.intensity = approve * 9;
    ffMat.size = 0.16 + approve * 0.08;

    // ── Tarjeta ──
    const g = phone ? phone.group : card.group;
    const termQ = terminal.group.quaternion;
    if (p < 0.32) {
      const t = seg(p, 0.14, 0.32);
      g.position.lerpVectors(poseA.pos, poseB.pos, t);
      g.quaternion.slerpQuaternions(poseA.quat, poseB.quat, t);
      // Giro de entrada: una vuelta y media que se detiene al llegar
      spinQ.setFromAxisAngle(yAxis, (1 - t) * Math.PI * spinTurns);
      g.quaternion.multiply(spinQ);
    } else if (p < 0.42) {
      const t = seg(p, 0.32, 0.42);
      terminal.group.localToWorld(tmpV.copy(hoverLocal));
      g.position.lerpVectors(poseB.pos, tmpV, t);
      tmpQ.copy(termQ).multiply(tilt);
      g.quaternion.slerpQuaternions(poseB.quat, tmpQ, t);
    } else if (p < 0.52) {
      // Acercar y tocar la pantalla
      const inT = seg(p, 0.42, 0.47);
      terminal.group.localToWorld(tmpV.copy(hoverLocal));
      terminal.group.localToWorld(tmpV2.copy(touchLocal));
      g.position.lerpVectors(tmpV, tmpV2, inT);
      // Pequeño "tap" al hacer contacto
      g.position.z += Math.sin(seg(p, 0.46, 0.5, (t) => t) * Math.PI) * -0.04;
      g.quaternion.copy(termQ).multiply(tilt);
    } else {
      // Se retira para dejar ver "Pago aprobado" y se queda flotando
      const t = seg(p, 0.52, 0.62);
      terminal.group.localToWorld(tmpV.copy(touchLocal));
      g.position.lerpVectors(tmpV, poseE.pos, t);
      tmpQ.copy(termQ).multiply(tilt);
      g.quaternion.slerpQuaternions(tmpQ, poseE.quat, t);
    }
    g.position.y += Math.sin(time * 0.9) * 0.03;
    g.scale.setScalar(CARD_SCALE);

    // ── Hojas ──
    const burst = clamp01((p - 0.53) / 0.22);
    leaves.visible = burst > 0 && burst < 1;
    if (leaves.visible) {
      terminal.group.localToWorld(tmpV.set(0, terminal.screenY, FRONT_Z + 0.2));
      const grow = Math.sin(Math.min(1, burst * 1.15) * Math.PI);
      leafData.forEach((leaf, i) => {
        dummy.position.copy(tmpV).addScaledVector(leaf.dir, easeOut(burst) * leaf.speed);
        dummy.position.y -= burst * burst * 0.9;
        dummy.rotation.set(leaf.spin.x * burst, leaf.spin.y * burst, leaf.spin.z * burst + i);
        dummy.scale.setScalar(leaf.size * Math.max(0.001, grow));
        dummy.updateMatrix();
        leaves.setMatrixAt(i, dummy.matrix);
      });
      leaves.instanceMatrix.needsUpdate = true;
    }

    // ── Luciérnagas a la deriva ──
    const arr = ffPos.array as Float32Array;
    for (let i = 0; i < FIREFLIES; i++) {
      const s = ffSeed[i];
      arr[i * 3] = ffBase[i * 3] + Math.sin(time * 0.3 + s) * 0.35;
      arr[i * 3 + 1] = ffBase[i * 3 + 1] + Math.sin(time * 0.45 + s * 1.3) * 0.3;
      arr[i * 3 + 2] = ffBase[i * 3 + 2] + Math.cos(time * 0.25 + s) * 0.3;
    }
    ffPos.needsUpdate = true;
    ffMat.opacity = 0.55 + 0.3 * Math.sin(time * 1.7) ** 2;

    renderer.render(scene, camera);
    options.onFrame?.(p);
    if (visible && !document.hidden) raf = requestAnimationFrame(render);
  };

  const kick = () => {
    if (!raf && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(render);
    }
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    kick();
  });
  io.observe(stage);
  document.addEventListener("visibilitychange", kick);
  kick();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", kick);
      card.dispose();
      phone?.dispose();
      terminal.dispose();
      [frontMap, backMap, env, glow].forEach((t) => t.dispose());
      [ffGeo, leafGeo].forEach((g) => g.dispose());
      [ffMat, leafMat].forEach((m) => m.dispose());
      leaves.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
