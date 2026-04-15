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
    currentStudents: [mongoose.Schema.Types.ObjectId],
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

        // 1. Get/Create "Interview Room 1"
        let room = await Room.findOne({ name: "Interview Room 1" });
        if (!room) {
            room = await Room.create({ name: "Interview Room 1", status: "ACTIVE" });
        }

        // 2. Clear previous assignments
        await Student.updateMany({ room: room._id }, { status: 'COMPLETED' });

        // 3. Get students from Excel (Next 2)
        const filePath = path.join(process.cwd(), 'data', 'students.xlsx');
        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        // Let's take students 3 and 4 for this test
        const studentsToSeat = data.slice(2, 4);
        const studentIds = [];

        for (const studentData of studentsToSeat) {
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
                { upsert: true, returnDocument: 'after' }
            );
            studentIds.push(student._id);
            console.log(`Set ${student.name} to INTERVIEWING`);
        }

        // 4. Update room with BOTH IDs
        await Room.findByIdAndUpdate(room._id, { currentStudents: studentIds });
        console.log(`Updated ${room.name} with 2 students.`);

        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

run();
