import { NextResponse } from "next/server";
import path from "path";
import * as XLSX from "xlsx";
import fs from "fs";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const registrationNumber = searchParams.get("registrationNumber");

    if (!registrationNumber) {
        return NextResponse.json({ error: "Registration number is required" }, { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), "data", "students.xlsx");

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "Student database not found" }, { status: 500 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const student = data.find(s =>
            String(s["Registration Number"]).toUpperCase() === registrationNumber.toUpperCase()
        );

        if (!student) {
            return NextResponse.json({ error: "Student not found in database" }, { status: 404 });
        }

        return NextResponse.json({ name: student["Name"] });
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: "Failed to verify student" }, { status: 500 });
    }
}
