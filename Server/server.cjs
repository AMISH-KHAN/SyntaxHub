const express = require('express');
const { createServer } = require('node:http');
const cors=require('cors')
const { Server} = require('socket.io');
const { join } = require('node:path');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


app.use(cors())

app.use(express.static(join(__dirname, "../dist/")));

app.get('*', (req, res) => {
  res.sendFile(join(__dirname,"../dist/index.html"))
});


const Y = require('yjs');

const userMap = {};
const socketClientIdMap = {};
const roomDocs = new Map(); // roomId -> { doc: Y.Doc, language: string }

function getOrCreateRoom(roomId) {
  if (!roomDocs.has(roomId)) {
    const doc = new Y.Doc();
    const ytext = doc.getText('monaco');
    const defaultCode = `// Welcome to SyntaxHub Collaborative Editor\n// Room ID: ${roomId}\n\nfunction helloWorld() {\n  console.log("Hello, collaborative world!");\n}\n\nhelloWorld();\n`;
    ytext.insert(0, defaultCode);
    roomDocs.set(roomId, { doc, language: 'javascript' });
  }
  return roomDocs.get(roomId);
}

function getClientData(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
    return {
      socketId,
      userName: userMap[socketId],
      clientId: socketClientIdMap[socketId]
    };
  });
}

io.on('connection', (socket) => {
  socket.on("join", ({ roomId, userName, clientId }) => {
    userMap[socket.id] = userName;
    if (clientId !== undefined) {
      socketClientIdMap[socket.id] = clientId;
    }
    socket.join(roomId);

    const roomData = getOrCreateRoom(roomId);

    // Send initial Yjs document state, active language, and last output if any
    const stateVector = Y.encodeStateAsUpdate(roomData.doc);
    socket.emit("yjs_init", {
      update: Buffer.from(stateVector),
      language: roomData.language,
      lastOutput: roomData.lastOutput || null
    });

    const clients = getClientData(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients,
        userName,
        socketId: socket.id,
        clientId
      });
    });
  });

  // Broadcast code execution start to room
  socket.on("code_run_start", ({ roomId, userName }) => {
    socket.to(roomId).emit("code_run_start", { userName });
  });

  // Broadcast code execution result to room
  socket.on("code_run_result", ({ roomId, output, error, ranBy }) => {
    const roomData = roomDocs.get(roomId);
    if (roomData) {
      roomData.lastOutput = { output, error, ranBy };
    }
    socket.to(roomId).emit("code_run_result", { output, error, ranBy });
  });

  // Handle Yjs document binary CRDT updates
  socket.on("yjs_update", ({ roomId, update }) => {
    const roomData = roomDocs.get(roomId);
    if (roomData && update) {
      try {
        const updateArray = new Uint8Array(update);
        Y.applyUpdate(roomData.doc, updateArray);
        socket.to(roomId).emit("yjs_update", update);
      } catch (err) {
        console.error("Error applying Yjs update on server:", err);
      }
    }
  });

  // Relay awareness / cursor positions to other peers in the room
  socket.on("yjs_awareness_update", ({ roomId, update }) => {
    if (roomId && update) {
      socket.to(roomId).emit("yjs_awareness_update", update);
    }
  });

  // Handle language switch
  socket.on("change_lang", ({ selected, defaultValue, roomId, updateCode }) => {
    const roomData = roomDocs.get(roomId);
    if (roomData) {
      roomData.language = selected;
      if (updateCode && defaultValue) {
        const ytext = roomData.doc.getText('monaco');
        roomData.doc.transact(() => {
          ytext.delete(0, ytext.length);
          ytext.insert(0, defaultValue);
        });
        const update = Y.encodeStateAsUpdate(roomData.doc);
        io.to(roomId).emit("yjs_update", Buffer.from(update));
      }
    }
    socket.to(roomId).emit("change_lang", { selected });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    const clientId = socketClientIdMap[socket.id];

    rooms.forEach((roomId) => {
      socket.in(roomId).emit("disconnected", {
        socketId: socket.id,
        userName: userMap[socket.id],
        clientId
      });
    });
    delete userMap[socket.id];
    delete socketClientIdMap[socket.id];
    socket.leave();
  });
});

const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});