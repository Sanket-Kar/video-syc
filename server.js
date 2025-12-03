const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

let rooms = {};

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('create', (data) => {
    const { room, videoId, playerType } = data;
    socket.join(room);
    rooms[room] = {
      host: socket.id,
      playerType: playerType,
      videoId: videoId,
      users: [socket.id]
    };
    console.log(`Room created: ${room}`);
  });

  socket.on('join', (room) => {
    socket.join(room);
    if (rooms[room]) {
      rooms[room].users.push(socket.id);
      socket.emit('room-info', {
        playerType: rooms[room].playerType,
        videoId: rooms[room].videoId
      });
      io.to(rooms[room].host).emit('get-sync');
    }
    console.log(`Joined room: ${room}`);
  });

  socket.on('player-event', (data) => {
    socket.to(data.room).emit('player-event', data.event);
  });

  socket.on('sync', (data) => {
    io.to(data.room).emit('sync', data.event);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    for (const room in rooms) {
      const index = rooms[room].users.indexOf(socket.id);
      if (index !== -1) {
        rooms[room].users.splice(index, 1);
        if (rooms[room].users.length === 0) {
          delete rooms[room];
          console.log(`Room closed: ${room}`);
        }
        break;
      }
    }
  });
});

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});