import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Room from "@/models/Room";
import { emitQueueUpdated, emitPlayBell } from "@/lib/socket";

export async function POST(request) {
    try {
        await connectDB();
        const { action, roomId } = await request.json();

        if (!roomId || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const room = await Room.findById(roomId);
        if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

        switch (action) {
            case "CALL_NEXT":
                // In interview context, we only call students who are WAITING (which means they either checked in without GD or passed GD)
                const nextStudent = await Student.findOne({ room: roomId, status: "WAITING" })
                    .sort({ queuePosition: 1 });

                if (nextStudent) {
                    await Student.findByIdAndUpdate(nextStudent._id, {
                        status: "INTERVIEWING",
                        interviewStartTime: new Date()
                    });

                    if (!room.currentStudents) room.currentStudents = [];
                    room.currentStudents.push(nextStudent._id);
                    await room.save();

                    // Real-time broadcast
                    emitQueueUpdated(roomId);
                    emitPlayBell(roomId, nextStudent);

                    return NextResponse.json({ message: "Student called", student: nextStudent });
                } else {
                    return NextResponse.json({ message: "Queue is empty", student: null });
                }

            case "END_INTERVIEW":
                if (room.currentStudents && room.currentStudents.length > 0) {
                    await Student.updateMany(
                        { _id: { $in: room.currentStudents } },
                        {
                            status: "COMPLETED",
                            interviewEndTime: new Date()
                        }
                    );
                    room.currentStudents = [];
                    await room.save();

                    // Real-time broadcast
                    emitQueueUpdated(roomId);
                }
                return NextResponse.json({ message: "Interviews ended" });

            case "TOGGLE_GD":
                room.isGDEnabled = !room.isGDEnabled;
                await room.save();

                // If turned ON, move all WAITING students to GD_WAITING
                if (room.isGDEnabled) {
                    await Student.updateMany(
                        { room: roomId, status: "WAITING" },
                        { status: "GD_WAITING" }
                    );
                }

                emitQueueUpdated(roomId);
                return NextResponse.json({ message: `GD Mode ${room.isGDEnabled ? 'Enabled' : 'Disabled'}` });

            case "CALL_GD_GROUP":
                const gdWaiting = await Student.find({ room: roomId, status: "GD_WAITING" })
                    .sort({ queuePosition: 1 })
                    .limit(10);

                if (gdWaiting.length > 0) {
                    const ids = gdWaiting.map(s => s._id);
                    await Student.updateMany({ _id: { $in: ids } }, { status: "GD_ONGOING" });
                    
                    room.currentGDGroup = ids;
                    await room.save();

                    emitQueueUpdated(roomId);
                    const { emitGDGroupCalled } = require("@/lib/socket"); // Dynamic import to ensure latest
                    emitGDGroupCalled(roomId, gdWaiting);

                    return NextResponse.json({ message: `${gdWaiting.length} students called for GD`, students: gdWaiting });
                }
                return NextResponse.json({ error: "No students waiting for GD" }, { status: 400 });

            case "PROCESS_GD_RESULTS":
                const { passedIds, failedIds } = await request.clone().json();
                
                if (passedIds && passedIds.length > 0) {
                    // Update passed students to WAITING (for interview)
                    await Student.updateMany({ _id: { $in: passedIds } }, { status: "WAITING" });
                }
                
                if (failedIds && failedIds.length > 0) {
                    await Student.updateMany({ _id: { $in: failedIds } }, { status: "GD_FAILED" });
                }

                // Clear current GD group
                room.currentGDGroup = [];
                await room.save();

                emitQueueUpdated(roomId);
                return NextResponse.json({ message: "GD results processed" });

            case "TOGGLE_PAUSE":
                room.status = room.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
                await room.save();

                // Real-time broadcast
                emitQueueUpdated(roomId);

                return NextResponse.json({ message: `Room is now ${room.status}`, status: room.status });

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Action error:", error);
        return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
    }
}
