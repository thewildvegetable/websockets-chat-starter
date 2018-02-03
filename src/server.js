const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`listening at 127.0.0.1: ${port}`);

const io = socketio(app);

const users = { online: [] };

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };
      
      //add the user to the users array
    socket.name = data.name;
    users.online[socket.name] = socket;
    socket.emit('msg', joinMsg);

    socket.join('room1');

    const response = {
      name: 'server',
      msg: `${data.name} has joined the room`,
    };

    socket.broadcast.to('room1').emit('msg', response);     //sends to everyone but you

    console.log(`${data.name} joined`);
    socket.emit('msg', { name: 'server', msg: 'You joined the room' });     //sends only to you
  });
};

const onMsg = (sock) => {
  const socket = sock;
    
  socket.on('msgToServer', (data) => {
      console.log(data);
      //add code to check message for !roll d then get the # after d, for /me and for !time. if none then just send to room
    io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });   //sends to everyone in room
  });
};

const onDisconnect = (sock) => {
  const socket = sock;
    
    //remove user from the user array
    let index = users.online.indexOf(socket.name);
    users.online.splice(index, 1);
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');

