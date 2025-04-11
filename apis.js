// Módulo para manejar integraciones de APIs
const openai = require('openai');
const deepseek = require('deepseek');

// Configurar OpenAI
const openaiClient = new openai.OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configurar DeepSeek
const deepseekClient = new deepseek.Client({
  apiKey: process.env.DEEPSEEK_API_KEY
});

module.exports = {
  openai: openaiClient,
  deepseek: deepseekClient
};