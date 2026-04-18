const http  = require("http");
const https = require("https");
const fs    = require("fs");
const path  = require("path");
const { networkInterfaces } = require("os");
const next = require("next");
const { Server } = require("socket.io");

const dev      = process.env.NODE_ENV !== "production";
const port     = process.env.PORT || 6969;

// ── HTTPS auto-detection ───────────────────────────────────────────────────────
// Browsers block getUserMedia (microphone) on non-localhost HTTP origins.
// If certs/cert.pem + certs/key.pem exist (run `npm run generate-cert` once),
// the server upgrades to HTTPS so phones on the LAN can use the microphone.
const certFile = path.join(__dirname, "certs", "cert.pem");
const keyFile  = path.join(__dirname, "certs", "key.pem");
const useHttps = fs.existsSync(certFile) && fs.existsSync(keyFile);

// ── Local IP (for helpful startup log) ────────────────────────────────────────
function getLocalIP() {
  for (const iface of Object.values(networkInterfaces())) {
    for (const addr of iface) {
      if (addr.family === "IPv4" && !addr.internal) return addr.address;
    }
  }
  return "127.0.0.1";
}

// Next.js needs hostname="0.0.0.0" so it accepts connections from the network
const hostname = "0.0.0.0";
const app      = next({ dev, hostname, port, dir: __dirname });
const handler  = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = useHttps
    ? https.createServer({ cert: fs.readFileSync(certFile), key: fs.readFileSync(keyFile) }, handler)
    : http.createServer(handler);

  const io = new Server(httpServer, {
    transports: ["websocket"],
    maxHttpBufferSize: 2e6, // 2 MB — enough for a full voice chunk burst
  });

  // Expose io globally so Next.js API routes can emit events server-side
  global._socketIO = io;

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

    // Voice chat — join a team channel
    socket.on("joinTeam", ({ team, name }) => {
      if (socket.currentTeam) {
        socket.leave(`team:${socket.currentTeam}`);
      }
      socket.join(`team:${team}`);
      socket.currentTeam = team;
      socket.displayName = name;
      console.log(`${name} joined team channel: ${team}`);
    });

    // Voice chat — someone started transmitting
    socket.on("userSpeaking", ({ team, name }) => {
      socket.to(`team:${team}`).emit("userSpeaking", { name });
    });

    // Voice chat — relay an audio chunk to the team (excludes sender)
    socket.on("voiceChunk", ({ team, name, chunk, mimeType }) => {
      socket.to(`team:${team}`).emit("voiceChunk", { name, chunk, mimeType });
    });

    // Voice chat — someone finished transmitting
    socket.on("userStoppedSpeaking", ({ team, name }) => {
      socket.to(`team:${team}`).emit("userStoppedSpeaking", { name });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, hostname, () => {
    const proto  = useHttps ? "https" : "http";
    const localIP = getLocalIP();
    console.log(`> Ready on ${proto}://localhost:${port}`);
    console.log(`> Network:  ${proto}://${localIP}:${port}`);
    if (!useHttps) {
      console.log(`\n  ⚠  Microphone will be blocked on network devices.`);
      console.log(`     Run \`npm run generate-cert\` then restart to enable HTTPS.\n`);
    }
  });
});
