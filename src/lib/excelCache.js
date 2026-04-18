import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

// Survive Next.js hot reloads in dev by pinning to global
if (!global._rosterCache) {
    global._rosterCache = { data: null, mtime: null };
}

export function getStudentRoster() {
    const filePath = path.join(process.cwd(), "data", "students.xlsx");
    if (!fs.existsSync(filePath)) return [];

    try {
        const mtime = fs.statSync(filePath).mtimeMs;
        if (global._rosterCache.data && global._rosterCache.mtime === mtime) {
            return global._rosterCache.data;
        }
        const workbook = XLSX.read(fs.readFileSync(filePath), { type: "buffer" });
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        global._rosterCache = { data, mtime };
        return data;
    } catch (e) {
        console.error("Roster parse error:", e);
        return global._rosterCache.data ?? [];
    }
}

export function invalidateRoster() {
    global._rosterCache = { data: null, mtime: null };
}
