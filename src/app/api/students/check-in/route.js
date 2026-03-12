import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Room from "@/models/Room";
import path from "path";
import * as XLSX from "xlsx";
import fs from "fs";

export async function POST(request) {
    try {
        await connectDB();
        let { name, registrationNumber, roomId } = await request.json();

        if (!registrationNumber) {
            return NextResponse.json({ error: "Registration number is required" }, { status: 400 });
        }

        // Verify name from Excel if not provided or to ensure accuracy
        const filePath = path.join(process.cwd(), "data", "students.xlsx");
        let studentData = null;
        if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);

            studentData = data.find(s =>
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
                branch: studentData ? studentData["Branch/Stream"] : "",
                contactNumber: studentData ? String(studentData["Contact No"]) : "",
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
        return NextResponse.json({ error: error.message || "Failed to check in" }, { status: 500 });
    }
}
