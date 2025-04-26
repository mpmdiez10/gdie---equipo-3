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

    let socketRoomID;

    // Recibe el mensaje de inicialización del main y une el socket a la nueva habitación
    socket.on('init main message', () => {
        // Generar un ID único para la habitación usando la fecha y hora actual
        // Quitar la fecha hace que no funcione
        const timestamp = new Date().getTime();
        socketRoomID = `${socket.id.toString()}-${timestamp}`;


        // Crear habitacion y unir socket
        socket.join(socketRoomID);
        console.log('main joined room:', socketRoomID);
        
        // Enviar código de habitación al main
        socket.emit('init main message', socketRoomID);
    });

    // Recibe las notas del main y las envía a la habitación
    socket.on('main message', (msg) => {
        socket.to(socketRoomID).emit('room message', {text: msg.keys});
    });

    // Recibe el mensaje de inicialización del clone y une el socket a la habitación
    socket.on('init clone message', (msg) => {
        socketRoomID = msg.roomId;
        // Unir a habitación
        socket.join(socketRoomID);
        console.log('clone joined room:', socketRoomID);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});