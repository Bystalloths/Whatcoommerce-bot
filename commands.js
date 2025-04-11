// Módulo para manejar comandos del bot

// Función para manejar saludos
exports.handleGreetings = async (message) => {
  const greetings = ['ola', 'hello', 'hola', 'buenas', 'saludo'];
  if (greetings.includes(message.body.toLowerCase())) {
    await message.reply('¡Hola! Bienvenido a nuestro servicio. ¿En qué puedo ayudarte hoy?');
  }
};