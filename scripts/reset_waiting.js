const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Schema for Student (Simplified)
const studentSchema = new mongoose.Schema({
    status: String
});

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

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

        // 3. Delete WAITING students
        console.log("Resetting WAITING students...");
        const result = await Student.deleteMany({ status: 'WAITING' });

        console.log(`Successfully removed ${result.deletedCount} students from the waiting queue.`);
        console.log("These students will now appear as 'NOT CHECKED IN' on the dashboard.");

        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

run();
