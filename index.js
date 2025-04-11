// Importar módulo de comandos
const commands = require('./commands');

// Configurar manejador de mensajes
client.on('message', async (message) => {
  await commands.handleGreetings(message);
});