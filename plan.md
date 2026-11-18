ROLE: Senior Creative Developer, UI/UX Designer & Frontend Engineer

Actúa como un equipo senior formado por:

Un Creative Director especializado en diseño digital.
Un Senior UI/UX Designer.
Un Senior Frontend Engineer.
Un especialista en Design Systems.
Un especialista en optimización web y accesibilidad.

Tu misión es desarrollar una nueva propuesta completa de landing page para Capta Card, con calidad profesional y lista para integrarse en un repositorio mantenible.

En el proyecto hay dos referencias con funciones diferentes:

- `Mockup1.png` define la dirección de arte y la composición deseada, especialmente para el hero: una escena oscura y cinematográfica, titular protagonista y tarjeta como foco visual.
- `propuesta/` contiene la propuesta existente de Capta Card. Úsala para entender la identidad de marca, el producto, sus textos, las secciones, los recursos y los colores. Es una referencia funcional y visual, no código de producción.

La nueva página debe combinar la fuerza visual y la composición del mockup con la identidad y el contenido auténticos de Capta Card. No copies la marca, el nombre, los textos, los datos de tarjeta ni los elementos propios de Neobank que aparezcan en Mockup1. Tampoco te limites a copiar la propuesta existente: crea una alternativa claramente mejor resuelta y coherente como producto web real.

El resultado debe sentirse diseñado por un profesional y contar con una implementación técnica sólida.

No quiero una landing page que parezca generada automáticamente por IA. Quiero una web que transmita intención, criterio visual, identidad y atención al detalle.

1. HERRAMIENTAS

Antes de empezar, inspecciona las herramientas disponibles para diseño, desarrollo y revisión visual. Utiliza las que estén realmente disponibles para mejorar la implementación.

No instales dependencias, skills ni herramientas globales solo para completar este trabajo. Si una herramienta no está disponible, continúa aplicando buenas prácticas de diseño, accesibilidad y desarrollo, y no afirmes haberla utilizado.

2. CÓMO USAR LAS REFERENCIAS

No trates una sola referencia como fuente de verdad para todo. Usa cada recurso para lo que aporta:

1. `Mockup1.png`: dirección visual del hero y nivel de impacto. Observa el fondo oscuro, el encuadre contenido, la navegación discreta, el titular grande y centrado, la iluminación y la tarjeta flotante entre manos. Reinterpreta esos recursos con Capta Card; no reproduzcas literalmente la escena ni la página de Neobank.
2. `propuesta/`: identidad Capta Card y referencia de producto. Inspecciona `Main.dc.html`, `README.md` y los assets para entender el contenido, el tono, los colores y las secciones que ya se plantearon.
3. Este brief: define la calidad de producción, el alcance técnico y los criterios de validación.

Antes de escribir código:

Analiza la imagen y la propuesta existente por separado. Identifica qué decisiones del mockup se pueden trasladar a Capta Card y qué elementos de la propuesta describen la marca o el producto. Define una estructura completa y consistente para la nueva landing; la imagen de referencia muestra principalmente un hero y no limita el resto de la página.

No diseñes una copia de Neobank ni una réplica literal de la propuesta anterior. Crea una nueva composición con intención, haciendo reconocible la marca Capta Card.

3. DIRECCIÓN VISUAL E IDENTIDAD

Presta especial atención a los siguientes aspectos:

