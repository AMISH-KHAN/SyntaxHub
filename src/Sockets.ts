import { io } from 'socket.io-client';

export const initSocket = async () => {
    const backendUrl = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000";
    const options = {
        forceNew: true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ['websocket', 'polling'],
    };
    return io(backendUrl, options);
};