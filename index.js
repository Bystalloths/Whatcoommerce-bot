<<<<<<< HEAD
// Importar módulo de comandos
const commands = require('./commands');

// Configurar manejador de mensajes
client.on('message', async (message) => {
  await commands.handleGreetings(message);
=======
require('dotenv').config();
require('./admin');
// Importar módulo de comandos y nodos
const commands = require('./commands');
const { nodos } = require('./admin');

// Inicializar whatsapp-web.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
  authStrategy: new LocalAuth()
});

const qrcode = require('qrcode-terminal');
const { geminiPrompt, getWooProducts } = require('./apis');
const { agregarMensaje } = require('./admin');

const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const { parse } = require('csv-parse/sync');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');

// Middleware para parsear application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Configurar manejador de mensajes
client.on('message', async (message) => {
  // Solo procesar mensajes de texto
  if (!message || message.type !== 'chat' || typeof message.body !== 'string') {
    console.log('Mensaje ignorado (no es texto):', message && message.type);
    return;
  }

  // Guardar mensaje en el registro
  agregarMensaje({
    texto: message.body,
    usuario: message.from,
    fecha: new Date().toISOString()
  });

  if (message.body && message.body.toLowerCase().startsWith('/gemini ')) {
    const prompt = message.body.slice(8).trim();
    if (prompt.length === 0) {
      await message.reply('Por favor, escribe una pregunta después de /gemini');
      return;
    }
    try {
      await message.reply('Consultando a Gemini, por favor espera...');
      const respuesta = await geminiPrompt(prompt);
      await message.reply(respuesta);
    } catch (err) {
      await message.reply('Ocurrió un error al consultar Gemini.');
      console.error('Error Gemini WhatsApp:', err);
    }
    return;
  }
  if (message.body && message.body.toLowerCase().startsWith('/productos')) {
    try {
      await message.reply('Consultando productos de la tienda, por favor espera...');
      const productos = await getWooProducts();
      console.log('Respuesta de WooCommerce:', productos);
      if (productos && Array.isArray(productos) && productos.length > 0) {
        let respuesta = 'Productos disponibles:\n';
        productos.slice(0, 5).forEach(p => {
          respuesta += `• ${p.name} - $${p.price}\n`;
        });
        await message.reply(respuesta.trim());
      } else if (productos && productos.error) {
        await message.reply('Error al consultar productos: ' + productos.error);
      } else {
        await message.reply('No se encontraron productos.');
      }
    } catch (err) {
      await message.reply('Ocurrió un error al consultar productos.');
      console.error('Error WooCommerce WhatsApp:', err);
    }
    return;
  }
  await commands.handleGreetings(message, nodos);

  // Comando WhatsApp: /buscar producto [nombre] o /buscar contacto [nombre]
  let match = message.body.toLowerCase().match(/^\/buscar (producto|contacto) (.+)$/);
  if (match) {
    const tipo = match[1];
    const termino = match[2].trim();
    if (!termino) {
      await message.reply(`Por favor, escribe el nombre después de /buscar ${tipo}`);
      return;
    }
    const resultados = await buscarEnArchivo(termino, tipo);
    if (resultados && resultados.length > 0) {
      let respuesta = `Resultados encontrados:\n`;
      resultados.forEach(row => {
        respuesta += row.join(' | ') + '\n';
      });
      await message.reply(respuesta.trim());
    } else {
      await message.reply(`No se encontró ningún ${tipo} con ese nombre.`);
    }
    return;
  }
});

// Endpoint para agregar un nodo nuevo (asegura id único)
app.post('/nodo', (req, res) => {
  const { condicion, respuesta } = req.body;
  const nodosPath = path.join(__dirname, 'nodos.json');
  let nodos = [];
  try {
    nodos = JSON.parse(fs.readFileSync(nodosPath, 'utf8'));
  } catch (e) {}
  // Crear nodo con id único
  const nuevoNodo = {
    id: Date.now(),
    condicion,
    respuesta
  };
  nodos.push(nuevoNodo);
  fs.writeFileSync(nodosPath, JSON.stringify(nodos, null, 2), 'utf8');
  res.redirect('back');
});

