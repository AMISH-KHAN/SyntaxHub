const express = require('express');
const { createServer } = require('node:http');
const cors=require('cors')
const { Server} = require('socket.io')

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173"
  }
});


app.use(cors())



app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
  
  socket.emit("hello", "world");
  socket.on("code", (args) => {
    socket.broadcast.emit("newcode",args)
  })
})

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});