Layout y composición
Toma del mockup la jerarquía y el impacto del hero, pero adapta el layout a la identidad, el contenido y los assets reales de Capta Card.
Cuida las proporciones de los contenedores, las alineaciones, las distancias y la jerarquía visual.
Construye una narrativa coherente entre el hero y el resto de la página.
Tipografía
Selecciona tipografías legibles y coherentes con la marca y la dirección de arte.
Define tamaños, pesos, interlineados y espaciados mediante una jerarquía consistente.
Evita utilizar tipografías genéricas por comodidad.
Colores
Usa como base la identidad de color visible en `propuesta/` y evalúa cómo llevarla a un hero más oscuro y cinematográfico inspirado en Mockup1.
Mantén una paleta coherente y no introduzcas colores o degradados sin justificación.
Elementos visuales
Prioriza los recursos reales de Capta Card y cuida sus recortes, proporciones y tratamientos.
Resuelve el foco visual de la tarjeta con un asset aprobado o una composición visual propia; no inventes datos financieros o elementos de marca para simular una tarjeta real.
Usa bordes, sombras, fondos y formas con intención.
Cuida los radios de borde.
No sustituyas elementos específicos por componentes genéricos.
4. DIRECCIÓN DE ARTE: QUE NO PAREZCA HECHA CON IA

La landing debe sentirse auténtica, como un trabajo desarrollado por un diseñador experimentado.

Evita especialmente:

El típico diseño SaaS genérico.
Gradientes morados o azules utilizados por defecto.
Fondos con brillos y efectos innecesarios.
Tarjetas repetitivas con bordes redondeados.
Sombras exageradas.
Iconos dentro de círculos decorativos sin propósito.
Demasiadas etiquetas pequeñas encima de los títulos.
Titulares con palabras destacadas artificialmente.
Animaciones excesivas.
Efectos hover innecesarios.
Secciones que parecen generadas a partir de una plantilla.
Espacios vacíos sin intención.
Elementos decorativos que no aportan nada.

No confundas diseño premium con añadir efectos.

La calidad debe venir de:

Una composición bien resuelta.
Excelente jerarquía visual.
Espaciado preciso.
Tipografía bien seleccionada.
Consistencia.
Detalles visuales cuidados.
Uso inteligente de imágenes.
Una identidad reconocible.

Menos recursos, mejor ejecutados.

No fuerces una estética minimalista, editorial, brutalista o futurista si no encaja con Capta Card. Usa el mockup como inspiración compositiva, no como una orden de copiar su marca o cada detalle literal. La identidad y los datos reales del producto deben seguir siendo reconocibles.

5. IMPLEMENTACIÓN FRONTEND

Primero inspecciona el proyecto existente.

Antes de modificar archivos:

Identifica el framework utilizado.
Revisa la estructura de carpetas.
Examina las dependencias existentes.
Identifica los componentes reutilizables.
Comprueba las convenciones de código.
Identifica los recursos gráficos disponibles.

No cambies innecesariamente la arquitectura del proyecto.

Si el proyecto ya utiliza React, Next.js, Astro, Vue u otro framework, respeta su tecnología.

El directorio raíz no tiene actualmente una aplicación frontend ni un manifiesto de dependencias. Conserva `propuesta/` como material de referencia y crea la nueva implementación en la raíz del proyecto, sin convertir el HTML exportado de la propuesta ni sus runtimes `vendor/react*.js` en la base de producción.

Para esta landing estática, utiliza Astro con TypeScript estricto: permite generar HTML rápido y optimizado, organizar la página en componentes y mantener el JavaScript del cliente al mínimo. Usa CSS moderno y variables de diseño para los estilos; no añadas React ni otra librería de UI salvo que una interacción concreta lo justifique. Elige npm si no existe ya una convención de package manager en el repositorio y deja los scripts `dev`, `build`, `preview` y `check` configurados. Añade la configuración, el lockfile y un `README.md` breve con los requisitos, comandos de instalación/desarrollo/build y notas necesarias para publicar la landing.

Incluye títulos y metadatos SEO/social básicos, idioma correcto del documento, favicon si hay un recurso de marca disponible, y configura el build como sitio estático salvo que el proyecto revele un requisito distinto.

Prioridades técnicas:

Código limpio y modular.
Componentes reutilizables cuando aporten valor.
CSS organizado.
Variables de diseño para colores, tipografía y espaciados.
HTML semántico.
Accesibilidad.
Buen rendimiento.
Optimización de imágenes.
Responsive design real.

