import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
const app = express();
const port = 80;

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.id = `user_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Assigned ID: ${socket.id}`);

    console.log('a user connected');
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});