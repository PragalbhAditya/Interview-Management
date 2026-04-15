const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mongoose = require('mongoose');

// Schema for Student (Simplified)
const studentSchema = new mongoose.Schema({
    registrationNumber: String,
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

        // 3. Get all checked-in registration numbers
        const checkedInStudents = await Student.find({}, { registrationNumber: 1 });
        const checkedInRegNos = new Set(checkedInStudents.map(s => String(s.registrationNumber).toUpperCase()));
        console.log(`Found ${checkedInRegNos.size} checked-in students in DB.`);

        // 4. Load Excel
        const filePath = path.join(process.cwd(), 'data', 'students.xlsx');
        if (!fs.existsSync(filePath)) {
            console.log("No students.xlsx found.");
            process.exit(0);
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Original Excel count: ${data.length}`);

        // 5. Filter data
        const filteredData = data.filter(row => {
            const regNo = String(row["Registration Number"] || "").toUpperCase();
            return checkedInRegNos.has(regNo);
        });

        console.log(`Filtered Excel count: ${filteredData.length}`);

        // 6. Save back to Excel
        const newWorksheet = XLSX.utils.json_to_sheet(filteredData);
        workbook.Sheets[sheetName] = newWorksheet;
        XLSX.writeFile(workbook, filePath);

        console.log("Successfully updated students.xlsx");
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

run();
