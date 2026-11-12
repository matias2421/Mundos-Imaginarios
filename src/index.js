// Módulo: index.js
// Orquesta los pasos 1 a 3 del programa mundos-ia.

const fs = require('fs');
const path = require('path');

process.loadEnvFile(path.join(__dirname, '..', '.env'));

const { crearMundo, guardarMundo, leerMundo } = require('./mundo');
const { describirMundo } = require('./texto');
const { generarImagen } = require('./imagen');

// Rutas de las carpetas de salida, construidas a partir de la ubicación de este archivo
const RUTA_DESCRIPCIONES = path.join(__dirname, '..', 'descripciones');
const RUTA_IMAGENES = path.join(__dirname, '..', 'imagenes');

// paso 5: traduce errores técnicos a mensajes claros en español
function mensajeDeError(error) {
  // Tiempo de espera agotado
  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return 'El servicio tardó demasiado en responder.';
  }

  // Respuesta vacía de la API de texto
  if (error.code === 'EMPTY_RESPONSE') {
    return 'La API de texto no devolvió contenido. Intenta de nuevo o revisa el modelo.';
  }

  // Sin conexión o URL mal escrita
  if (error instanceof TypeError) {
    return 'No se pudo conectar. Revisa tu internet o la URL.';
  }

  // Errores por código de estado HTTP
  const status = error.status;
  if (status === 401 || status === 403) {
    return 'La API key no es válida. Revisa tu archivo .env.';
  }
  if (status === 402 || status === 429) {
    return 'Superaste el límite gratuito. Espera un momento (revisa el encabezado retry-after si existe).';
  }
  if (status === 404 || status === 410) {
    return 'El modelo o la URL no existen. Revisa tu configuración.';
  }

  return 'Ocurrió un error inesperado. Revisa los mensajes anteriores.';
}

async function main() {
  const args = process.argv.slice(2);

  // ---------- Paso 1: guardar el mundo en JSON ----------
  const mundo = crearMundo(args);
  if (process.exitCode === 1) {
    return; // validación de argumentos falló
  }

  const rutaJson = guardarMundo(mundo);
  const rutaJsonRelativa = `data/mundo_${mundo.id}.json`;
  console.log(`Paso 1: mundo guardado en ${rutaJsonRelativa} (id: ${mundo.id})`);

  // Vuelve a leer el JSON desde el archivo (no usa el objeto en memoria)
  const mundoLeido = leerMundo(rutaJson);

  // ---------- Paso 2: descripción con el modelo de texto ----------
  const rutaTxt = path.join(RUTA_DESCRIPCIONES, `mundo_${mundoLeido.id}.txt`);
  const rutaTxtRelativa = `descripciones/mundo_${mundoLeido.id}.txt`;

  let descripcion;
  if (fs.existsSync(rutaTxt)) {
    console.log(`Paso 2: la descripción ya existía, no se llamó al modelo de texto.`);
    descripcion = fs.readFileSync(rutaTxt, 'utf-8');
  } else {
    descripcion = await describirMundo(mundoLeido);

    // Advertir si la descripción no menciona todos los colores
    // (el modelo escribe en inglés, así que traducimos los colores básicos para comparar)
    const traduccionColores = {
      rojo: 'red', azul: 'blue', verde: 'green', dorado: 'gold', violeta: 'violet',
      amarillo: 'yellow', negro: 'black', blanco: 'white', rosa: 'pink', naranja: 'orange'
    };
    const descripcionLower = descripcion.toLowerCase();
    const coloresFaltantes = mundoLeido.colores.filter(c => {
      const colorEnIngles = traduccionColores[c.toLowerCase()] || c.toLowerCase();
      return !descripcionLower.includes(c.toLowerCase()) && !descripcionLower.includes(colorEnIngles);
    });
    if (coloresFaltantes.length > 0) {
      console.log(`Aviso: la descripción podría no mencionar estos colores: ${coloresFaltantes.join(', ')}.`);
    }

    fs.mkdirSync(RUTA_DESCRIPCIONES, { recursive: true });
    fs.writeFileSync(rutaTxt, descripcion, 'utf-8');
    console.log(`Paso 2: descripción guardada en ${rutaTxtRelativa}`);
  }

  // ---------- Paso 3: imagen con el modelo de generación de imágenes ----------
  const rutaJpg = path.join(RUTA_IMAGENES, `mundo_${mundoLeido.id}.jpg`);
  const rutaJpgRelativa = `imagenes/mundo_${mundoLeido.id}.jpg`;

  if (fs.existsSync(rutaJpg)) {
    console.log(`Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.`);
  } else {
    const bytes = await generarImagen(descripcion);
    fs.mkdirSync(RUTA_IMAGENES, { recursive: true });
    fs.writeFileSync(rutaJpg, bytes); // se guarda como binario, SIN 'utf-8'
    console.log(`Paso 3: imagen guardada en ${rutaJpgRelativa}`);
  }

  console.log('Listo. Revisa la carpeta imagenes/');
}

main().catch(error => {
  console.log(mensajeDeError(error));
  process.exitCode = 1;
});
