/**
 * Terminal inteligente (tipo Android) modelada en código, con la imagen de
 * Capta Card. Sin archivos 3D externos.
 *
 * Frente blanco con pantalla táctil grande, carcasa trasera verde bosque con
 * el compartimento de la impresora arriba y la empuñadura abajo, logotipo
 * Capta impreso bajo la pantalla y emblema sin contacto que pulsa. La pantalla
 * se dibuja en vivo (monto → leyendo → aprobado) y el ticket sale por la
 * ranura de la impresora.
 * Unidades: el frente mide 1.7 de ancho por 3.2 de alto, centrado en el origen.
 */
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CylinderGeometry,
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
const TERM_D = 0.18;
const BEVEL = 0.06;
/** Z de la cara frontal del cuerpo. */
export const FRONT_Z = TERM_D / 2 + BEVEL;
const TOP = TERM_H / 2 + BEVEL;

export type ScreenState = "amount" | "reading" | "approved";

const AMOUNT = "$349.00";
const FONT = '"DM Sans", "Avenir Next", Arial, sans-serif';
const LOGO_URL = "/images/logo-capta.png";

/** Pantalla: 1.38 × 1.96 unidades, dibujada a 400 px por unidad. */
const DISPLAY_W = 1.38;
const DISPLAY_H = 1.96;
const PX = 400;

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

/** Hoja Capta simple (dos curvas y nervadura). */
function drawLeaf(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.5);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, s);
  ctx.quadraticCurveTo(-s * 0.95, 0, 0, -s);
  ctx.quadraticCurveTo(s * 0.95, 0, 0, s);
  ctx.fill();
  ctx.restore();
}

