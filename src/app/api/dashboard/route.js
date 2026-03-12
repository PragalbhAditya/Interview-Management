import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Room from "@/models/Room";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

export async function GET() {
    try {
        await connectDB();

        const [rooms, students] = await Promise.all([
            Room.find().populate('currentStudent'),
            Student.find()
        ]);

        // Load master list from Excel
        let masterList = [];
        try {
            const filePath = path.join(process.cwd(), "data", "students.xlsx");
            if (fs.existsSync(filePath)) {
                const fileBuffer = fs.readFileSync(filePath);
                const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                masterList = XLSX.utils.sheet_to_json(worksheet);
            }
        } catch (e) {
            console.error("Master list load error:", e);
        }

        const totalStudents = masterList.length || students.length;
        const checkedInTotal = students.length;
        const interviewed = students.filter(s => s.status === 'COMPLETED').length;
        const waiting = students.filter(s => s.status === 'WAITING' || s.status === 'INTERVIEWING').length;
        const notArrived = Math.max(0, totalStudents - checkedInTotal);

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
            students,
            masterList,
            stats: {
                totalStudents,
                checkedIn: checkedInTotal,
                interviewed,
                waiting,
                notArrived,
                avgDuration,
                estimatedRemainingMinutes
            }
        });

    } catch (error) {
        console.error("CRITICAL Dashboard API error:", error);
        // Log more details if it's a Mongoose error
        if (error.name === 'MongooseError' || error.name === 'MongoError') {
            console.error("Database connection details:", {
                readyState: mongoose.connection.readyState,
                host: mongoose.connection.host
            });
        }
        return NextResponse.json({
            error: "Failed to fetch dashboard data",
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
