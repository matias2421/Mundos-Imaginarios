// Módulo: texto.js
// Responsabilidad: consultar al modelo de lenguaje para obtener la descripción de una imagen.

const path = require('path');

process.loadEnvFile(path.join(__dirname, '..', '.env'));

const TEXTO_URL = process.env.TEXTO_URL;
const TEXTO_API_KEY = process.env.TEXTO_API_KEY;
const TEXTO_MODELO = process.env.TEXTO_MODELO;

// paso 2: pide al modelo de lenguaje que escriba la descripción de la imagen
async function describirMundo(mundo) {
  const cuerpo = JSON.stringify(mundo);

  const mensajeSistema = `You are an assistant that writes descriptions for AI image generation.
Write a single paragraph in English, between 80 and 120 words, describing an image.
The description must include: scene, elements, lighting, composition and artistic style.
Do not write a story or a tale.
Mention the 5 colors of the scene (you may translate them into English).
Do not use titles, do not use Markdown formatting, and do not include any text written inside the image.`;

  const respuesta = await fetch(TEXTO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TEXTO_API_KEY}`
    },
    body: JSON.stringify({
      model: TEXTO_MODELO,
      messages: [
        { role: 'system', content: mensajeSistema },
        { role: 'user', content: cuerpo }
      ]
    }),
    signal: AbortSignal.timeout(30000)
  });

  if (!respuesta.ok) {
    const error = new Error(`Error de la API de texto: HTTP ${respuesta.status}`);
    error.status = respuesta.status;
    throw error;
  }

  const datos = await respuesta.json();
  let descripcion = datos.choices[0].message.content;

  if (!descripcion || descripcion.trim() === '') {
    const error = new Error('La API de texto devolvió una respuesta vacía.');
    error.code = 'EMPTY_RESPONSE';
    throw error;
  }

  const palabras = descripcion.trim().split(/\s+/).length;
  if (palabras < 60) {
    console.log(`Aviso: la descripción parece corta (${palabras} palabras). Se solicitaron entre 80 y 120.`);
  }

  if (descripcion.length > 1500) {
    console.log('Aviso: la descripción supera los 1500 caracteres y se recortó.');
    descripcion = descripcion.slice(0, 1500);
  }

  return descripcion;
}

module.exports = { describirMundo };
