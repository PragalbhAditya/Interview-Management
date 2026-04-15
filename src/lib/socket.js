/**
 * Server-side Socket.io emitter utility.
 * 
 * Next.js API routes run in the same Node.js process as server.js,
 * so we can share the Socket.io instance via a global variable.
 */

export function getIO() {
    return global._socketIO || null;
}

export function emitQueueUpdated(roomId) {
    const io = getIO();
    if (!io) return;

    // Always emit globally so Command Center and public boards receive updates
    io.emit("queueUpdated");

    if (roomId) {
        // Also emit to specific room for legacy/targeted listeners if any
        io.to(String(roomId)).emit("queueUpdated");
    }

    // Always notify the admin dashboard
    io.to("dashboard").emit("dashboardUpdated");
}

export function emitPlayBell(roomId, student) {
    const io = getIO();
    if (!io) return;
    if (roomId) {
        io.to(String(roomId)).emit("playBell", student);
    }
}

export function emitGDGroupCalled(roomId, students) {
    const io = getIO();
    if (!io) return;
    if (roomId) {
        io.to(String(roomId)).emit("gdGroupCalled", students);
    }
}
