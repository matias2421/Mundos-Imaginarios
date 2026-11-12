# mundos-ia

Programa de consola en Node.js que genera bocetos visuales rápidos de mundos imaginarios. Recibe una situación, un mundo y 5 colores, los guarda en JSON, pide una descripción de imagen a un modelo de lenguaje (texto) y genera la imagen con un modelo de generación de imágenes, guardando todo en carpetas del proyecto.

## Servicios elegidos

- **Texto:** Groq — https://api.groq.com/openai/v1/chat/completions — Modelo `openai/gpt-oss-20b` — https://groq.com/
- **Imagen:** Pollinations — https://image.pollinations.ai — https://pollinations.ai/

> **Nota:** Pollinations es un servicio gratuito sin clave de API, pero tiene un límite de **1 imagen cada 45 segundos por IP**. Está pensado para pruebas individuales. Para producción o uso en salón, se recomienda NVIDIA o Cloudflare (sección 5.2 del taller).

## Requisitos previos

- Node.js 20.12 o superior (`node -v`) y npm.
- Cuenta gratuita en Groq con su clave de API.
- Haber realizado el Taller 2 (o su Parte 1).

## Configuración

1. Clona este repositorio:
   ```
   git clone <url-del-repositorio>
   cd mundos-ia
   ```
2. Copia el archivo de ejemplo y pon tus claves reales:
   ```
   copy .env.example .env      (Windows)
   cp .env.example .env         (Linux/Mac)
   ```
3. Edita `.env` y reemplaza `TU_CLAVE_GROQ_AQUI` por tu clave real de Groq. Nunca subas el `.env` a Git (está en `.gitignore`).
4. Instala dependencias:
   ```
   npm install
   ```

## Uso

Ejecuta el programa con `npm start --` seguido de la situación, el mundo y 5 colores entre comillas:

```
npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta
```

Salida esperada:

```
Paso 1: mundo guardado en data/mundo_3f9a1c2e.json
Paso 2: descripción guardada en descripciones/mundo_3f9a1c2e.txt
Paso 3: imagen guardada en imagenes/mundo_3f9a1c2e.jpg
Listo. Revisa la carpeta imagenes/
```

Si vuelves a ejecutar el mismo comando, el programa reutiliza los archivos ya generados y no llama a las APIs:

```
Paso 1: mundo guardado en data/mundo_3f9a1c2e.json
Paso 2: la descripción ya existía, no se llamó al modelo de texto.
Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.
```

## Estructura de carpetas

```
mundos-ia/
├── data/                  # JSON de cada mundo (mundo_<id>.json) — no se sube a Git
├── descripciones/         # Texto de cada descripción (mundo_<id>.txt) — no se sube a Git
├── imagenes/              # Imagen de cada mundo (mundo_<id>.jpg) — no se sube a Git
├── src/
│   ├── index.js           # orquesta los pasos 1 a 3
│   ├── mundo.js           # valida argumentos, crea y guarda/lee el JSON
│   ├── texto.js           # consulta al modelo de lenguaje (fetch)
│   └── imagen.js          # consulta al modelo de imágenes (fetch) y devuelve bytes
├── .env                   # claves reales (NO se sube a Git)
├── .env.example           # nombres de variables sin claves reales (SÍ se sube)
├── .gitignore
├── package.json
├── package-lock.json
├── PROMPT.md
└── README.md
```

## Publicación (npm publish --dry-run)

El proyecto está listo para publicarse en npm:

```
npm publish --dry-run
```

Esto lista los archivos que se publicarían. Por el `.gitignore`, **no** deben aparecer `.env`, `data/`, `descripciones/` ni `imagenes/`.

### Experimento (Parte 6)

Se renombró temporalmente `.gitignore` a `.gitignore.off` y se repitió `npm publish --dry-run`. Al no existir `.gitignore` (y no haber `.npmignore`), npm publica **todos** los archivos, incluido `.env` con las claves y las carpetas generadas. Esto es peligroso porque expone las claves de API y archivos privados del proyecto. Después se restauró el nombre `.gitignore`. Se capturó pantalla de ambos resultados para evidenciarlo.

## Preguntas de reflexión

