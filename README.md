# Capta Card — landing page

Landing estática en Astro y TypeScript. El código vive en `src/` y los
recursos que se sirven tal cual (logos, tarjeta, favicon) en `public/`.

## Páginas

- `/` — landing principal: tarjeta 3D en el Hero y escena 3D de pago con
  celular en la sección Wallet. Tema claro fijo. Sus secciones están en
  `src/components/p3/`.
- `/propuesta` — propuesta alternativa (en revisión, no se indexa).
- `/legal/*` — aviso de privacidad, términos de la app, contrato, comisiones y
  CAT, y aclaraciones. Su texto sale de los documentos fuente en Word, que no
  se guardan en este repositorio.

## Requisitos

- Node.js 22.12.0 o posterior
- npm

## Desarrollo

```sh
npm install
npm run dev
```

## Validar y compilar

```sh
npm run check
npm run build
npm run preview
```

El build genera el sitio estático en `dist/`, listo para publicarse en un
hosting estático.

## Antes de publicar

- Confirmar tasa, CAT, número de registro ante PROFECO, vigencia de los
  términos y demás textos regulatorios (aparecen como "Por definir").
- Añadir y verificar los enlaces oficiales de App Store y Google Play cuando
  estén disponibles.