No introduzcas dependencias innecesarias.

No construyas una arquitectura compleja para una landing page sencilla.

Organiza el código con una estructura clara, por ejemplo `src/pages`, `src/components`, `src/styles` y los directorios de assets recomendados por Astro. Separa header, hero y secciones reutilizables cuando mejore la legibilidad; evita crear componentes por cada elemento trivial. Mantén los recursos originales de `propuesta/` intactos y copia a la nueva ubicación únicamente los assets que realmente vayas a utilizar.

6. RESPONSIVE DESIGN

La referencia visual será la principal guía para la versión desktop.

También debes desarrollar una adaptación profesional para:

Desktop.
Laptop.
Tablet.
Mobile.

No te limites a reducir proporcionalmente todos los elementos.

Adapta las composiciones cuando sea necesario, conservando la identidad visual y la jerarquía del diseño.

Comprueba especialmente:

Navegación móvil.
Tamaños de titulares.
Espaciado entre secciones.
Imágenes.
Columnas.
Botones.
Formularios.
Overflow horizontal.

La versión móvil debe sentirse diseñada intencionalmente, no simplemente comprimida.

7. ANIMACIONES E INTERACCIONES

Implementa únicamente interacciones que tengan sentido para el diseño.

Pueden incluir:

Transiciones sutiles.
Hover states.
Menús funcionales.
Scroll suave cuando corresponda.
Animaciones de entrada puntuales.
Microinteracciones.

Las animaciones deben ser discretas, naturales y fluidas.

No conviertas toda la landing en una demostración de efectos.

Respeta prefers-reduced-motion.

Todos los botones, enlaces y elementos interactivos deben funcionar realmente.

No utilices botones decorativos sin funcionalidad.

8. CONTENIDO Y ASSETS

Respeta los textos proporcionados.

No inventes:

Testimonios.
Clientes.
Estadísticas.
Premios.
Logos de empresas.
Certificaciones.
Resultados comerciales.
Características del producto.

Usa la propuesta existente como fuente para los textos e información de producto, verificando los datos en su contexto. No presentes como hechos las cifras, condiciones, beneficios financieros, disponibilidad, tasas, comisiones, fechas, promesas o funciones que no estén sustentados en el material disponible. Si falta información legal o comercial necesaria, no la inventes: deja un TODO explícito y acotado o consulta al usuario si bloquea una decisión importante.

En cuanto a imágenes:

Evalúa primero los assets de `propuesta/assets/` y aprovecha las imágenes reales de Capta Card cuando correspondan. La imagen `Mockup1.png` es referencia de dirección visual, no una imagen que deba insertarse dentro de la landing.
Busca imágenes que encajen realmente con el concepto visual.
Evita fotografías de stock demasiado reconocibles o genéricas.
No utilices imágenes que parezcan artificiales si no tienen relación con la marca.
Cuida los recortes, proporciones y tratamientos.

No omitas el foco visual de la tarjeta ni lo sustituyas por un bloque de color genérico simplemente por comodidad.

9. PROCESO DE TRABAJO OBLIGATORIO

Trabaja en las siguientes etapas:

FASE 1 — Análisis

Analiza `Mockup1.png`, la propuesta existente y la estructura del proyecto por separado.

Identifica la identidad y los datos de producto que deben conservarse, los assets reutilizables y los recursos visuales del mockup que pueden reinterpretarse.

FASE 2 — Plan visual

Define:

Paleta cromática.
Tipografías.
Sistema de espaciado.
Anchos de contenedor.
Jerarquía visual.
Estructura de secciones, basada en el contenido real de Capta Card y no limitada a lo visible en el mockup.
Comportamiento responsive.

No dediques demasiado tiempo a documentar. El análisis debe servir para implementar mejor.

FASE 3 — Desarrollo

