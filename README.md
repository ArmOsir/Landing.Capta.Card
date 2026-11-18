# Capta Card — landing page

Landing estática en Astro y TypeScript. La carpeta `propuesta/` se conserva
como referencia de diseño y contenido; la aplicación de producción vive en
`src/` y los recursos usados se sirven desde `public/`.

La landing activa está en `/`, basada en la composición de `Mockup3.html` y con
una vitrina interactiva de la tarjeta. Las propuestas anteriores se conservan
como referencia en `propuesta/landing-versions/`.

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

- Confirmar CAT, fecha de cálculo, vigencia y textos regulatorios con el equipo
  responsable. No se completaron los campos pendientes de la propuesta.
- Añadir y verificar los enlaces oficiales de App Store y Google Play cuando
  estén disponibles.
- Reemplazar los destinos provisionales de aviso de privacidad, términos,
  comisiones y UNE por sus páginas oficiales.
- Confirmar la disponibilidad del producto, requisitos y proceso de invitación.
