import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Room from "@/models/Room";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

export async function PATCH(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const { status } = await request.json();

        if (!["WAITING", "INTERVIEWING", "COMPLETED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        let student;

        if (id.startsWith("master-")) {
            // Manual check-in of a pre-registered student
            const regNo = id.replace("master-", "");

            // Fetch from Excel
            const filePath = path.join(process.cwd(), "data", "students.xlsx");
            if (!fs.existsSync(filePath)) {
                return NextResponse.json({ error: "Master list not found" }, { status: 500 });
            }

            const fileBuffer = fs.readFileSync(filePath);
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            const masterData = data.find(s => String(s["Registration Number"]).toUpperCase() === regNo.toUpperCase());

            if (!masterData) {
                return NextResponse.json({ error: "Student not found in master list" }, { status: 404 });
            }

            // Assign to a room (load balance if possible, or just pick first active)
            const rooms = await Room.find({ status: "ACTIVE" });
            if (rooms.length === 0) {
                return NextResponse.json({ error: "No active rooms available for manual check-in" }, { status: 400 });
            }

            // Basic load balance
            let minQueue = Infinity;
            let selectedRoom = rooms[0];
            for (let r of rooms) {
                const waitingCount = await Student.countDocuments({ room: r._id, status: "WAITING" });
                if (waitingCount < minQueue) { minQueue = waitingCount; selectedRoom = r; }
            }

            student = await Student.findOneAndUpdate(
                { registrationNumber: regNo },
                {
                    name: masterData["Name"],
                    registrationNumber: regNo,
                    branch: masterData["Branch/Stream"],
                    contactNumber: String(masterData["Contact No"]),
                    room: selectedRoom._id,
                    status: status,
                    checkInTime: new Date(),
                    queuePosition: 999 // Admin move
                },
                { upsert: true, new: true }
            );
        } else {
            student = await Student.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            );
        }

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Status updated", student });
    } catch (error) {
        console.error("Status update error:", error);
        return NextResponse.json({ error: "Failed to update status: " + error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;

        if (id.startsWith("master-")) {
            return NextResponse.json({ error: "Cannot delete pre-registered student. They must check in first or be removed from Excel." }, { status: 400 });
        }

        const student = await Student.findByIdAndDelete(id);

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Student removed from queue" });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
    }
}
