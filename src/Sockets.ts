import { io } from 'socket.io-client';

export const initSocket = async () => {
    const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const backendUrl =
        import.meta.env.VITE_APP_BACKEND_URL ||
        (isLocalhost ? 'http://localhost:3000' : window.location.origin);
    const options = {
        forceNew: true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ['websocket', 'polling'],
    };
    return io(backendUrl, options);
};