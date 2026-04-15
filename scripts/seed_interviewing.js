const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const XLSX = require('xlsx');

// Schemas
const studentSchema = new mongoose.Schema({
    name: String,
    registrationNumber: String,
    branch: String,
    contactNumber: String,
    status: String,
    room: mongoose.Schema.Types.ObjectId,
    interviewStartTime: Date
});

const roomSchema = new mongoose.Schema({
    name: String,
    currentStudent: mongoose.Schema.Types.ObjectId,
    status: String
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);

async function run() {
    try {
        const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
        const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
        const mongoUri = mongoMatch ? mongoMatch[1] : null;

        if (!mongoUri) throw new Error("No MongoDB URI found");

        await mongoose.connect(mongoUri.trim());

        // 1. Ensure 2 rooms exist
        let rooms = await Room.find();
        if (rooms.length < 2) {
            console.log("Creating balanced rooms...");
            if (rooms.length === 1 && rooms[0].name === "Interview Room 1") {
                await Room.create({ name: "Interview Room 2", status: "ACTIVE" });
            } else if (rooms.length === 0) {
                await Room.create({ name: "Interview Room 1", status: "ACTIVE" });
                await Room.create({ name: "Interview Room 2", status: "ACTIVE" });
            }
            rooms = await Room.find();
        }

        // 2. Get students from Excel
        const filePath = path.join(process.cwd(), 'data', 'students.xlsx');
        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        const top2 = data.slice(0, 2);

        // 3. Set them to INTERVIEWING
        for (let i = 0; i < 2; i++) {
            const studentData = top2[i];
            const room = rooms[i];

            const student = await Student.findOneAndUpdate(
                { registrationNumber: String(studentData["Registration Number"]) },
                {
                    name: studentData["Name"],
                    registrationNumber: String(studentData["Registration Number"]),
                    branch: studentData["Branch/Stream"] || "",
                    contactNumber: String(studentData["Contact No"] || ""),
                    status: "INTERVIEWING",
                    room: room._id,
                    interviewStartTime: new Date()
                },
                { upsert: true, new: true }
            );

            await Room.findByIdAndUpdate(room._id, { currentStudent: student._id });
            console.log(`Set ${student.name} to INTERVIEWING in ${room.name}`);
        }

        console.log("Process complete.");
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

run();
