import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "data", "students.xlsx");

        if (!fs.existsSync(filePath)) {
            // If main file doesn't exist, try to find any backup or return error
            return NextResponse.json({ error: "No template available. Please upload a file first." }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": 'attachment; filename="students_template.xlsx"',
            },
        });
    } catch (error) {
        console.error("Template download error:", error);
        return NextResponse.json({ error: "Failed to download template" }, { status: 500 });
    }
}
