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
      msg: `There are ${Object.keys(users.online).length} users online`,
    };

      // add the user to the users array
    socket.name = data.name;
    users.online[socket.name] = socket;
    socket.emit('msg', joinMsg);

    socket.join('room1');

    const response = {
      name: 'server',
      msg: `${data.name} has joined the room`,
    };

    socket.broadcast.to('room1').emit('msg', response); // sends to everyone but you

    console.log(`${data.name} joined`);
    socket.emit('msg', { name: 'server', msg: 'You joined the room' }); // sends only to you
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
    console.log(data);
    // check if the first characters of the message contains a command.
    // roll some dice
    if (data.msg.substr(0, 5).includes('/roll')) {
      // get number of dice
      const numDice = parseInt(data.msg.charAt(6), 10);

      // get sides on the dice
      const numSides = parseInt(data.msg.substr(8), 10);

      // roll the dice
      let sum = 0;
      for (let i = 0; i < numDice; i++) {
        sum += Math.floor((Math.random() * numSides) + 1);
      }

      // construct the message
      const message = { name: 'server', msg: `${socket.name} rolled ${numDice}d${numSides}s for a result of ${sum}` };

      // send the message
      io.sockets.in('room1').emit('msg', message);
    } else if (data.msg.substr(0, 3).includes('/me')) {
    // perform an action
      const userAction = data.msg.substr(3);

      // construct the message
      const message = { name: 'server', msg: `${socket.name} ${userAction}` };

      // send the message
      io.sockets.in('room1').emit('msg', message);
    } else if (data.msg.substr(0, 5).includes('/time')) {
      // get the server time
      const d = new Date();
      const dateString = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;

      // construct the message
      const message = { name: 'server', msg: `Time is ${dateString}` };

      // send the message
      socket.emit('msg', message);
    } else {
      io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg }); // sends to everyone in room
    }
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    // remove user from the user array
    delete users.online[socket.name];
    console.log(users.online);
    console.log(`someone disconnected. users online${users.online.length}`);
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');

