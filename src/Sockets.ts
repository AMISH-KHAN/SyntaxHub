import { io } from 'socket.io-client';

export const initSocket = async () => {
    const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    let backendUrl = import.meta.env.VITE_APP_BACKEND_URL;

    // If on a deployed environment, ignore any baked-in localhost URL and use the current host origin
    if (!isLocalhost && (!backendUrl || backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1'))) {
        backendUrl = window.location.origin;
    } else if (isLocalhost && !backendUrl) {
        backendUrl = 'http://localhost:3000';
    }

    const options = {
        forceNew: true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ['websocket', 'polling'],
    };

    return io(backendUrl || undefined, options);
};