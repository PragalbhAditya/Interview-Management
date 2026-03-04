const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Initialize the Next.js app
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a specific room's channel
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Dashboard global channel
    socket.on("joinDashboard", () => {
      socket.join("dashboard");
      console.log(`Socket ${socket.id} joined dashboard`);
    });

    // Broadcast that a check-in occurred so dashboard and relevant rooms can update
    socket.on("studentCheckedIn", ({ roomId }) => {
      io.to(roomId).emit("queueUpdated");
      io.to("dashboard").emit("dashboardUpdated");
    });

    // Broadcast that next student was called
    socket.on("studentCalled", ({ roomId, student }) => {
      // Alert the room and its display board
      io.to(roomId).emit("queueUpdated");
      io.to(roomId).emit("playBell", student);
      
      // Alert the dashboard
      io.to("dashboard").emit("dashboardUpdated");
    });

    // Broadcast queue pause/resume or end interview
    socket.on("roomStatusChanged", ({ roomId }) => {
      io.to(roomId).emit("queueUpdated");
      io.to("dashboard").emit("dashboardUpdated");
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
