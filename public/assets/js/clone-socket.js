const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');

// Crear el socket
const socket = io();

$('controls-component')[0].socket = socket;

// Mensaje para unir a la habitación recibida de la url
socket.emit('init clone message', {roomId: roomId});

// Recibir y asignar las notas por el socket
socket.on('room message', (msg) => {
  piano = document.querySelector('piano-component');
  piano.setAttribute('notes', msg.text);
});