/**
 * Celular 3D (estilo smartphone moderno, sin logotipos ni interfaz de Apple)
 * con una pantalla de Wallet que muestra la Capta Card. La pantalla cambia
 * según el pago: lista para pagar → procesando → pago aprobado.
 *
 * Unidades: el celular mide 0.98 × 2.02, centrado en el origen, con la
 * pantalla hacia +Z (igual que la cara frontal de la tarjeta 3D).
 */
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  ShapeGeometry,
  SRGBColorSpace,
  Texture,
  type BufferGeometry,
  type Material,
} from "three";
import { roundedRect } from "./card3d";

export const PHONE_W = 0.98;
export const PHONE_H = 2.02;
const PHONE_D = 0.09;
const BEVEL = 0.025;
const SCREEN_W = 0.88;
const SCREEN_H = 1.92;
const PX_W = 440;
const PX_H = 960;
const FONT = '"DM Sans", "Figtree", system-ui, sans-serif';

export type PhoneState = "idle" | "reading" | "done";

/** Plano con esquinas redondeadas y UV de 0 a 1 (para que la textura no se deforme). */
function roundedPlane(w: number, h: number, r: number) {
  const geo = new ShapeGeometry(roundedRect(w, h, r), 16);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  }
  uv.needsUpdate = true;
  return geo;
}

