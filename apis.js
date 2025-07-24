<<<<<<< HEAD
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
=======
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

// Configurar Gemini
const geminiApiKey = process.env.GEMINI_API_KEY;
let geminiClient = null;
if (geminiApiKey) {
  geminiClient = new GoogleGenerativeAI(geminiApiKey);
}

async function geminiPrompt(prompt) {
  if (!geminiClient) throw new Error('Gemini API Key no configurada');
  const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Configurar WooCommerce
const woocommerceApi = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL,
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
  version: 'wc/v3',
  axiosConfig: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
});

async function getWooProducts() {
  try {
    const response = await woocommerceApi.get('products');
    return response.data;
  } catch (error) {
    return { error: error.message };
  }
}

module.exports = {
  geminiPrompt,
  getWooProducts
};
>>>>>>> 08b99f6 (Actualización de README y licencia MIT)
