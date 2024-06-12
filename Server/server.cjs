const express = require('express');
const { createServer } = require('node:http');
const cors=require('cors')
const { Server} = require('socket.io');
const { join } = require('node:path');

const app = express();
const server = createServer(app);
const io = new Server(server);


app.use(cors())

app.use(express.static(join(__dirname, "../dist/")));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname,"../dist/index.html"))
});


const userMap={}
function getClientData(roomId){
  return Array.from(io.sockets.adapter.rooms.get(roomId)||[]).map((socketId) => {
    return {
      socketId,
      userName:userMap[socketId]
        }
      })
}

io.on('connection', (socket) => {
  // socket.emit("hello", socket.id);
  socket.on("join", ({ roomId, userName }) => {
    userMap[socket.id] = userName
    socket.join(roomId)
    // console.log(userName)
    const clients = getClientData(roomId)
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        userName,
        socketId:socket.id
      })
    })
    // socket.in(roomId).emit("joined",userName )
    socket.on("change_code", ({ roomId, code }) => {
      // console.log(code)
      socket.in(roomId).emit("change_code", code)
      
    })
    socket.on("sync_code", ({ socketId, code }) => {
      // console.log(code)
      io.to(socketId).emit("change_code", code)
      
    })
    
    socket.on("change_lang", ({ selected, defaultValue, roomId }) => {
      socket.in(roomId).emit("change_lang", {selected,defaultValue })
      })
        socket.on("sync_lang", ({ socketId, code,language }) => {
          io.to(socketId).emit("change_lang", {selected:language,defaultValue:code})
          
        })
  })

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms]
    
    rooms.forEach((roomId) => {
      socket.in(roomId).emit("disconnected", {
        socketId:socket.id,
        userName:userMap[socket.id]
      })
    })
    delete userMap[socket.id]
    socket.leave()
  })
})

const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});