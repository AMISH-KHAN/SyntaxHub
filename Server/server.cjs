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
    console.log("join")
    socket.join(roomId)
    // console.log(userName)
    const clients = getClientData(roomId)
    console.log(clients)
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
      // console.log("data",selected,defaultValue)
      socket.in(roomId).emit("change_lang", {selected,defaultValue })
      })
        socket.on("sync_lang", ({ socketId, code,language }) => {
          console.log(language)
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

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});