function drawContactless(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = size * 0.09;
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 1 - i * 0.12;
    ctx.beginPath();
    ctx.arc(cx - size * 0.3, cy, size * (0.16 + i * 0.16), -Math.PI / 3.2, Math.PI / 3.2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Pantalla de Wallet: tarjeta Capta Card y el estado del pago. */
function drawScreen(ctx: CanvasRenderingContext2D, card: HTMLImageElement, state: PhoneState, p: number) {
  const W = PX_W;
  const H = PX_H;
  const cx = W / 2;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0f2a1b");
  bg.addColorStop(1, "#06140c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "middle";

  // Barra de estado
  ctx.fillStyle = "#e7efe9";
  ctx.font = `600 22px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("10:42", 40, 46);
  ctx.strokeStyle = "#e7efe9";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(W - 78, 36, 38, 19, 5);
  ctx.stroke();
  ctx.fillStyle = "#4ade80";
  ctx.fillRect(W - 75, 39, 28, 13);

  // Título
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText("Wallet", 36, 140);

  // Tarjeta
  const cw = W - 64;
  const ch = cw * (300 / 482);
  const x0 = 32;
  const y0 = 190;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  ctx.beginPath();
  ctx.roundRect(x0, y0, cw, ch, 20);
  ctx.fillStyle = "#123d27";
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x0, y0, cw, ch, 20);
  ctx.clip();
  ctx.drawImage(card, x0, y0, cw, ch);
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "#aab9b1";
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText("Capta Card · Mastercard", cx, y0 + ch + 40);

  const cy = 690;
  if (state === "idle") {
    ctx.fillStyle = "rgba(74,222,128,0.12)";
    ctx.beginPath();
    ctx.arc(cx, cy, 82, 0, Math.PI * 2);
    ctx.fill();
    drawContactless(ctx, cx + 14, cy, 110, "#4ade80");
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 30px ${FONT}`;
    ctx.fillText("Acerca a la terminal", cx, cy + 130);
  } else if (state === "reading") {
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, 62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#a3e635";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, 62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.04, p));
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 30px ${FONT}`;
    ctx.fillText("Procesando…", cx, cy + 130);
  } else {
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(cx, cy, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#062014";
    ctx.lineWidth = 15;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 2);
    ctx.lineTo(cx - 6, cy + 26);
    ctx.lineTo(cx + 32, cy - 22);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 34px ${FONT}`;
    ctx.fillText("Pago aprobado", cx, cy + 128);
    ctx.fillStyle = "#c2cec8";
    ctx.font = `500 24px ${FONT}`;
    ctx.fillText("$349.00 MXN", cx, cy + 170);
  }

  // Barra de inicio
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.roundRect(cx - 70, H - 26, 140, 7, 4);
  ctx.fill();
  ctx.textAlign = "left";
}

export function buildPhone(env: Texture, card: HTMLImageElement) {
  const group = new Group();
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const track = <G extends BufferGeometry>(g: G) => (geometries.push(g), g);
  const trackM = <M extends Material>(m: M) => (materials.push(m), m);

  // Cuerpo: marco de metal grafito con cantos redondeados
  const bodyGeo = track(
    new ExtrudeGeometry(roundedRect(PHONE_W, PHONE_H, 0.17), {
      depth: PHONE_D,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 6,
      curveSegments: 28,
    }),
  );
  bodyGeo.translate(0, 0, -PHONE_D / 2);
  const frame = trackM(
    new MeshPhysicalMaterial({
      color: 0x2b302d,
      envMap: env,
      envMapIntensity: 1,
      metalness: 0.75,
      roughness: 0.28,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
    }),
  );
  group.add(new Mesh(bodyGeo, frame));

  const faceZ = PHONE_D / 2 + BEVEL;

  // Cristal negro del frente y pantalla
  const glass = new Mesh(
    track(roundedPlane(PHONE_W - 0.02, PHONE_H - 0.02, 0.16)),
    trackM(new MeshPhysicalMaterial({ color: 0x050806, roughness: 0.08, clearcoat: 1, envMap: env, envMapIntensity: 0.8 })),
  );
  glass.position.z = faceZ + 0.001;
  group.add(glass);

  const canvas = document.createElement("canvas");
  canvas.width = PX_W;
  canvas.height = PX_H;
  const ctx = canvas.getContext("2d")!;
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  // La pantalla sigue la curva del cuerpo (radio interior)
  const screen = new Mesh(
    track(roundedPlane(SCREEN_W, SCREEN_H, 0.12)),
    trackM(new MeshBasicMaterial({ map: tex, toneMapped: false })),
  );
  screen.position.z = faceZ + 0.003;
  group.add(screen);

  // Isla de la cámara frontal
  const island = new Mesh(track(roundedPlane(0.24, 0.07, 0.035)), trackM(new MeshBasicMaterial({ color: 0x000000 })));
  island.position.set(0, SCREEN_H / 2 - 0.08, faceZ + 0.005);
  group.add(island);

  // Botones laterales
  const btnMat = frame;
  const sideBtn = new Mesh(track(new BoxGeometry(0.02, 0.26, 0.05)), btnMat);
  sideBtn.position.set(PHONE_W / 2 + BEVEL, 0.45, 0);
  group.add(sideBtn);
  const volUp = new Mesh(track(new BoxGeometry(0.02, 0.16, 0.05)), btnMat);
  volUp.position.set(-PHONE_W / 2 - BEVEL, 0.55, 0);
  group.add(volUp);
  const volDown = volUp.clone();
  volDown.position.y = 0.33;
  group.add(volDown);

  // Reverso: módulo de cámaras (visible cuando el celular gira al entrar)
  const back = -faceZ - 0.001;
  const moduleMesh = new Mesh(
    track(new ExtrudeGeometry(roundedRect(0.38, 0.38, 0.09), { depth: 0.02, bevelEnabled: false, curveSegments: 12 })),
    trackM(new MeshPhysicalMaterial({ color: 0x1d211f, metalness: 0.5, roughness: 0.3, envMap: env, envMapIntensity: 0.8 })),
  );
  moduleMesh.rotation.y = Math.PI;
  moduleMesh.position.set(PHONE_W / 2 - 0.26, PHONE_H / 2 - 0.27, back);
  group.add(moduleMesh);
  const lensGeo = track(new CylinderGeometry(0.065, 0.065, 0.03, 24));
  const lensMat = trackM(new MeshPhysicalMaterial({ color: 0x050505, roughness: 0.05, clearcoat: 1, envMap: env }));
  [
    [-0.08, 0.08],
    [-0.08, -0.08],
    [0.08, 0],
  ].forEach(([dx, dy]) => {
    const lens = new Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(PHONE_W / 2 - 0.26 + dx, PHONE_H / 2 - 0.27 + dy, back - 0.03);
    group.add(lens);
  });

  // Estado de la pantalla (solo se redibuja al cambiar)
  let lastKey = "";
  const setState = (state: PhoneState, p = 0) => {
    const key = state === "reading" ? `r${Math.round(p * 30)}` : state;
    if (key === lastKey) return;
    lastKey = key;
    drawScreen(ctx, card, state, p);
    tex.needsUpdate = true;
  };
  setState("idle");

  return {
    group,
    setState,
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      tex.dispose();
    },
  };
}

export type Phone3D = ReturnType<typeof buildPhone>;
