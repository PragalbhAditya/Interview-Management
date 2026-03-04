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
