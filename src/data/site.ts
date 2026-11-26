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
  phone: "55 3648 4526",
  /** Horario de atención */
  hours: "Lunes a viernes de 9:00 a 18:00",
  /** Domicilio de atención */
  address: "Av. 16 de Septiembre 1660, Int. 1, Col. Centro Sinaloa, C.P. 80000, Culiacán, Sinaloa",
  /** Buzón para ejercer derechos de privacidad (ARCO) */
  privacyEmail: "privacidad@captacard.com",
};

export const appLinks = {
  /** Enlace a la ficha de App Store */
  appStore: "",
  /** Enlace a la ficha de Google Play */
  googlePlay: "",
};

export const legal = {
  /** Quien otorga el crédito (Acreditante en el contrato) */
  lender: "Capital Productivo del Noroeste, S.A.P.I. de C.V.",
  /** Emisor técnico del plástico (patrocinador del BIN ante Mastercard) */
  issuer: "Pomelo Tech S.A. de C.V.",
  /** Tasa de interés anual fija, solo el número */
  interestRate: "60",
  /** CAT promedio sin IVA, solo el número. Ej.: "89.5" */
  cat: "",
  /** Fecha de cálculo del CAT. Ej.: "1 de noviembre de 2026" */
  catDate: "",
  /** Texto de la anualidad. Ej.: "Sin anualidad" o "$499 + IVA" */
  annualFee: "$300 + IVA al año, primer año sin costo",
  /** Número y fecha de inscripción del contrato en el Registro de Contratos de Adhesión de PROFECO */
  profecoRegistry: "",
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
 * Páginas legales. Su texto sale de los documentos fuente en Word (aviso de
 * privacidad v1.6, contrato v2.9 y términos de la app v1.1). Mientras
 * `legalDraft` sea true se muestra un aviso de borrador arriba del contenido;
 * los datos que aún faltan aparecen resaltados como "Por definir".
 */
export const legalDraft = false;

export const legalPages = [
  { slug: "aviso-de-privacidad", title: "Aviso de privacidad", short: "Privacidad" },
  { slug: "terminos-y-condiciones", title: "Términos y condiciones de la app", short: "Términos" },
  { slug: "contrato", title: "Contrato de adhesión", short: "Contrato" },
  { slug: "comisiones-y-cat", title: "Comisiones y CAT", short: "Comisiones y CAT" },
  { slug: "aclaraciones", title: "Aclaraciones y atención", short: "Aclaraciones" },
] as const;

export const legalHref = (slug: (typeof legalPages)[number]["slug"]) => `/legal/${slug}`;

/** Autoridad competente en la vía administrativa (Capta es Entidad Comercial, no entidad financiera). */
export const profeco = {
  name: "PROFECO",
  fullName: "Procuraduría Federal del Consumidor",
  phones: "55 5568 8722 y 800 468 8722",
  url: "https://www.gob.mx/profeco",
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
