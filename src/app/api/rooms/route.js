import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Room from "@/models/Room";

export async function GET() {
    try {
        await connectDB();

        let rooms = await Room.find().populate('currentStudent').sort({ name: 1 });

        // Seed default rooms if none exist
        if (rooms.length === 0) {
            await Room.insertMany([
                { name: "Room 1" },
                { name: "Room 2" },
                { name: "Room 3" }
            ]);
            rooms = await Room.find().populate('currentStudent').sort({ name: 1 });
        }

        return NextResponse.json(rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
    }
}
