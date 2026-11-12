// Módulo: mundo.js
// Responsabilidad: validar argumentos, crear el objeto mundo y guardar/leer el JSON.

const fs = require('fs');
const path = require('path');
const hash = require('object-hash');

// Ruta de la carpeta data/ construida a partir de la ubicación de este archivo
const RUTA_DATA = path.join(__dirname, '..', 'data');

// paso 1: valida que lleguen exactamente 7 argumentos (situación, mundo y 5 colores)
function validarArgumentos(args) {
  if (args.length !== 7) {
    console.log('Error: se esperan exactamente 7 argumentos.');
    console.log('Uso: npm start -- "<situación>" "<mundo>" <color1> <color2> <color3> <color4> <color5>');
    console.log('Ejemplo: npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta');
    process.exitCode = 1;
    return false;
  }

  // Ningún argumento puede estar vacío ni tener solo espacios
  for (const arg of args) {
    if (!arg || arg.trim() === '') {
      console.log('Error: ningún argumento puede estar vacío ni tener solo espacios.');
      console.log('Uso: npm start -- "<situación>" "<mundo>" <color1> <color2> <color3> <color4> <color5>');
      process.exitCode = 1;
      return false;
    }
  }

  const [situacion, mundo, ...colores] = args;

  // Los 5 colores deben ser distintos (sin distinguir mayúsculas de minúsculas)
  const coloresMinusculas = colores.map(c => c.toLowerCase().trim());
  const coloresUnicos = new Set(coloresMinusculas);
  if (coloresUnicos.size !== 5) {
    console.log('Error: los 5 colores deben ser distintos entre sí.');
    console.log('Uso: npm start -- "<situación>" "<mundo>" <color1> <color2> <color3> <color4> <color5>');
    process.exitCode = 1;
    return false;
  }

  return { situacion, mundo, colores };
}

// paso 2: crea el objeto mundo (el id se calcula sin creadoEn para que siempre sea el mismo)
function crearMundo(args) {
  const validado = validarArgumentos(args);
  if (!validado) return null;

  const { situacion, mundo, colores } = validado;

  // id: primeros 8 caracteres del hash de { situacion, mundo, colores }
  const id = hash({ situacion, mundo, colores }).substring(0, 8);

  return {
    id,
    situacion,
    mundo,
    colores,
    creadoEn: new Date().toISOString()
  };
}

// paso 3: guarda el objeto en data/mundo_<id>.json
function guardarMundo(mundo) {
  fs.mkdirSync(RUTA_DATA, { recursive: true });
  const rutaArchivo = path.join(RUTA_DATA, `mundo_${mundo.id}.json`);
  fs.writeFileSync(rutaArchivo, JSON.stringify(mundo, null, 2), 'utf-8');
  return rutaArchivo;
}

// paso 4: lee un archivo JSON desde disco y devuelve el objeto
function leerMundo(ruta) {
  const texto = fs.readFileSync(ruta, 'utf-8');
  return JSON.parse(texto);
}

module.exports = { crearMundo, guardarMundo, leerMundo, RUTA_DATA };