/** Interfaz de la terminal según el estado de la transacción. */
function drawScreen(ctx: CanvasRenderingContext2D, state: ScreenState, t: number, pulse: number) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const cx = W / 2;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0b3122");
  bg.addColorStop(1, "#051c13");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "middle";

  // Barra de estado: hora, señal y batería
  ctx.fillStyle = "#c2cec8";
  ctx.font = `600 22px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("10:42", 26, 26);
  ctx.strokeStyle = "#c2cec8";
  ctx.lineWidth = 2.5;
  roundRectPath(ctx, W - 66, 17, 38, 18, 4);
  ctx.stroke();
  ctx.fillStyle = "#4ade80";
  roundRectPath(ctx, W - 63, 20, 26, 12, 2);
  ctx.fill();
  ctx.fillStyle = "#c2cec8";
  for (let i = 0; i < 4; i++) ctx.fillRect(W - 110 + i * 8, 33 - (i + 1) * 4.5, 5, (i + 1) * 4.5);

  // Encabezado de la app
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, 52, W, 84);
  drawLeaf(ctx, 44, 94, 17, "#4ade80");
  ctx.fillStyle = "#f7faf8";
  ctx.font = `700 28px ${FONT}`;
  ctx.fillText("Capta", 68, 84);
  ctx.fillStyle = "#a3e635";
  ctx.font = `600 18px ${FONT}`;
  ctx.fillText("Card", 70, 111);
  ctx.textAlign = "right";
  ctx.fillStyle = "#aab9b1";
  ctx.font = `500 21px ${FONT}`;
  ctx.fillText("Café La Hoja", W - 28, 94);
  ctx.textAlign = "center";

  if (state === "amount") {
    ctx.fillStyle = "#aab9b1";
    ctx.font = `500 30px ${FONT}`;
    ctx.fillText("Total a pagar", cx, 214);
    ctx.fillStyle = "#f7faf8";
    ctx.font = `700 86px ${FONT}`;
    ctx.fillText(AMOUNT, cx, 296);
    ctx.fillStyle = "#c2cec8";
    ctx.font = `500 26px ${FONT}`;
    ctx.fillText("MXN", cx, 356);
    // Zona de lectura con halo que respira
    ctx.fillStyle = `rgba(74,222,128,${0.06 + pulse * 0.08})`;
    ctx.beginPath();
    ctx.arc(cx, 492, 96 + pulse * 10, 0, Math.PI * 2);
    ctx.fill();
    drawContactless(ctx, cx + 16, 492, 130, "#4ade80", 0.55 + pulse * 0.45);
    ctx.fillStyle = "#f7faf8";
    ctx.font = `600 32px ${FONT}`;
    ctx.fillText("Acerca tu tarjeta", cx, 640);
  } else if (state === "reading") {
    ctx.fillStyle = "#f7faf8";
    ctx.font = `700 62px ${FONT}`;
    ctx.fillText(AMOUNT, cx, 236);
    ctx.fillStyle = "rgba(163,230,53,0.12)";
    ctx.beginPath();
    ctx.arc(cx, 410, 104, 0, Math.PI * 2);
    ctx.fill();
    drawContactless(ctx, cx + 16, 410, 140, "#a3e635", 1);
    ctx.fillStyle = "#f7faf8";
    ctx.font = `600 32px ${FONT}`;
    ctx.fillText("Leyendo tarjeta…", cx, 566);
    roundRectPath(ctx, 96, 618, W - 192, 18, 9);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();
    roundRectPath(ctx, 96, 618, Math.max(18, (W - 192) * t), 18, 9);
    ctx.fillStyle = "#4ade80";
    ctx.fill();
  } else {
    // Aprobado: círculo verde con palomita que se traza
    const cy = 300;
    const r = 96;
    ctx.fillStyle = "rgba(74,222,128,0.16)";
    ctx.beginPath();
    ctx.arc(cx, cy, r + 26 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#051c13";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const k = Math.min(1, t * 1.6);
    ctx.beginPath();
    ctx.moveTo(cx - 44, cy + 2);
    if (k < 0.4) {
      const q = k / 0.4;
      ctx.lineTo(cx - 44 + 31 * q, cy + 2 + 31 * q);
    } else {
      const q = (k - 0.4) / 0.6;
      ctx.lineTo(cx - 13, cy + 33);
      ctx.lineTo(cx - 13 + 60 * q, cy + 33 - 72 * q);
    }
    ctx.stroke();
    ctx.fillStyle = "#f7faf8";
    ctx.font = `700 50px ${FONT}`;
    ctx.fillText("Pago aprobado", cx, 470);
    ctx.fillStyle = "#c2cec8";
    ctx.font = `500 30px ${FONT}`;
    ctx.fillText(`${AMOUNT} MXN`, cx, 528);
    ctx.fillStyle = "#aab9b1";
    ctx.font = `500 25px ${FONT}`;
    ctx.fillText("Mastercard •••• 4821", cx, 576);
    ctx.fillStyle = "#a3e635";
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText("Imprimiendo comprobante…", cx, 648);
  }

  // Barra de navegación del sistema
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, H - 60, W, 60);
  ctx.strokeStyle = "#8fa39a";
  ctx.fillStyle = "#8fa39a";
  ctx.lineWidth = 3;
  const ny = H - 30;
  ctx.beginPath();
  ctx.moveTo(cx - 140, ny - 11);
  ctx.lineTo(cx - 156, ny);
  ctx.lineTo(cx - 140, ny + 11);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, ny, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(cx + 137, ny - 10, 20, 20);
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
  let disposed = false;

  // ── Materiales de la carcasa ──
  const whiteMat = trackM(
    new MeshPhysicalMaterial({
      color: 0xe6ebe4,
      envMap: envTexture,
      envMapIntensity: 0.6,
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
    }),
  );
  const greenMat = trackM(
    new MeshPhysicalMaterial({
      color: 0x0f3a27,
      envMap: envTexture,
      envMapIntensity: 0.55,
      roughness: 0.5,
      metalness: 0.1,
      clearcoat: 0.45,
      clearcoatRoughness: 0.4,
    }),
  );
  // Carcasa trasera: blanco un poco más gris que el frente, para dar volumen
  const shellMat = trackM(
    new MeshPhysicalMaterial({
      color: 0xd5ddd3,
      envMap: envTexture,
      envMapIntensity: 0.6,
      roughness: 0.5,
      metalness: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
    }),
  );
  const darkMat = trackM(new MeshBasicMaterial({ color: 0x010403 }));
  const limeMat = trackM(new MeshBasicMaterial({ color: 0xa3e635, toneMapped: false }));

  // ── Frente: placa blanca con cantos suaves ──
  const bodyGeo = track(
    new ExtrudeGeometry(roundedRect(TERM_W, TERM_H, 0.26), {
      depth: TERM_D,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 6,
      curveSegments: 24,
    }),
  );
  bodyGeo.translate(0, 0, -TERM_D / 2);
  group.add(new Mesh(bodyGeo, whiteMat));

  // ── Carcasa trasera: impresora arriba, empuñadura abajo ──
  const backZ = -TERM_D / 2;
  const printerR = 0.4;
  const printerY = TOP - printerR - 0.02;
  const printerZ = backZ - 0.26;
  const printer = new Mesh(track(new CapsuleGeometry(printerR, TERM_W - 0.2 - printerR * 2, 10, 28)), shellMat);
  printer.rotation.z = Math.PI / 2;
  printer.position.set(0, printerY, printerZ);
  group.add(printer);
  // Bandas verde Capta en los extremos de la impresora
  const bandGeo = track(new CylinderGeometry(printerR + 0.006, printerR + 0.006, 0.07, 32, 1, true));
  [-1, 1].forEach((side) => {
    const band = new Mesh(bandGeo, greenMat);
    band.rotation.z = Math.PI / 2;
    band.position.set(side * (TERM_W / 2 - 0.1 - printerR), printerY, printerZ);
    group.add(band);
  });

  // Puente entre la impresora y la empuñadura (lomo trasero)
  const spine = new Mesh(track(new BoxGeometry(TERM_W - 0.3, 1.2, 0.2)), shellMat);
  spine.position.set(0, 0.3, backZ - 0.06);
  group.add(spine);

  const grip = new Mesh(track(new CapsuleGeometry(0.3, 1.0, 10, 28)), shellMat);
  grip.scale.set(2.3, 1, 0.9);
  grip.position.set(0, -0.6, backZ - 0.06);
  group.add(grip);

  // Franja lima en la parte baja del frente (detalle de marca)
  const stripe = new Mesh(track(new BoxGeometry(TERM_W * 0.32, 0.024, 0.01)), limeMat);
  stripe.position.set(0, -TOP + 0.2, FRONT_Z + 0.001);
  group.add(stripe);

  // Ranura del papel en la parte alta de la impresora
  const slotY = printerY + printerR - 0.005;
  const slot = new Mesh(track(new BoxGeometry(1.02, 0.025, 0.06)), darkMat);
  slot.position.set(0, slotY, printerZ);
  group.add(slot);

  // Lector de chip en el canto inferior y botón de encendido lateral
  const chipSlot = new Mesh(track(new BoxGeometry(0.82, 0.02, 0.05)), darkMat);
  chipSlot.position.set(0, -TOP + 0.004, 0.01);
  group.add(chipSlot);
  const power = new Mesh(track(new CylinderGeometry(0.025, 0.025, 0.22, 12)), greenMat);
  power.position.set(TERM_W / 2 + BEVEL - 0.005, 0.95, 0);
  group.add(power);

  // ── Pantalla: cristal negro + interfaz dibujada ──
  const screenY = TOP - 0.12 - 1.1;
  const glass = new Mesh(
    track(new ExtrudeGeometry(roundedRect(1.5, 2.2, 0.12), { depth: 0.01, bevelEnabled: false, curveSegments: 12 })),
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

  // Cámara frontal en el marco superior
  const cam = new Mesh(track(new CylinderGeometry(0.022, 0.022, 0.004, 16)), trackM(new MeshBasicMaterial({ color: 0x1b2a24 })));
  cam.rotation.x = Math.PI / 2;
  cam.position.set(0, screenY + 1.04, FRONT_Z + 0.012);
  group.add(cam);

  const screen = canvasTexture(DISPLAY_W * PX, DISPLAY_H * PX, (ctx) => drawScreen(ctx, "amount", 0, 0));
  textures.push(screen.tex);
  const screenMat = trackM(new MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
  const screenMesh = new Mesh(track(new PlaneGeometry(DISPLAY_W, DISPLAY_H)), screenMat);
  screenMesh.position.set(0, screenY, FRONT_Z + 0.012);
  group.add(screenMesh);

  // Reflejo diagonal sutil sobre el cristal
  const sheen = canvasTexture(256, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 256, 256);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.42, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.09)");
    g.addColorStop(0.62, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
  textures.push(sheen.tex);
  const sheenMesh = new Mesh(
    track(new PlaneGeometry(1.5, 2.2)),
    trackM(new MeshBasicMaterial({ map: sheen.tex, transparent: true, depthWrite: false, toneMapped: false })),
  );
  sheenMesh.position.set(0, screenY, FRONT_Z + 0.016);
  group.add(sheenMesh);

  // ── Logotipo Capta impreso bajo la pantalla ──
  const LOGO_W = 0.9;
  const LOGO_H = LOGO_W * (200 / 473);
  const logo = canvasTexture(474, 200, () => {});
  textures.push(logo.tex);
  const logoImg = new Image();
  logoImg.decoding = "async";
  logoImg.onload = () => {
    if (disposed) return;
    logo.ctx.drawImage(logoImg, 0, 0, 474, 200);
    logo.tex.needsUpdate = true;
  };
  logoImg.src = LOGO_URL;
  const logoMesh = new Mesh(
    track(new PlaneGeometry(LOGO_W, LOGO_H)),
    trackM(new MeshStandardMaterial({ map: logo.tex, transparent: true, roughness: 0.5, depthWrite: false })),
  );
  const logoY = screenY - 1.1 - 0.26;
  logoMesh.position.set(0, logoY, FRONT_Z + 0.002);
  group.add(logoMesh);

  // ── Emblema sin contacto bajo el logotipo ──
  const emblem = new Group();
  const emblemMat = trackM(
    new MeshBasicMaterial({ color: 0x1d7f3e, transparent: true, opacity: 0.8, toneMapped: false }),
  );
  [0.05, 0.085, 0.12].forEach((r) => {
    const arc = new Mesh(track(new TorusGeometry(r, 0.012, 8, 32, Math.PI / 1.7)), emblemMat);
    arc.rotation.z = -Math.PI / 3.4;
    emblem.add(arc);
  });
  emblem.position.set(-0.05, logoY - 0.34, FRONT_Z + 0.004);
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

  // ── Ticket: sale por la ranura de la impresora ──
  const receiptTex = canvasTexture(400, 500, drawReceipt).tex;
  textures.push(receiptTex);
  const RECEIPT_W = 0.92;
  const RECEIPT_H = RECEIPT_W * 1.25;
  const receipt = new Mesh(
    track(new PlaneGeometry(RECEIPT_W, RECEIPT_H)),
    trackM(new MeshStandardMaterial({ map: receiptTex, roughness: 0.9, side: DoubleSide })),
  );
  const receiptHidden = slotY - RECEIPT_H / 2 - 0.03;
  receipt.position.set(0, receiptHidden, printerZ);
  receipt.rotation.x = -0.12;
  group.add(receipt);

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
      disposed = true;
      logoImg.onload = null;
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((tx) => tx.dispose());
    },
  };
}

export type Terminal3D = ReturnType<typeof buildTerminal>;
