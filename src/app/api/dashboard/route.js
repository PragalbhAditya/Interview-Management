import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Room from "@/models/Room";

export async function GET() {
    try {
        await connectDB();

        const [rooms, students] = await Promise.all([
            Room.find().populate('currentStudent'),
            Student.find()
        ]);

        const totalStudents = students.length;
        const checkedIn = students.filter(s => s.status !== 'COMPLETED').length;
        const interviewed = students.filter(s => s.status === 'COMPLETED').length;
        const waiting = students.filter(s => s.status === 'WAITING').length;

        // Calculate Average Interview Duration (only for those who completed)
        const completedStudents = students.filter(s => s.interviewStartTime && s.interviewEndTime);
        let avgDuration = 15; // default

        if (completedStudents.length > 0) {
            const totalDur = completedStudents.reduce((acc, s) => {
                const start = new Date(s.interviewStartTime);
                const end = new Date(s.interviewEndTime);
                return acc + (end - start);
            }, 0);
            avgDuration = Math.round((totalDur / completedStudents.length) / (1000 * 60));
        }

        // Estimated completion time
        // Roughly: (Waiting Students / Active Rooms) * Avg Duration
        const activeRooms = rooms.filter(r => r.status === 'ACTIVE').length;
        let estimatedRemainingMinutes = 0;
        if (activeRooms > 0 && waiting > 0) {
            estimatedRemainingMinutes = Math.ceil((waiting / activeRooms) * avgDuration);
        }

        return NextResponse.json({
            rooms,
            stats: {
                totalStudents,
                checkedIn,
                interviewed,
                waiting,
                avgDuration,
                estimatedRemainingMinutes
            }
        });

    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}
