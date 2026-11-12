// Módulo: imagen.js (versión prueba con Pollinations - SIN CLAVE)
// Responsabilidad: consultar al modelo de generación de imágenes y devolver los bytes.

const path = require('path');

const IMAGEN_URL_BASE = 'https://image.pollinations.ai/prompt';

// paso 3: envía la descripción al modelo de imágenes y devuelve los bytes de la imagen
async function generarImagen(descripcion) {
  const descripcionCodificada = encodeURIComponent(descripcion);
  const url = `${IMAGEN_URL_BASE}/${descripcionCodificada}?width=1024&height=1024&nologo=true`;

  const respuesta = await fetch(url, {
    signal: AbortSignal.timeout(60000)
  });

  if (!respuesta.ok) {
    const error = new Error(`Error de la API de imágenes: HTTP ${respuesta.status}`);
    error.status = respuesta.status;
    throw error;
  }

  // La imagen llega directamente como bytes (image/jpeg), sin JSON
  const buffer = await respuesta.arrayBuffer();
  const bytes = Buffer.from(buffer);

  if (bytes.length === 0) {
    throw new Error('Los bytes de la imagen están vacíos.');
  }

  // Validar que sea una imagen JPEG (magic bytes FF D8 FF)
  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new Error('La respuesta no contiene una imagen JPEG válida.');
  }

  return bytes;
}

module.exports = { generarImagen };
