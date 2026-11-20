/**
 * Datos de contacto, descarga y legales de Capta Card.
 *
 * Los campos vacíos ("") no se muestran en la página: rellénalos cuando tengas
 * el dato oficial y el bloque correspondiente aparecerá solo.
 * Mientras falte un dato legal, `astro build` mostrará un aviso en la consola.
 */

export const contact = {
  supportEmail: "soporte@captacard.com",
  /** WhatsApp en formato internacional, solo dígitos. Ej.: "5215512345678" */
  whatsapp: "",
  /** Teléfono de atención tal como se debe mostrar. Ej.: "55 1234 5678" */
  phone: "",
};

export const appLinks = {
  /** Enlace a la ficha de App Store */
  appStore: "",
  /** Enlace a la ficha de Google Play */
  googlePlay: "",
};

export const legal = {
  /** Razón social de la entidad emisora */
  issuer: "Pomelo Tech S.A. de C.V.",
  /** Tasa de interés anual fija, solo el número */
  interestRate: "60",
  /** CAT promedio sin IVA, solo el número. Ej.: "89.5" */
  cat: "",
  /** Fecha de cálculo del CAT. Ej.: "1 de noviembre de 2026" */
  catDate: "",
  /** Texto de la anualidad. Ej.: "Sin anualidad" o "$499 + IVA" */
  annualFee: "",
  /** Datos de la Unidad Especializada de Atención a Usuarios (UNE) */
  une: "",
};

/** Etapas de lanzamiento: Capta Card llega solo por invitación, en este orden. */
export const rollout = [
  { group: "Friends & Family", detail: "Colaboradores de Capta", when: "Diciembre 2026" },
  { group: "Aliadas", detail: "", when: "Febrero 2027" },
  { group: "Clientes de Aliadas", detail: "", when: "Próximamente" },
  { group: "Público general", detail: "", when: "Próximamente" },
];

/** Ejemplo del ciclo de pago para alguien que activa su tarjeta el 18 de diciembre. */
export const cycleExample = {
  activation: "18 de diciembre",
  steps: [
    { mark: "1", date: "18 de diciembre", text: "Activas tu tarjeta en la app." },
    { mark: "2", date: "6 de enero", text: "Primer corte: se genera tu estado de cuenta." },
    { mark: "3", date: "1 de febrero", text: "Fecha límite para pagar." },
  ],
};

/**
 * Páginas legales. Mientras `draft` sea true, cada página muestra un aviso de
 * borrador y los datos faltantes aparecen resaltados como "Por definir".
 * Pásalo a false solo cuando Legal/Cumplimiento haya validado los textos.
 */
export const legalDraft = true;

/** Muestra el aviso de cookies (maqueta) en todas las páginas. */
export const cookieNotice = true;

export const legalPages = [
  { slug: "aviso-de-privacidad", title: "Aviso de privacidad", short: "Privacidad" },
  { slug: "terminos-y-condiciones", title: "Términos y condiciones", short: "Términos" },
  { slug: "comisiones-y-cat", title: "Comisiones y CAT", short: "Comisiones y CAT" },
  { slug: "une-y-aclaraciones", title: "UNE y aclaraciones", short: "UNE y aclaraciones" },
  { slug: "politica-de-cookies", title: "Política de cookies", short: "Cookies" },
] as const;

export const legalHref = (slug: (typeof legalPages)[number]["slug"]) => `/legal/${slug}`;

export const condusef = {
  name: "CONDUSEF",
  url: "https://www.condusef.gob.mx",
};

const mailto = (subject: string) =>
  `mailto:${contact.supportEmail}?subject=${encodeURIComponent(subject)}`;

export const supportHref = contact.whatsapp
  ? `https://wa.me/${contact.whatsapp}`
  : mailto("Información sobre Capta Card");

const missing = Object.entries({ ...legal, ...appLinks })
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length && import.meta.env.PROD) {
  console.warn(`[Capta Card] Faltan datos en src/data/site.ts: ${missing.join(", ")}`);
}
