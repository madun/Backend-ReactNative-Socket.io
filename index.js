const express = require('express');
const app = express();
const server = require('http').createServer(app);
const conn = require('./db').conn;
const io = require('socket.io').listen(server);
const {User, Conversation, Message} = require('./db').models;
conn.sync({logging: false, force: true});
const port = 3000;

const mobileSockets = {};

io.on('connection', (socket) => {
  console.log('a user connected :D');
  socket.on('newUser', (credentials) => {
    const {name, password} = credentials;
    Promise.all([
      User.findOrCreate({
        where: {
          name,
          password,
        },
      }),
      User.findAll(),
    ]).then(([user, users]) => {
      mobileSockets[user[0].id] = socket.id;
      socket.emit('userCreated', {user: user[0], users});
      // console.log('userCreated', {user: user[0], users});
      socket.broadcast.emit('newUser', user[0]);
    });
  });

  socket.on('chat', (users) => {
    Conversation.findOrCreateConversation(
      users.user.id,
      users.receiver.id,
    ).then((conversation) => {
      // console.log('priorMessages', conversation.messages);
      socket.emit('priorMessages', conversation.messages);
    });
  });

  socket.on('message', ({text, sender, receiver}) => {
    // console.log('message', text, sender, receiver);
    Message.createMessage(text, sender, receiver).then((message) => {
      socket.emit('incomingMessage', message);
      const receiverSocketId = mobileSockets[receiver.id];
      socket.to(receiverSocketId).emit('incomingMessage', message);
    });
  });
});

server.listen(port, () => console.log('server running on port : ' + port));
