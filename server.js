 1 const express = require('express');
    2 const app = express();
    3 const http = require('http').Server(app);
    4 const io = require('socket.io')(http);
    5 const port = process.env.PORT || 3000;
    6
    7 let rooms = {};
    8
    9 // This line tells the server to send the index.html file when someone visits your URL
   10 app.get('/', (req, res) => {
   11   res.sendFile(__dirname + '/index.html');
   12 });
   13
   14 io.on('connection', (socket) => {
   15   console.log('a user connected');
   16
   17   socket.on('create', (data) => {
   18     const { room, videoId, playerType } = data;
   19     socket.join(room);
   20     rooms[room] = {
   21       host: socket.id,
   22       playerType: playerType,
   23       videoId: videoId,
   24       users: [socket.id]
   25     };
   26     console.log(`Room created: ${room}`);
   27   });
   28
   29   socket.on('join', (room) => {
   30     socket.join(room);
   31     if (rooms[room]) {
   32       rooms[room].users.push(socket.id);
   33       socket.emit('room-info', {
   34         playerType: rooms[room].playerType,
   35         videoId: rooms[room].videoId
   36       });
   37       io.to(rooms[room].host).emit('get-sync');
   38     }
   39     console.log(`Joined room: ${room}`);
   40   });
   41
   42   socket.on('player-event', (data) => {
   43     socket.to(data.room).emit('player-event', data.event);
   44   });
   45
   46   socket.on('sync', (data) => {
   47     io.to(data.room).emit('sync', data.event);
   48   });
   49
   50   socket.on('disconnect', () => {
   51     console.log('user disconnected');
   52     for (const room in rooms) {
   53       const index = rooms[room].users.indexOf(socket.id);
   54       if (index !== -1) {
   55         rooms[room].users.splice(index, 1);
   56         if (rooms[room].users.length === 0) {
   57           delete rooms[room];
   58           console.log(`Room closed: ${room}`);
   59         }
   60         break;
   61       }
   62     }
   63   });
   64 });
   65
   66 http.listen(port, () => {
   67   console.log(`listening on *:${port}`);
   68 });
