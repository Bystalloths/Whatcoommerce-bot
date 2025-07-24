<<<<<<< HEAD
// Módulo para manejar comandos del bot

// Función para manejar saludos
exports.handleGreetings = async (message) => {
  const greetings = ['ola', 'hello', 'hola', 'buenas', 'saludo'];
  if (greetings.includes(message.body.toLowerCase())) {
    await message.reply('¡Hola! Bienvenido a nuestro servicio. ¿En qué puedo ayudarte hoy?');
  }
};
=======
const fs = require('fs');
const path = require('path');
const { geminiPrompt } = require('./apis');

// Contextos activos por usuario (en memoria)
const geminiContexts = {};

// Palabras clave para terminar el contexto
const palabrasDespedida = [
  'adiós', 'bye', 'hasta luego', 'nos vemos', 'chao', 'chau', 'me voy', 'despídete', 'despedida', 'see you', 'goodbye'
];

function cargarNodos() {
  const NODOS_FILE = path.join(__dirname, 'nodos.json');
  if (fs.existsSync(NODOS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(NODOS_FILE, 'utf8'));
    } catch (e) {
      console.error('Error al leer nodos.json:', e);
      return [];
    }
  }
  return [];
}

/**
 * Procesa el mensaje recibido y responde según nodos y contexto Gemini.
 * @param {object} message - Objeto message de whatsapp-web.js
 * @param {Array} nodos - Lista de nodos (condición y respuesta)
 */
async function handleGreetings(message, nodos) {
  if (!message || !message.body) return;
  const usuario = message.from;
  const texto = message.body.trim().toLowerCase();
  // Si el usuario está en contexto Gemini
  if (geminiContexts[usuario]) {
    // ¿El usuario se despide?
    if (palabrasDespedida.some(palabra => texto.includes(palabra))) {
      delete geminiContexts[usuario];
      await message.reply('¡Hasta luego! Se ha cerrado tu conversación con Gemini.');
      return;
    }
    // Si no, enviar a Gemini
    try {
      await message.reply('Consultando a Gemini, por favor espera...');
      const respuesta = await geminiPrompt(message.body);
      await message.reply(respuesta);
    } catch (err) {
      await message.reply('Ocurrió un error al consultar Gemini.');
      console.error('Error Gemini Contexto:', err);
    }
    return;
  }
  // Usar nodos pasados o cargar desde archivo
  const nodosActivos = Array.isArray(nodos) ? nodos : cargarNodos();
  for (const nodo of nodosActivos) {
    if (texto.includes(nodo.condicion.trim().toLowerCase())) {
      if (nodo.respuesta.startsWith('@gemini')) {
        // Activar contexto Gemini
        geminiContexts[usuario] = true;
        await message.reply('Has iniciado una conversación con Gemini. Puedes escribir lo que quieras y te responderé. Cuando quieras terminar, escribe "adiós" o una despedida.');
        // Primera consulta a Gemini con el mensaje original
        try {
          await message.reply('Consultando a Gemini, por favor espera...');
          const respuesta = await geminiPrompt(message.body);
          await message.reply(respuesta);
        } catch (err) {
          await message.reply('Ocurrió un error al consultar Gemini.');
          console.error('Error Gemini Inicio:', err);
        }
        return;
      } else {
        try {
          await message.reply(nodo.respuesta);
        } catch (err) {
          console.error('Error al responder saludo:', err);
        }
        break;
      }
    }
  }
}

module.exports = {
  handleGreetings
}; 
>>>>>>> 08b99f6 (Actualización de README y licencia MIT)
