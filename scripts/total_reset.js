const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Schema for Student (Simplified)
const studentSchema = new mongoose.Schema({ status: String });
const roomSchema = new mongoose.Schema({
    currentStudents: [mongoose.Schema.Types.ObjectId],
    status: String
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);

async function run() {
    try {
        // 1. Load config
        const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
        const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
        const mongoUri = mongoMatch ? mongoMatch[1] : null;

        if (!mongoUri) throw new Error("No MongoDB URI found");

        // 2. Connect to DB
        console.log("Connecting to DB...");
        await mongoose.connect(mongoUri.trim());

        // 3. Clear all Students
        console.log("Deleting all check-in records (Students collection)...");
        const studentResult = await Student.deleteMany({});
        console.log(`Successfully deleted ${studentResult.deletedCount} student records.`);

        // 4. Reset all Rooms
        console.log("Resetting all rooms to ACTIVE and clearing current candidates...");
        const roomResult = await Room.updateMany({}, {
            currentStudents: [],
            status: 'ACTIVE'
        });
        console.log(`Updated ${roomResult.modifiedCount} rooms.`);

        console.log("\nDashboard Status: Everyone is now 'NOT CHECKED IN'.");
        console.log("The system is ready for a fresh session.");

        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

run();