**¿Por qué el id se calcula sin la fecha? ¿Qué pasaría si la incluyeras?**
El id se calcula con `object-hash` sobre `{ situacion, mundo, colores }` sin incluir `creadoEn`. Si se incluyera la fecha, el id cambiaría en cada ejecución (porque la fecha es distinta cada vez), los archivos nunca se reutilizarían y se gastaría cuota gratuita de las APIs innecesariamente. Al excluirla, los mismos datos producen siempre el mismo id y el programa puede recuperar los archivos ya generados.

**¿Por qué se le pide al modelo de texto la descripción en inglés? Si puedes, prueba con una en español y compara las imágenes.**
Los modelos de generación de imágenes (como FLUX.1) están entrenados mayoritariamente con descripciones en inglés, por lo que entienden mejor y producen resultados más fieles. Una descripción en español podría dar imágenes menos precisas o no captar bien el estilo solicitado.

**¿Qué diferencia hay entre una respuesta JSON de texto y una respuesta con los bytes de una imagen? ¿Qué es base64?**
La API de texto devuelve un JSON con el campo `choices[0].message.content` que contiene un string legible. La API de imagen (Pollinations) envía los bytes de la imagen directamente en la respuesta HTTP (tipo `image/jpeg`), sin envolverlos en JSON ni en base64. En el código se capturan con `respuesta.arrayBuffer()` y se convierten a `Buffer` con `Buffer.from(buffer)`. Si se usara NVIDIA, la imagen sí llegaría en base64 dentro de un JSON y se convertiría con `Buffer.from(textoBase64, 'base64')`. En cualquier caso, la imagen se guarda con `writeFileSync` sin codificación 'utf-8' para no corromper los bytes binarios.

**¿Qué pasaría si guardas la imagen con 'utf-8'? ¿Por qué?**
El archivo quedaría dañado y no se abriría. `writeFileSync(ruta, datos, 'utf-8')` fuerza la conversión de los bytes a texto, corrompiendo los bytes binarios de la imagen. Una imagen debe escribirse tal cual llegan los bytes (Buffer), sin interpretación de texto.

**¿Qué pasos consumen cuota gratuita y cómo evitaste repetirlos?**
Consumen cuota el paso 2 (modelo de texto de Groq, que requiere API key) y el paso 3 (modelo de imágenes de Pollinations, sin clave pero con límite de 1 imagen cada 45 segundos por IP). Para evitar repetirlos, el programa usa `fs.existsSync` para comprobar si ya existen `descripciones/mundo_<id>.txt` e `imagenes/mundo_<id>.jpg`; si existen, salta la llamada a la API y reutiliza el archivo. Además, el id es determinista, así que los mismos datos generan siempre los mismos nombres de archivo.

## Mejoras implementadas sobre el código base

- **Detección de imágenes dañadas**: `src/imagen.js` valida los magic bytes JPEG (`FF D8 FF`) antes de guardar. Si la respuesta no es una imagen JPEG válida, lanza un error claro.
- **Respuesta vacía de texto**: `src/texto.js` asigna `code = 'EMPTY_RESPONSE'` cuando la API no devuelve contenido, y `src/index.js` lo traduce a un mensaje claro en español.
- **Id visible**: el paso 1 imprime el `id` generado (ej. `id: cba86145`) para facilitar la revisión de archivos.
- **Aviso de descripción corta**: si el modelo devuelve menos de 60 palabras (se pidieron 80–120), se muestra un aviso sin bloquear la ejecución.
- **Aviso de colores faltantes**: si la descripción generada no menciona alguno de los 5 colores, se advierte al usuario.
- **Pollinations sin clave**: `src/imagen.js` usa Pollinations para generación de imágenes sin requerir API key, enviando la descripción por URL con `encodeURIComponent`.

## Notas de seguridad

- Las claves solo viven en `.env`, que está en `.gitignore` y no se versiona.
- `.env.example` contiene los nombres de variable sin claves reales.
- Ninguna clave se imprime en consola ni en mensajes de error.
- `git ls-files` confirma que `.env` no está en el repositorio.
- Nota: con Pollinations no se requiere `IMAGEN_API_KEY` ni `IMAGEN_URL` en `.env`.
