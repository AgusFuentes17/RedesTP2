import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configuración del archivo y directorio
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicialización de Express y Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server);


// Configuración de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Servir archivos estáticos
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.render("index");
});
app.get("/juego", (req, res) => {
    res.render("juego");
});

server.listen(3000);