import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const dataDir = path.join(process.cwd(), "data");
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        const filePath = path.join(dataDir, "students.xlsx");

        // Backup existing file if it exists
        if (fs.existsSync(filePath)) {
            const backupPath = path.join(dataDir, `students_backup_${Date.now()}.xlsx`);
            fs.copyFileSync(filePath, backupPath);
        }

        fs.writeFileSync(filePath, buffer);

        return NextResponse.json({ message: "Student database updated successfully" });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to upload student database" }, { status: 500 });
    }
}