Implementa la landing completa.

No te limites a crear el hero o una primera aproximación.

Desarrolla la página completa según la estructura que definiste a partir de la propuesta y del contenido disponible. No te limites al hero; tampoco añadas secciones que requieran inventar datos.

FASE 4 — Revisión visual

Esta fase es obligatoria.

Si tienes acceso a un navegador o Playwright:

Ejecuta el proyecto.
Abre la landing.
Genera capturas de pantalla.
Compara el hero con la composición del mockup y el resto de la página con la identidad, el contenido y la coherencia de Capta Card.
Identifica diferencias.
Corrige los problemas visuales.
Repite el proceso hasta conseguir una correspondencia visual satisfactoria.

Compara especialmente:

Posición de elementos.
Tamaños.
Proporciones.
Tipografía.
Colores.
Espaciados.
Alturas de sección.
Composición general.

No declares que la página fue revisada visualmente sin haberla abierto y comprobado.

Si no tienes herramientas de navegador, reconoce esta limitación y realiza una revisión estática del código.

FASE 5 — Pulido profesional

Utiliza Impeccable, si está disponible, para revisar y mejorar los detalles.

Revisa:

Consistencia visual.
Espaciado.
Tipografía.
Alineaciones.
Estados interactivos.
Accesibilidad.
Responsive.
Calidad del código.

Elimina cualquier elemento que no aporte valor.

FASE 6 — Validación final

Comprueba:

Que el proyecto compile.
Que no existan errores de consola.
Que no haya imágenes rotas.
Que todos los enlaces funcionen.
Que los botones tengan acciones reales.
Que no exista overflow horizontal.
Que la página se adapte correctamente a móvil.
Que se respeten los estados de foco y accesibilidad.
10. REGLAS IMPORTANTES
No empieces a programar sin haber analizado el mockup y la propuesta existente.
No copies la marca de Neobank ni inventes una estética ajena a Capta Card.
No inventes información comercial, financiera, legal ni funcionalidades del producto.
No añadas secciones que dependan de información no disponible.
No sustituyas detalles específicos por componentes genéricos.
No sacrifiques la calidad visual ni técnica por rapidez.
No utilices código innecesariamente complejo.
No llenes la landing de animaciones.
No dejes secciones incompletas.
No entregues una versión sin revisar.
No afirmes haber probado algo que no has ejecutado.

Si encuentras una decisión ambigua que pueda cambiar sustancialmente el resultado, consúltame antes de tomarla. Para detalles menores, utiliza tu criterio profesional.

11. RESULTADO ESPERADO

Quiero una landing page:

Con un hero que retome el impacto y la composición del mockup, reinterpretados para Capta Card.
Con una identidad visual auténtica.
Con acabados de calidad profesional.
Responsive en todos los dispositivos.
Con interacciones funcionales.
Con código limpio y mantenible.
Sin patrones visuales típicos de páginas generadas automáticamente.
Implementada con Astro y TypeScript, optimizada para carga rápida y SEO.
Con estructura, dependencias, scripts y documentación básicos para continuar el desarrollo o publicarse.

Al finalizar, entrégame un resumen de:

Qué implementaste.
Qué archivos modificaste o creaste.
Qué funcionalidades incorporaste.
Qué pruebas ejecutaste.
Qué diferencias respecto al mockup no pudiste resolver, si existen.

CRITERIO FINAL DE ÉXITO:

La página debe sentirse como una propuesta original y profesional de Capta Card: conservar la fuerza visual del mockup sin copiar la marca Neobank, y aprovechar el contenido y los recursos de la propuesta existente sin heredar su formato de exportación.

La identidad de producto, la calidad de ejecución, el rendimiento y la atención al detalle tienen prioridad sobre la cantidad de efectos o elementos decorativos.

Ahora analiza `Mockup1.png`, la propuesta existente y el proyecto. Después ejecuta el trabajo completo.