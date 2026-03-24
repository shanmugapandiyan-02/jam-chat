const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, change to frontend URL
        methods: ["GET", "POST"]
    }
});

let waitingQueue = [];
let activePairs = new Map(); // socketId -> peerSocketId

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    const matchUser = () => {
        if (waitingQueue.length > 0) {
            const peerSocketId = waitingQueue.shift();
            
            // Avoid matching with self (though unlikely if handled right)
            if (peerSocketId === socket.id) {
                waitingQueue.push(socket.id);
                return;
            }

            activePairs.set(socket.id, peerSocketId);
            activePairs.set(peerSocketId, socket.id);

            // Notify both users
            io.to(socket.id).emit('match-found', { peerId: peerSocketId, initiator: true });
            io.to(peerSocketId).emit('match-found', { peerId: socket.id, initiator: false });
            
            console.log(`Matched: ${socket.id} <-> ${peerSocketId}`);
        } else {
            waitingQueue.push(socket.id);
            console.log(`User ${socket.id} added to queue`);
        }
    };

    socket.on('join-queue', () => {
        // Clean up any existing state first
        removeFromQueue(socket.id);
        removeFromPair(socket.id);
        matchUser();
    });

    socket.on('offer', ({ to, offer }) => {
        io.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', ({ to, answer }) => {
        io.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
        io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        removeFromQueue(socket.id);
        removeFromPair(socket.id);
    });

    function removeFromQueue(id) {
        waitingQueue = waitingQueue.filter(socketId => socketId !== id);
    }

    function removeFromPair(id) {
        const peerId = activePairs.get(id);
        if (peerId) {
            io.to(peerId).emit('peer-disconnected');
            activePairs.delete(id);
            activePairs.delete(peerId);
        }
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
