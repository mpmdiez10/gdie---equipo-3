import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {

    // Recibe el mensaje de inicialización del main y une el socket a la nueva habitación
    socket.on('init main message', () => {
        // Crear habitacion y unir socket
        socket.join(socket.id); // TODO: Descomentar para producción
        console.log('main joined room:', socket.id); // TODO: Descomentar para producción
        // socket.join('hola'); // TODO: Descomentar para desarrollo
        // Enviar código de habitación al main
        socket.emit('init main message', socket.id);
    });

    // Recibe las notas del main y las envía a la habitación
    socket.on('main message', (msg) => {
        socket.to(socket.id).emit('room message', {text: msg.keys}); // TODO: Descomentar para producción
        // socket.to('hola').emit('room message', {text: msg.keys}); // TODO: Descomentar para desarrollo
    });

    // Recibe el mensaje de inicialización del clone y une el socket a la habitación
    socket.on('init clone message', (msg) => {
        // Unir a habitación
        socket.join(msg.roomId);
        console.log('clone joined room:', msg.roomId); // TODO: Descomentar para producción
    });

    // Recibe la acción sobre el video del clone y la envía a la habitación
    socket.on('clone controller message', (msg) => {
        // Recibir acción sobre el video
        // Enviar acción a la habitación
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});