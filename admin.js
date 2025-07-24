require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Parser } = require('json2csv');
const fs = require('fs');
const { geminiPrompt } = require('./apis');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 4000;

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Almacenamiento temporal de mensajes
let mensajes = [
  { texto: 'Hola', usuario: '12345', fecha: new Date('2024-07-22T10:00:00') },
  { texto: '¿Tienen promociones?', usuario: '67890', fecha: new Date('2024-07-22T11:30:00') },
  { texto: 'Quiero hacer un pedido', usuario: '12345', fecha: new Date('2024-07-23T09:15:00') },
  { texto: 'Gracias', usuario: '54321', fecha: new Date('2024-07-23T12:45:00') }
];

// Almacenamiento temporal de nodos de respuesta automática
let nodos = [];
const NODOS_FILE = path.join(__dirname, 'nodos.json');

// Cargar nodos desde archivo si existe
if (fs.existsSync(NODOS_FILE)) {
  try {
    nodos = JSON.parse(fs.readFileSync(NODOS_FILE, 'utf8'));
  } catch (e) {
    console.error('Error al leer nodos.json:', e);
    nodos = [];
  }
}

const MENSAJES_FILE = path.join(__dirname, 'mensajes.json');

// Cargar mensajes desde archivo si existe
if (fs.existsSync(MENSAJES_FILE)) {
  try {
    mensajes = JSON.parse(fs.readFileSync(MENSAJES_FILE, 'utf8'));
  } catch (e) {
    console.error('Error al leer mensajes.json:', e);
  }
}

// Emitir mensajes nuevos a los clientes conectados
function emitirNuevoMensaje(mensaje) {
  io.emit('nuevo_mensaje', mensaje);
}

function agregarMensaje(mensaje) {
  mensajes.push(mensaje);
  try {
    fs.writeFileSync(MENSAJES_FILE, JSON.stringify(mensajes, null, 2), 'utf8');
  } catch (e) {
    console.error('Error al guardar mensajes.json:', e);
  }
  emitirNuevoMensaje(mensaje);
}

// Ruta principal
app.get('/', (req, res) => {
  const { q, usuario } = req.query;
  let mensajesFiltrados = mensajes;
  if (q) {
    mensajesFiltrados = mensajesFiltrados.filter(m => m.texto.toLowerCase().includes(q.toLowerCase()));
  }
  if (usuario) {
    mensajesFiltrados = mensajesFiltrados.filter(m => m.usuario === usuario);
  }
  // Estadísticas
  const totalMensajes = mensajes.length;
  const usuariosUnicos = new Set(mensajes.map(m => m.usuario)).size;
  // Mensajes por día
  const mensajesPorDia = {};
  mensajes.forEach(m => {
    const dia = m.fecha ? new Date(m.fecha).toLocaleDateString() : 'Sin fecha';
    mensajesPorDia[dia] = (mensajesPorDia[dia] || 0) + 1;
  });
  res.render('panel', { mensajes: mensajesFiltrados, totalMensajes, usuariosUnicos, mensajesPorDia, q: q || '', usuario: usuario || '', nodos });
});

// Ruta para crear un nuevo nodo de respuesta automática
app.post('/nodos', (req, res) => {
  const { condicion, respuesta } = req.body;
  if (condicion && respuesta) {
    nodos.push({ condicion, respuesta });
    // Guardar nodos en archivo
    try {
      fs.writeFileSync(NODOS_FILE, JSON.stringify(nodos, null, 2), 'utf8');
    } catch (e) {
      console.error('Error al guardar nodos.json:', e);
    }
  }
  res.redirect('/');
});

// Ruta para mostrar el formulario de edición de un nodo
app.get('/nodos/:id/editar', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id >= 0 && id < nodos.length) {
    const nodo = nodos[id];
    res.render('editar-nodo', { nodo, id });
  } else {
    res.status(404).send('Nodo no encontrado');
  }
});

// Ruta para actualizar un nodo
app.post('/nodos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { condicion, respuesta } = req.body;
  if (id >= 0 && id < nodos.length && condicion && respuesta) {
    nodos[id] = { condicion, respuesta };
    try {
      fs.writeFileSync(NODOS_FILE, JSON.stringify(nodos, null, 2), 'utf8');
    } catch (e) {
      console.error('Error al guardar nodos.json:', e);
    }
  }
  res.redirect('/');
});

// Ruta para eliminar un nodo
app.post('/nodos/:id/eliminar', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id >= 0 && id < nodos.length) {
    nodos.splice(id, 1);
    try {
      fs.writeFileSync(NODOS_FILE, JSON.stringify(nodos, null, 2), 'utf8');
    } catch (e) {
      console.error('Error al guardar nodos.json:', e);
    }
  }
  res.redirect('/');
});

// Ruta para exportar mensajes filtrados a CSV
app.get('/exportar', (req, res) => {
  const { q, usuario } = req.query;
  let mensajesFiltrados = mensajes;
  if (q) {
    mensajesFiltrados = mensajesFiltrados.filter(m => m.texto.toLowerCase().includes(q.toLowerCase()));
  }
  if (usuario) {
    mensajesFiltrados = mensajesFiltrados.filter(m => m.usuario === usuario);
  }
  const fields = ['texto', 'usuario', 'fecha'];
  const opts = { fields };
  try {
    const parser = new Parser(opts);
    const csv = parser.parse(mensajesFiltrados.map(m => ({...m, fecha: m.fecha ? new Date(m.fecha).toLocaleString() : ''})));
    res.header('Content-Type', 'text/csv');
    res.attachment('mensajes.csv');
    return res.send(csv);
  } catch (err) {
    return res.status(500).send('Error al exportar CSV');
  }
});

// Ruta para consultar Gemini desde el panel
app.post('/gemini', async (req, res) => {
  const prompt = req.body.prompt;
  let geminiRespuesta = '';
  if (prompt && prompt.trim().length > 0) {
    try {
      geminiRespuesta = await geminiPrompt(prompt);
    } catch (e) {
      geminiRespuesta = 'Ocurrió un error al consultar Gemini.';
      console.error('Error Gemini Panel:', e);
    }
  } else {
    geminiRespuesta = 'Por favor, escribe una pregunta.';
  }
  // Renderizar el panel con la respuesta de Gemini
  // (recargar los datos normales del panel)
  const { q, usuario } = req.query;
  let mensajesFiltrados = mensajes;
  if (q) {
    mensajesFiltrados = mensajesFiltrados.filter(m => m.texto.toLowerCase().includes(q.toLowerCase()));
  }
  if (usuario) {
    mensajesFiltrados = mensajesFiltrados.filter(m => m.usuario === usuario);
  }
  const totalMensajes = mensajes.length;
  const usuariosUnicos = new Set(mensajes.map(m => m.usuario)).size;
  const mensajesPorDia = {};
  mensajes.forEach(m => {
    const dia = m.fecha ? new Date(m.fecha).toLocaleDateString() : 'Sin fecha';
    mensajesPorDia[dia] = (mensajesPorDia[dia] || 0) + 1;
  });
  res.render('panel', { mensajes: mensajesFiltrados, totalMensajes, usuariosUnicos, mensajesPorDia, q: q || '', usuario: usuario || '', nodos, geminiRespuesta });
});

// Iniciar servidor siempre
server.listen(PORT, () => {
  console.log(`Panel de administración disponible en http://localhost:${PORT}`);
});

module.exports = { app, mensajes, agregarMensaje, nodos };
