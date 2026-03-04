import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Room from "@/models/Room";

export async function POST(request) {
    try {
        await connectDB();
        const { name, registrationNumber, roomId } = await request.json();

        if (!name || !registrationNumber) {
            return NextResponse.json({ error: "Name and Reg. No are required" }, { status: 400 });
        }

        // Default processing for load balancing rooms if not selected explicitly
        let assignedRoomId = roomId;

        if (!assignedRoomId) {
            // Find room with minimum students waiting
            const rooms = await Room.find({ status: "ACTIVE" });
            if (rooms.length === 0) {
                return NextResponse.json({ error: "No active rooms available" }, { status: 400 });
            }

            let minQueue = Infinity;
            let selectedRoom = rooms[0];

            for (let r of rooms) {
                const waitingCount = await Student.countDocuments({ room: r._id, status: "WAITING" });
                if (waitingCount < minQueue) {
                    minQueue = waitingCount;
                    selectedRoom = r;
                }
            }
            assignedRoomId = selectedRoom._id;
        }

        // Check if student already exists and is not COMPLETED
        const existingStudent = await Student.findOne({ registrationNumber, status: { $in: ["WAITING", "INTERVIEWING"] } });
        if (existingStudent) {
            return NextResponse.json({
                message: "You are already active in the queue.",
                student: existingStudent
            }, { status: 200 }); // OK, redirect to status
        }

        // Determine Queue Position for the assigned room
        const lastStudent = await Student.findOne({
            room: assignedRoomId,
            status: "WAITING"
        }).sort({ queuePosition: -1 });

        const queuePosition = lastStudent ? lastStudent.queuePosition + 1 : 1;

        // Create new checking
        // Note: in a real situation, we might overwrite a previous checkin if they were COMPLETED. 
        // Here we findOneAndUpdate to support reapplying or simply create. Let's create.
        const newStudent = await Student.findOneAndUpdate(
            { registrationNumber },
            {
                name,
                room: assignedRoomId,
                status: "WAITING",
                queuePosition,
                checkInTime: new Date()
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ message: "Check-in successful", student: newStudent }, { status: 201 });

    } catch (error) {
        console.error("Check-in error:", error);
        return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
    }
}
