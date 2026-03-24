import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import Razorpay from 'razorpay';

dotenv.config();

const app = express();
app.use(express.json());

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

app.use(cors({
  origin: CLIENT_URL,
  methods: ["GET", "POST"],
  credentials: true
}));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency,
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Order creation failed' });
  }
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

interface User {
  socketId: string;
  userId?: string;
  isPairing: boolean;
  peerId?: string;
}

let waitingQueue: string[] = [];
let activePairs: Map<string, string> = new Map(); // socketId -> peerSocketId

io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('start-chat', () => {
    // Check if user is already in queue or paired
    if (waitingQueue.includes(socket.id) || activePairs.has(socket.id)) return;

    if (waitingQueue.length > 0) {
      const peerSocketId = waitingQueue.shift()!;

      // Pair users
      activePairs.set(socket.id, peerSocketId);
      activePairs.set(peerSocketId, socket.id);

      // Notify both users
      io.to(socket.id).emit('match-found', { peerId: peerSocketId, role: 'initiator' });
      io.to(peerSocketId).emit('match-found', { peerId: socket.id, role: 'receiver' });

      console.log(`Matched: ${socket.id} <-> ${peerSocketId}`);
    } else {
      waitingQueue.push(socket.id);
      socket.emit('waiting', { message: 'Searching for a stranger...' });
      console.log(`User added to queue: ${socket.id}`);
    }
  });

  socket.on('next-chat', () => {
    disconnectPair(socket.id);
    // Add back to queue automatically
    socket.emit('searching');
    socket.emit('start-chat'); // Recursive start call? No, better handle on client.
  });

  // Signaling
  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  socket.on('send-message', ({ to, message }) => {
    io.to(to).emit('receive-message', { from: socket.id, message });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    disconnectPair(socket.id);
    waitingQueue = waitingQueue.filter(id => id !== socket.id);
  });

  function disconnectPair(socketId: string) {
    const peerSocketId = activePairs.get(socketId);
    if (peerSocketId) {
      activePairs.delete(socketId);
      activePairs.delete(peerSocketId);
      io.to(peerSocketId).emit('peer-disconnected');
      console.log(`Pair disconnected: ${socketId} <-> ${peerSocketId}`);
    }
    // Remove from queue if they were there
    waitingQueue = waitingQueue.filter(id => id !== socketId);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
