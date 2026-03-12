import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Room from "@/models/Room";
import Student from "@/models/Student";

export async function GET() {
    try {
        await connectDB();

        let rooms = await Room.find().populate('currentStudent').sort({ name: 1 });

        // Seeding logic removed as per user request to remove all rooms.
        return NextResponse.json(rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
    }
}
