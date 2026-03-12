import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Room from "@/models/Room";

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');
        const studentId = searchParams.get('studentId');
        const status = searchParams.get('status');

        let query = {};
        if (roomId) query.room = roomId;
        if (status) {
            if (status === 'active') {
                query.status = { $in: ['WAITING', 'INTERVIEWING'] };
            } else {
                query.status = status;
            }
        }
        if (studentId) query._id = studentId;

        const students = await Student.find(query).populate('room').sort({ queuePosition: 1, checkInTime: 1 });

        return NextResponse.json(students);
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { name, registrationNumber, branch, contactNumber, roomId } = body;

        if (!name || !registrationNumber) {
            return NextResponse.json({ error: "Name and registration number are required" }, { status: 400 });
        }

        // Check if student already exists and is active
        const existingActive = await Student.findOne({
            registrationNumber,
            status: { $in: ["WAITING", "INTERVIEWING"] }
        });

        if (existingActive) {
            return NextResponse.json({ error: "Student is already in queue" }, { status: 400 });
        }

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

        // Determine Queue Position for the assigned room
        const lastStudent = await Student.findOne({
            room: assignedRoomId,
            status: "WAITING"
        }).sort({ queuePosition: -1 });

        const queuePosition = lastStudent ? lastStudent.queuePosition + 1 : 1;

        // Create or Update student
        const student = await Student.findOneAndUpdate(
            { registrationNumber },
            {
                name,
                branch: branch || "",
                contactNumber: contactNumber || "",
                room: assignedRoomId,
                status: "WAITING",
                queuePosition,
                checkInTime: new Date()
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ message: "Student added manually", student }, { status: 201 });

    } catch (error) {
        console.error("Manual add error:", error);
        return NextResponse.json({ error: error.message || "Failed to add student" }, { status: 500 });
    }
}
