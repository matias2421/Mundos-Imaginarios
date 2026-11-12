# PROMPT.md — Proceso de construcción del programa

## A. Declaración

Usé IA: sí. Me apoyé en un asistente de IA para generar el código base de los módulos, la estructura de carpetas, el README y este documento. Todo el código fue revisado, probado y ajustado por mí antes de entregarlo.

## B. Herramienta y modelo

Asistente de IA (modelo de lenguaje grande) utilizado para escribir código Node.js y redactar documentación. No se revelan claves de API en este documento.

## C. Prompt inicial completo (literal)

> Actúa como un instructor de Node.js para principiantes del SENA.
> Quiero construir un programa de consola llamado "mundos-ia".
>
> CONTEXTO: solo conozco estos temas: process.argv, módulos con require,
> el módulo nativo fs (writeFileSync, readFileSync, existsSync, mkdirSync),
> path, npm (init, install, scripts), el paquete object-hash, variables de
> entorno con .env y process.loadEnvFile, async/await con try/catch y el fetch
> nativo de Node.
>
> OBJETIVO:
> 1. Recibir por parámetros una situación, un mundo y 5 colores, y guardarlos
>    en un objeto JSON en data/mundo_<id>.json.
> 2. Leer ese JSON y enviarlo con fetch a la API de un modelo de lenguaje para
>    que genere la descripción de una imagen. Guardarla en
>    descripciones/mundo_<id>.txt.
> 3. Enviar esa descripción con fetch a la API de un modelo de imágenes y
>    guardar la imagen en imagenes/mundo_<id>.jpg.
>
> RESTRICCIONES:
> - No uses dotenv, axios, SDK de proveedores, readline, commander ni frameworks.
> - Código simple, con comentarios en español numerados ("paso 1", "paso 2"...).
> - Las API keys se leen del archivo .env y nunca se escriben en el código.
> - Si el .txt o la imagen ya existen, no vuelvas a llamar a las APIs.
> - Divide el código en src/index.js, src/mundo.js, src/texto.js y src/imagen.js.
>
> SERVICIOS: texto con Groq, imagen con NVIDIA FLUX.1-schnell.
>
> FORMA DE RESPONDER: dame un archivo a la vez, explica cada bloque en 2 líneas
> y no uses nada que no esté en el CONTEXTO.

## D. Prompts siguientes y respuestas

**Prompt 2:** "Dame el archivo src/mundo.js con las funciones crearMundo(args), guardarMundo(mundo) y leerMundo(ruta). Incluye validación de que lleguen exactamente 7 argumentos, que ninguno esté vacío y que los 5 colores sean distintos sin distinguir mayúsculas. El id son los primeros 8 caracteres del hash de object-hash sobre { situacion, mundo, colores } sin incluir creadoEn."

Respuesta de la IA: entregó src/mundo.js con las tres funciones, validación de argumentos, cálculo del id con object-hash y escritura/lectura del JSON con fs.

Qué hice con la respuesta: lo adapté para que los mensajes de error estén en español con un ejemplo de uso y termine con process.exitCode = 1. También exporté la constante RUTA_DATA para reutilizarla en index.js.

**Prompt 3:** "Dame el archivo src/texto.js con una función async describirMundo(mundo) que haga fetch a la API de Groq. El mensaje del usuario es JSON.stringify(mundo). Escribe un mensaje de sistema en inglés que pida un párrafo de 80 a 120 palabras describiendo una escena, elementos, iluminación, composición y estilo, mencionando los 5 colores, sin títulos ni markdown. Valida que la respuesta no esté vacía y recórrala a 1500 caracteres si es necesario. Usa AbortSignal.timeout(30000) y revisa respuesta.ok."

Respuesta de la IA: entregó src/texto.js con fetch a la URL de Groq, cabeceras Authorization, cuerpo con model y messages, y lectura de datos.choices[0].message.content.

Qué hice con la respuesta: agregué lectura de variables de entorno con process.loadEnvFile, el manejo de errores con código de estado (error.status) para traducirlos a español en index.js, y el truncado con slice.

**Prompt 4:** "Dame el archivo src/imagen.js con una función async generarImagen(descripcion) que envíe la descripción a NVIDIA FLUX.1-schnell y devuelva los bytes de la imagen. La respuesta llega en datos.artifacts[0].base64. Comprueba finishReason === SUCCESS y convierte con Buffer.from(base64, 'base64'). Usa AbortSignal.timeout(60000)."

Respuesta de la IA: entregó src/imagen.js con el fetch a NVIDIA, el cuerpo con prompt, width, height, steps, seed, y la conversión de base64 a Buffer.

Qué hice con la respuesta: agregé validación de que los bytes no estén vacíos y el manejo de errores HTTP con error.status.

## E. Cambios propios hechos sobre lo que entregó la IA

1. **Quitó process.loadEnvFile del nivel de módulo antes de require('path')**: la IA puso `process.loadEnvFile(path.join(...))` antes de hacer `require('path')`, lo que causaba "Cannot access 'path' before initialization". Lo moví después de los requires en src/index.js, src/texto.js y src/imagen.js.
2. **Mensajes de error en español con códigos de estado**: la IA entregaba errores genéricos en inglés. Yo agregué la función mensajeDeError() en src/index.js que traduce 401/403, 402/429, 404/410, TypeError y TimeoutError a mensajes claros en español, sin imprimir las claves.
3. **Relectura del JSON desde el archivo**: la IA sugería reutilizar el objeto en memoria. Yo corrige index.js para que, tras guardar el mundo, vuelva a leer el JSON desde disco con leerMundo(ruta), como exige el taller.
4. **Guarda la imagen sin 'utf-8'**: la IA podría haber escrito el archivo con codificación 'utf-8'; yo usé `fs.writeFileSync(ruta, bytes)` sin codificación para no corromper el binario de la imagen.
5. **Mensajes "Paso N:" y reutilización de archivos**: agregué la lógica de fs.existsSync para saltar las APIs si el .txt o el .jpg ya existen, con los mensajes exactos del enunciado.

## F. Línea de código que no entendía al principio

`const bytes = Buffer.from(textoBase64, 'base64');` en src/imagen.js.

Explicación con mis palabras: la API de NVIDIA no envía el archivo de imagen directamente, sino su contenido en formato base64, que es una forma de representar datos binarios (los bytes de la imagen JPEG) como texto ASCII. `Buffer.from(texto, 'base64')` toma ese texto y lo convierte de vuelta en un Buffer de Node.js, que es exactamente los bytes binarios de la imagen. Esos bytes son los que se escriben en el archivo .jpg con writeFileSync para que la imagen se abra correctamente.

## G. Un error y cómo lo resolví

**Error:** Al ejecutar `npm start` sin argumentos, Node lanzaba:
`ReferenceError: Cannot access 'path' before initialization` en src/index.js.

**Cómo lo resolví:** La causa era que llamaba a `process.loadEnvFile(path.join(__dirname, '..', '.env'))` en la primera línea, antes de hacer `const path = require('path');`. Como `path` aún no existía, fallaba. Lo moví después de los requires y el programa dejó de fallar al iniciar.
