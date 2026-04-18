import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Room from "@/models/Room";
import { emitQueueUpdated } from "@/lib/socket";
import { getStudentRoster } from "@/lib/excelCache";

export async function POST(request) {
    try {
        await connectDB();
        let { name, registrationNumber, roomId } = await request.json();

        if (!registrationNumber) {
            return NextResponse.json({ error: "Registration number is required" }, { status: 400 });
        }

        // Verify name from cached roster
        const roster = getStudentRoster();
        let studentData = null;
        if (roster.length > 0) {
            studentData = roster.find(s =>
                String(s["Registration Number"]).toUpperCase() === registrationNumber.toUpperCase()
            );
            if (studentData) {
                name = studentData["Name"];
            } else if (!name) {
                return NextResponse.json({ error: "Student not found in database" }, { status: 404 });
            }
        } else if (!name) {
            return NextResponse.json({ error: "Name and Reg. No are required" }, { status: 400 });
        }

        // Default processing for load balancing rooms if not selected explicitly
        let assignedRoomId = roomId;

        if (!assignedRoomId) {
            const rooms = await Room.find({ status: "ACTIVE" }, "_id");
            if (rooms.length === 0) {
                return NextResponse.json({ error: "No active rooms available" }, { status: 400 });
            }
            const counts = await Promise.all(
                rooms.map(r => Student.countDocuments({ room: r._id, status: "WAITING" }))
            );
            const minIdx = counts.indexOf(Math.min(...counts));
            assignedRoomId = rooms[minIdx]._id;
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

        // Determine status based on Room settings
        const room = await Room.findById(assignedRoomId);
        const initialStatus = room.isGDEnabled ? "GD_WAITING" : "WAITING";

        // Create or Update student
        const newStudent = await Student.findOneAndUpdate(
            { registrationNumber },
            {
                name,
                branch: studentData ? (studentData["Branch/Stream"] || "") : "",
                contactNumber: studentData ? (String(studentData["Contact No"] || "")) : "",
                room: assignedRoomId,
                status: initialStatus,
                queuePosition,
                checkInTime: new Date()
            },
            { upsert: true, new: true }
        );

        // Broadcast real-time update
        emitQueueUpdated(assignedRoomId);

        return NextResponse.json({ message: "Check-in successful", student: newStudent }, { status: 201 });

    } catch (error) {
        console.error("Check-in error:", error);
        return NextResponse.json({ error: error.message || "Failed to check in" }, { status: 500 });
    }
}
