const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');

const socket = io();
socket.emit('init mobile message', {roomId: roomId});
socket.on('init mobile message', (msg) => {
  alert(msg.text); //TODO: Mirar que habría que hacer aquí
});
socket.on('room message', (msg) => {
  piano = document.querySelector('piano-component');
  piano.setAttribute('notes', msg.text);
});