// Endpoint para eliminar un nodo existente
app.post('/nodo/eliminar', (req, res) => {
  const { id } = req.body;
  const nodosPath = path.join(__dirname, 'nodos.json');
  let nodos = [];
  try {
    nodos = JSON.parse(fs.readFileSync(nodosPath, 'utf8'));
  } catch (e) {}
  nodos = nodos.filter(n => String(n.id) !== String(id));
  fs.writeFileSync(nodosPath, JSON.stringify(nodos, null, 2), 'utf8');
  res.redirect('back');
});

// Endpoint para editar un nodo existente
app.post('/nodo/editar', (req, res) => {
  const { id, condicion, respuesta } = req.body;
  const nodosPath = path.join(__dirname, 'nodos.json');
  let nodos = [];

  try {
    nodos = JSON.parse(fs.readFileSync(nodosPath, 'utf8'));
  } catch (e) {
    // Si el archivo está vacío o no existe, se mantiene el array vacío
  }

  // Buscar el nodo por id (puede ser string o número)
  const idx = nodos.findIndex(n => String(n.id) === String(id));
  if (idx !== -1) {
    nodos[idx].condicion = condicion;
    nodos[idx].respuesta = respuesta;
    fs.writeFileSync(nodosPath, JSON.stringify(nodos, null, 2), 'utf8');
  }

  res.redirect('back');
});

const multer = require('multer');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer para subir cualquier archivo permitido
const storageGeneral = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const uploadGeneral = multer({ storage: storageGeneral });

app.post('/subir-archivo', uploadGeneral.single('archivo'), (req, res) => {
  // El archivo se guarda en uploads/ con su nombre original
  res.redirect('back');
});

// Función para buscar en el archivo subido (detecta tipo)
async function buscarEnArchivo(termino, tipoBusqueda = 'producto') {
  // Buscar el archivo más reciente en uploads/
  const archivos = fs.readdirSync(uploadsDir).filter(f => f.match(/\.(csv|xlsx|xls|txt|pdf)$/i));
  if (archivos.length === 0) return null;
  // Tomar el archivo más reciente
  const archivo = archivos.map(f => ({
    nombre: f,
    tiempo: fs.statSync(path.join(uploadsDir, f)).mtime.getTime()
  })).sort((a, b) => b.tiempo - a.tiempo)[0].nombre;
  const ext = path.extname(archivo).toLowerCase();
  const ruta = path.join(uploadsDir, archivo);

  if (ext === '.csv') {
    const contenido = fs.readFileSync(ruta, 'utf8');
    const registros = parse(contenido, { columns: false, skip_empty_lines: true });
    return registros.filter(row => row[0] && row[0].toLowerCase().includes(termino.toLowerCase()));
  }
  if (ext === '.xlsx' || ext === '.xls') {
    const wb = xlsx.readFile(ruta);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const datos = xlsx.utils.sheet_to_json(ws, { header: 1 });
    return datos.filter(row => row[0] && String(row[0]).toLowerCase().includes(termino.toLowerCase()));
  }
  if (ext === '.txt') {
    const lineas = fs.readFileSync(ruta, 'utf8').split(/\r?\n/);
    return lineas.filter(linea => linea.toLowerCase().includes(termino.toLowerCase())).map(l => [l]);
  }
  if (ext === '.pdf') {
    const buffer = fs.readFileSync(ruta);
    const data = await pdfParse(buffer);
    const lineas = data.text.split(/\r?\n/);
    return lineas.filter(linea => linea.toLowerCase().includes(termino.toLowerCase())).map(l => [l]);
  }
  return null;
}

// Mostrar QR en la terminal
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

// Confirmar conexión exitosa
client.on('ready', () => {
  console.log('✅ ¡Conectado a WhatsApp correctamente!');
});

// Iniciar el cliente
client.initialize();

// Iniciar el servidor Express para recibir peticiones HTTP
app.listen(4000, () => {
  console.log('Servidor escuchando en http://localhost:4000');
>>>>>>> 08b99f6 (Actualización de README y licencia MIT)
});