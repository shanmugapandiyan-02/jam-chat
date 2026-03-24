import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_SERVER_URL, {
    autoConnect: false,
    transports: ["websocket"],
    reconnection: true,
});
