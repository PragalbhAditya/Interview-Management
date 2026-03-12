const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const data = [
    { "Registration Number": "REG001", "Name": "Pragalbh Aditya", "Branch/Stream": "Computer Science", "Contact No": "9876543210" },
    { "Registration Number": "REG002", "Name": "John Doe", "Branch/Stream": "Information Technology", "Contact No": "9876543211" },
    { "Registration Number": "REG003", "Name": "Jane Smith", "Branch/Stream": "Electronics", "Contact No": "9876543212" },
    { "Registration Number": "REG004", "Name": "Alice Johnson", "Branch/Stream": "Mechanical", "Contact No": "9876543213" },
    { "Registration Number": "REG005", "Name": "Bob Brown", "Branch/Stream": "Civil", "Contact No": "9876543214" },
    { "Registration Number": "REG006", "Name": "Charlie Davis", "Branch/Stream": "Chemical", "Contact No": "9876543215" },
    { "Registration Number": "REG007", "Name": "Eva Wilson", "Branch/Stream": "Aerospace", "Contact No": "9876543216" },
    { "Registration Number": "REG008", "Name": "Frank Miller", "Branch/Stream": "Computer Science", "Contact No": "9876543217" },
    { "Registration Number": "REG009", "Name": "Grace Hopper", "Branch/Stream": "Information Technology", "Contact No": "9876543218" },
    { "Registration Number": "REG010", "Name": "Ada Lovelace", "Branch/Stream": "Electronics", "Contact No": "9876543219" }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const filePath = path.join(dataDir, 'students.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`Excel file created at: ${filePath}`);
