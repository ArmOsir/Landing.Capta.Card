/**
 * Terminal punto de venta modelada en código (sin archivos externos).
 *
 * Cuerpo verde bosque con bisel, pantalla con contenido dibujado en vivo
 * (monto → leyendo → aprobado), teclado numérico con etiquetas, emblema de
 * pago sin contacto que pulsa, ondas de lectura y un ticket que se imprime.
 * Unidades: la terminal mide 1.7 de ancho por 3.2 de alto, centrada en el origen.
 */
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Texture,
  TorusGeometry,
  type Material,
  type BufferGeometry,
} from "three";
import { roundedRect } from "./card3d";

export const TERM_W = 1.7;
export const TERM_H = 3.2;
const TERM_D = 0.36;
const BEVEL = 0.05;
/** Z de la cara frontal del cuerpo. */
export const FRONT_Z = TERM_D / 2 + BEVEL;

export type ScreenState = "amount" | "reading" | "approved";

const AMOUNT = "$349.00";
const FONT = '"DM Sans", "Avenir Next", Arial, sans-serif';

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, ctx, canvas };
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Ícono de pago sin contacto: cuatro arcos que abren hacia la derecha. */
function drawContactless(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, alpha = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = size * 0.09;
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = alpha * (1 - i * 0.12);
    const r = size * (0.16 + i * 0.16);
    ctx.beginPath();
    ctx.arc(cx - size * 0.3, cy, r, -Math.PI / 3.2, Math.PI / 3.2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Pantalla de 640×580 px dibujada según el estado de la transacción. */
function drawScreen(ctx: CanvasRenderingContext2D, state: ScreenState, t: number, pulse: number) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0b3122");
  bg.addColorStop(1, "#051c13");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Barra superior
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = "#a3e635";
  ctx.font = `700 26px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.fillText("Capta Card", 32, 33);
  ctx.fillStyle = "#aab9b1";
  ctx.font = `500 22px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText("Café La Hoja", W - 32, 33);
  ctx.textAlign = "center";

  if (state === "amount") {
    ctx.fillStyle = "#aab9b1";
    ctx.font = `500 30px ${FONT}`;
    ctx.fillText("Total a pagar", W / 2, 140);
    ctx.fillStyle = "#f7faf8";
    ctx.font = `700 92px ${FONT}`;
    ctx.fillText(AMOUNT, W / 2, 222);
    ctx.fillStyle = "#c2cec8";
    ctx.font = `500 28px ${FONT}`;
    ctx.fillText("MXN", W / 2, 290);
    drawContactless(ctx, W / 2 + 14, 400, 120, "#4ade80", 0.55 + pulse * 0.45);
    ctx.fillStyle = "#f7faf8";
    ctx.font = `600 32px ${FONT}`;
    ctx.fillText("Acerca tu tarjeta", W / 2, 510);
  } else if (state === "reading") {
    ctx.fillStyle = "#f7faf8";
    ctx.font = `700 64px ${FONT}`;
    ctx.fillText(AMOUNT, W / 2, 170);
    drawContactless(ctx, W / 2 + 14, 320, 130, "#a3e635", 1);
    ctx.fillStyle = "#f7faf8";
    ctx.font = `600 32px ${FONT}`;
    ctx.fillText("Leyendo tarjeta…", W / 2, 440);
    // Barra de progreso
    roundRectPath(ctx, 120, 490, W - 240, 18, 9);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();
    roundRectPath(ctx, 120, 490, Math.max(18, (W - 240) * t), 18, 9);
    ctx.fillStyle = "#4ade80";
    ctx.fill();
  } else {
    // Aprobado: círculo verde con palomita
    const r = 92;
    ctx.fillStyle = "rgba(74,222,128,0.16)";
    ctx.beginPath();
    ctx.arc(W / 2, 205, r + 26 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(W / 2, 205, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#051c13";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const k = Math.min(1, t * 1.6);
    ctx.beginPath();
    ctx.moveTo(W / 2 - 42, 207);
    if (k < 0.4) {
      const q = k / 0.4;
      ctx.lineTo(W / 2 - 42 + 30 * q, 207 + 30 * q);
    } else {
      const q = (k - 0.4) / 0.6;
      ctx.lineTo(W / 2 - 12, 237);
      ctx.lineTo(W / 2 - 12 + 58 * q, 237 - 70 * q);
    }
    ctx.stroke();
    ctx.fillStyle = "#f7faf8";
    ctx.font = `700 52px ${FONT}`;
    ctx.fillText("Pago aprobado", W / 2, 370);
    ctx.fillStyle = "#c2cec8";
    ctx.font = `500 30px ${FONT}`;
    ctx.fillText(`${AMOUNT} MXN`, W / 2, 428);
    ctx.fillStyle = "#aab9b1";
    ctx.font = `500 26px ${FONT}`;
    ctx.fillText("Mastercard •••• 4821", W / 2, 490);
  }
  ctx.textAlign = "left";
}

function drawReceipt(ctx: CanvasRenderingContext2D) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.fillStyle = "#fbfdf9";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#123523";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText("Café La Hoja", W / 2, 70);
  ctx.font = `500 24px ${FONT}`;
  ctx.fillStyle = "#587060";
  ctx.fillText("18 dic 2026 · 10:42", W / 2, 116);
  ctx.strokeStyle = "#b6d9bb";
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, 160);
  ctx.lineTo(W - 40, 160);
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillStyle = "#123523";
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText("Total", 50, 214);
  ctx.textAlign = "right";
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText(`${AMOUNT}`, W - 50, 214);
  ctx.textAlign = "left";
  ctx.font = `500 24px ${FONT}`;
  ctx.fillStyle = "#3d5b47";
  ctx.fillText("Capta Card Mastercard", 50, 268);
  ctx.fillText("Sin contacto •••• 4821", 50, 306);
  ctx.beginPath();
  ctx.moveTo(40, 350);
  ctx.lineTo(W - 40, 350);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#1d7f3e";
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText("APROBADO", W / 2, 404);
  ctx.fillStyle = "#587060";
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText("Gracias por tu compra", W / 2, 452);
}

export function buildTerminal(envTexture: Texture) {
  const group = new Group();
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const textures: Texture[] = [];
  const track = <G extends BufferGeometry>(g: G) => (geometries.push(g), g);
  const trackM = <M extends Material>(m: M) => (materials.push(m), m);

  // ── Cuerpo ──
  const bodyGeo = track(
    new ExtrudeGeometry(roundedRect(TERM_W, TERM_H, 0.24), {
      depth: TERM_D,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 6,
      curveSegments: 24,
    }),
  );
  bodyGeo.translate(0, 0, -TERM_D / 2);
  const bodyMat = trackM(
    new MeshPhysicalMaterial({
      color: 0x0f3a27,
      envMap: envTexture,
      envMapIntensity: 0.55,
      roughness: 0.45,
      metalness: 0.15,
      clearcoat: 0.6,
      clearcoatRoughness: 0.35,
    }),
  );
  group.add(new Mesh(bodyGeo, bodyMat));

  // Franja lima en el canto inferior (detalle de marca)
  const stripe = new Mesh(
    track(new BoxGeometry(TERM_W * 0.5, 0.025, 0.02)),
    trackM(new MeshBasicMaterial({ color: 0xa3e635, toneMapped: false })),
  );
  stripe.position.set(0, -TERM_H / 2 + 0.14, FRONT_Z + 0.001);
  group.add(stripe);

  // ── Pantalla: cristal negro + contenido dibujado ──
  const screenY = 0.72;
  const glass = new Mesh(
    track(new ExtrudeGeometry(roundedRect(1.46, 1.34, 0.08), { depth: 0.01, bevelEnabled: false, curveSegments: 12 })),
    trackM(
      new MeshPhysicalMaterial({
        color: 0x020806,
        envMap: envTexture,
        envMapIntensity: 1,
        roughness: 0.08,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      }),
    ),
  );
  glass.position.set(0, screenY, FRONT_Z);
  group.add(glass);

  const screen = canvasTexture(640, 580, (ctx) => drawScreen(ctx, "amount", 0, 0));
  textures.push(screen.tex);
  const screenMat = trackM(new MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
  const screenMesh = new Mesh(track(new PlaneGeometry(1.34, 1.214)), screenMat);
  screenMesh.position.set(0, screenY, FRONT_Z + 0.012);
  group.add(screenMesh);

  // Reflejo diagonal sutil sobre el cristal
  const sheen = canvasTexture(256, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 256, 256);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.42, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.10)");
    g.addColorStop(0.62, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
  textures.push(sheen.tex);
  const sheenMesh = new Mesh(
    track(new PlaneGeometry(1.34, 1.214)),
    trackM(new MeshBasicMaterial({ map: sheen.tex, transparent: true, depthWrite: false, toneMapped: false })),
  );
  sheenMesh.position.set(0, screenY, FRONT_Z + 0.016);
  group.add(sheenMesh);

  // ── Emblema sin contacto sobre la pantalla ──
  const emblem = new Group();
  const emblemMat = trackM(
    new MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.8, toneMapped: false }),
  );
  [0.05, 0.085, 0.12].forEach((r) => {
    const arc = new Mesh(track(new TorusGeometry(r, 0.011, 8, 32, Math.PI / 1.7)), emblemMat);
    arc.rotation.z = -Math.PI / 3.4;
    emblem.add(arc);
  });
  emblem.position.set(-0.04, TERM_H / 2 - 0.09, FRONT_Z + 0.004);
  group.add(emblem);

  // ── Ondas de lectura: salen del frente hacia la tarjeta ──
  const waves = new Group();
  const waveMats: MeshBasicMaterial[] = [];
  for (let i = 0; i < 3; i++) {
    const mat = trackM(
      new MeshBasicMaterial({
        color: i === 1 ? 0xa3e635 : 0x4ade80,
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
      }),
    );
    waveMats.push(mat);
    waves.add(new Mesh(track(new TorusGeometry(0.5, 0.012, 8, 64)), mat));
  }
  waves.position.set(0, screenY, FRONT_Z + 0.05);
  group.add(waves);

  // ── Teclado ──
  const keyGeo = track(
    new ExtrudeGeometry(roundedRect(0.4, 0.22, 0.07), {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 3,
      curveSegments: 8,
    }),
  );
  const keyTopGeo = track(new PlaneGeometry(0.4, 0.22));
  const labels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
  const keyBody = trackM(
    new MeshPhysicalMaterial({ color: 0x174a33, roughness: 0.5, metalness: 0.05, clearcoat: 0.4, envMap: envTexture, envMapIntensity: 0.4 }),
  );
  const makeKey = (label: string, x: number, y: number, fg: string, bgColor: string, body: Material = keyBody) => {
    const key = new Group();
    key.add(new Mesh(keyGeo, body));
    const tex = canvasTexture(200, 110, (ctx) => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 200, 110);
      ctx.fillStyle = fg;
      ctx.font = `600 ${label.length > 1 ? 30 : 52}px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 100, 58);
    }).tex;
    textures.push(tex);
    const top = new Mesh(keyTopGeo, trackM(new MeshStandardMaterial({ map: tex, roughness: 0.55, transparent: false })));
    top.position.z = 0.03 + 0.0125;
    top.scale.set(0.93, 0.86, 1);
    key.add(top);
    key.position.set(x, y, FRONT_Z);
    group.add(key);
  };
  labels.forEach((label, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    makeKey(label, (col - 1) * 0.5, -0.17 - row * 0.3, "#e2e8e5", "#174a33");
  });
  const actionBody = (color: number) =>
    trackM(new MeshPhysicalMaterial({ color, roughness: 0.5, clearcoat: 0.4, envMap: envTexture, envMapIntensity: 0.4 }));
  makeKey("✕", -0.5, -1.38, "#ffffff", "#8f3b35", actionBody(0x8f3b35));
  makeKey("‹", 0, -1.38, "#3a2a00", "#d9a93a", actionBody(0xd9a93a));
  makeKey("OK", 0.5, -1.38, "#051c13", "#4ade80", actionBody(0x4ade80));

  // ── Ticket: sale de la ranura superior ──
  const receiptTex = canvasTexture(400, 500, drawReceipt).tex;
  textures.push(receiptTex);
  const RECEIPT_H = 1.4;
  const receipt = new Mesh(
    track(new PlaneGeometry(1.12, RECEIPT_H)),
    trackM(new MeshStandardMaterial({ map: receiptTex, roughness: 0.9, side: DoubleSide })),
  );
  const receiptHidden = TERM_H / 2 - RECEIPT_H / 2 - 0.05;
  receipt.position.set(0, receiptHidden, 0);
  receipt.rotation.x = -0.08;
  group.add(receipt);
  const slot = new Mesh(track(new BoxGeometry(1.2, 0.03, 0.08)), trackM(new MeshBasicMaterial({ color: 0x010403 })));
  slot.position.set(0, TERM_H / 2 + BEVEL - 0.01, 0);
  group.add(slot);

  // ── API ──
  let lastKey = "";
  return {
    group,
    /** Coordenada local (y) del centro de la pantalla, para ubicar la tarjeta. */
    screenY,
    setScreen(state: ScreenState, t: number, pulse: number) {
      // Redibuja solo si cambió algo visible (evita subir la textura cada frame)
      const key = `${state}:${Math.round(t * 40)}:${Math.round(pulse * 12)}`;
      if (key === lastKey) return;
      lastKey = key;
      drawScreen(screen.ctx, state, t, pulse);
      screen.tex.needsUpdate = true;
    },
    /** Intensidad 0–1 y fase (segundos) de las ondas de lectura. */
    setWaves(intensity: number, time: number) {
      waves.children.forEach((ring, i) => {
        const phase = (time * 0.9 + i / 3) % 1;
        ring.scale.setScalar(0.25 + phase * 0.85);
        ring.position.z = phase * 0.25;
        waveMats[i].opacity = intensity * (1 - phase) * 0.9;
      });
      waves.visible = intensity > 0.01;
    },
    setEmblem(pulse: number) {
      emblemMat.opacity = 0.45 + pulse * 0.55;
    },
    /** 0 = ticket oculto, 1 = ticket fuera. */
    setReceipt(t: number) {
      receipt.position.y = receiptHidden + t * (RECEIPT_H * 0.82);
      receipt.visible = t > 0.001;
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((tx) => tx.dispose());
    },
  };
}

export type Terminal3D = ReturnType<typeof buildTerminal>;
