import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Room from "@/models/Room";

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
                // 1. Mark current student as COMPLETED if exists
                if (room.currentStudent) {
                    await Student.findByIdAndUpdate(room.currentStudent, {
                        status: "COMPLETED",
                        interviewEndTime: new Date()
                    });
                }

                // 2. Find next WAITING student
                const nextStudent = await Student.findOne({ room: roomId, status: "WAITING" })
                    .sort({ queuePosition: 1 });

                if (nextStudent) {
                    // 3. Update next student to INTERVIEWING
                    await Student.findByIdAndUpdate(nextStudent._id, {
                        status: "INTERVIEWING",
                        interviewStartTime: new Date()
                    });

                    // 4. Update room with new currentStudent
                    room.currentStudent = nextStudent._id;
                    await room.save();
                    return NextResponse.json({ message: "Next student called", student: nextStudent });
                } else {
                    // No one in queue
                    room.currentStudent = null;
                    await room.save();
                    return NextResponse.json({ message: "Queue is empty", student: null });
                }

            case "END_INTERVIEW":
                if (room.currentStudent) {
                    await Student.findByIdAndUpdate(room.currentStudent, {
                        status: "COMPLETED",
                        interviewEndTime: new Date()
                    });
                    room.currentStudent = null;
                    await room.save();
                }
                return NextResponse.json({ message: "Interview ended" });

            case "TOGGLE_PAUSE":
                room.status = room.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
                await room.save();
                return NextResponse.json({ message: `Room is now ${room.status}`, status: room.status });

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Action error:", error);
        return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
    }
}
