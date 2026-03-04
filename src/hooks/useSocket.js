import { useEffect, useState } from "react";
import io from "socket.io-client";

let socket;

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!socket) {
            // Connect to the same origin since we're using a custom server
            socket = io();

            socket.on("connect", () => {
                setIsConnected(true);
            });

            socket.on("disconnect", () => {
                setIsConnected(false);
            });
        } else if (socket.connected) {
            setIsConnected(true);
        }

        return () => {
            // Don't disconnect here if we want a global singleton connection across pages
            // But we can cleanup listeners if needed
        };
    }, []);

    return { socket, isConnected };
};
