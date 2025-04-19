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

    // Mensajes del main
    socket.on('init main message', () => {
        // Crear habitacion y Unir socket a habitación
        // socket.join(socket.id); // TODO: Recuperar
        socket.join('hola');
        // console.log('user joined room:', socket.id);
        console.log('user joined room:', 'hola');
        // Enviar código de habitación al main
        socket.emit('init main message', socket.id);
    });

    socket.on('main message', (msg) => {
        // Recibir info del video
        // Enviar info del video a la habitación
        // socket.to(socket.id).emit('room message', {text: msg.text}); // TODO: Recuperar
        socket.to('hola').emit('room message', {text: msg.keys});
    });

    // Mensajes del mobiles
    socket.on('init mobile message', (msg) => {
        // Unir a habitación
        socket.join(msg.roomId);
        // Enviar código de habitación al mobile
        socket.emit('init mobile message', {text: 'Habitación ' + msg.roomId});
    });

    socket.on('mobile message', (msg) => {
        // Recibir acción sobre el video
        // Enviar acción a la habitación
    });

    // Mensajes del desktop
    socket.on('init desktop message', (msg) => {
        // Unir a habitación
        socket.join(msg.roomId);
        // Enviar código de habitación al mobile
        socket.emit('init desktop message', msg.roomId);
    });

    socket.on('desktop message', (msg) => {
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