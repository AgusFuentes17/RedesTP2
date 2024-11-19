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



const shotLifetime = 3000; // Duración de vida de los disparos en milisegundos
const playerRadius = 1; // Radio aproximado para detectar colisiones con jugadores
let players = {}; // Almacena la información de los jugadores
let shots = [];   // Almacena los disparos en el juego

io.on('connection', (socket) => {
    console.log('Nuevo jugador conectado:', socket.id);

    // Almacenar el nuevo jugador
    players[socket.id] = { position: { x: 0, y: -100, z: 0 }, rotation: 0 };

    // Escuchar los datos de posición enviados por el cliente
    socket.on('updatePosition', (data) => {
        const { id, position, rotation } = data;
        
        // Actualizar los datos del jugador
        players[id] = { position, rotation };
        
        // Enviar la posición a todos los demás jugadores
        socket.broadcast.emit('updatePosition', data);
    });

    // Escuchar los disparos
    socket.on('shoot', (data) => {
        // Crear disparo y agregarlo al arreglo
        shots.push({
            id: socket.id,
            position: data.position,
            direction: data.direction,
            timestamp: Date.now()
        });

        // Reenviar el disparo a otros jugadores
        socket.broadcast.emit('playerShot', {
            id: socket.id,
            position: data.position,
            direction: data.direction
        });
    });

    // Escuchar cuando un jugador se desconecta
    socket.on('disconnect', () => {
        console.log('Jugador desconectado:', socket.id);
        
        // Eliminar al jugador desconectado
        delete players[socket.id];
        
        // Notificar a los demás jugadores para que lo eliminen de la escena
        socket.broadcast.emit('playerDisconnected', socket.id);
    });
});

// Cada segundo, verificar si algún disparo golpea a un jugador
setInterval(() => {
    const now = Date.now();

    for (let shot of shots) {
        for (let playerId in players) {
            const player = players[playerId];

            // Calcular la distancia entre el disparo y el jugador
            const distance = Math.sqrt(
                (shot.position.x - player.position.x) ** 2 +
                (shot.position.y - player.position.y) ** 2 +
                (shot.position.z - player.position.z) ** 2
            );

            // Si el disparo golpea al jugador
            if (distance < playerRadius) {
                // Emitir evento de eliminación a todos los jugadores
                io.emit('playerHit', { id: playerId });


                // Eliminar al jugador del servidor
                delete players[playerId];

                // Notificar a los demás jugadores que el jugador fue eliminado
                io.emit('playerDisconnected', playerId);

                // Eliminar disparo de la lista de disparos
                shots = shots.filter(s => s !== shot);

                break;  // Ya encontramos al jugador golpeado, salir del bucle
            }
        }
    }

    // Eliminar disparos que han pasado su tiempo de vida
    shots = shots.filter(shot => now - shot.timestamp < shotLifetime);
}, 1000); // Cada segundo


server.listen(3000);