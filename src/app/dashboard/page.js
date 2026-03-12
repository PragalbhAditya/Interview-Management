"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import {
    Users,
    CheckCircle2,
    Clock,
    Timer,
    Play,
    DoorClosed,
    TrendingUp,
    RefreshCw,
    MoreVertical,
    Activity,
    Upload,
    Download,
    FileSpreadsheet,
    AlertCircle,
    Trash2,
    Edit,
    ChevronDown,
    X,
    Search,
    Filter,
    UserPlus
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useState as useReactState } from "react";

export default function AdminDashboard() {
    const { socket } = useSocket();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({ type: "", message: "" });
    const [activeActionId, setActiveActionId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: "", registrationNumber: "", branch: "", contactNumber: "", roomId: "" });

    const fetchData = async () => {
        try {
            const res = await fetch("/api/dashboard");
            const json = await res.json();
            setData(json);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newStudent),
            });
            if (res.ok) {
                setShowAddModal(false);
                setNewStudent({ name: "", registrationNumber: "", branch: "", contactNumber: "", roomId: "" });
                fetchData();
                setUploadStatus({ type: "success", message: "Student added successfully" });
                setTimeout(() => setUploadStatus({ type: "", message: "" }), 3000);
            } else {
                const err = await res.json();
                setUploadStatus({ type: "error", message: err.error || "Failed to add student" });
            }
        } catch (err) {
            console.error("Manual add error", err);
        }
    };

    const updateStudentStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`/api/students/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                fetchData();
                setActiveActionId(null);
            }
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const deleteStudent = async (id) => {
        if (!confirm("Are you sure you want to remove this student from the queue?")) return;
        try {
            const res = await fetch(`/api/students/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error("Failed to delete student", err);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadStatus({ type: "info", message: "Uploading..." });

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/students/upload", {
                method: "POST",
                body: formData,
            });

            const result = await res.json();

            if (res.ok) {
                setUploadStatus({ type: "success", message: "Database updated successfully!" });
                fetchData();
            } else {
                setUploadStatus({ type: "error", message: result.error || "Upload failed" });
            }
        } catch (err) {
            setUploadStatus({ type: "error", message: "Network error" });
        } finally {
            setUploading(false);
            setTimeout(() => setUploadStatus({ type: "", message: "" }), 5000);
        }
    };

    useEffect(() => {
        fetchData();

        if (socket) {
            socket.emit("joinDashboard");

            socket.on("dashboardUpdated", fetchData);
            socket.on("queueUpdated", fetchData); // Also listen to generic updates

            return () => {
                socket.off("dashboardUpdated");
                socket.off("queueUpdated");
            };
        }
    }, [socket]);

    if (loading || !data) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center">
                    <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Syncing Data...</p>
                </div>
            </div>
        );
    }

    const { stats, rooms, students, masterList } = data;

    // Merge master list with live status
    const masterMap = new Map();
    (masterList || []).forEach(m => {
        masterMap.set(String(m["Registration Number"]).toUpperCase(), m);
    });

    const liveMap = new Map();
    (students || []).forEach(s => {
        liveMap.set(String(s.registrationNumber).toUpperCase(), s);
    });

    // Create a set of all unique registration numbers
    const allRegNos = new Set([
        ...masterMap.keys(),
        ...liveMap.keys()
    ]);

    const mergedStudents = Array.from(allRegNos).map(regNo => {
        const master = masterMap.get(regNo);
        const live = liveMap.get(regNo);

        return {
            _id: live?._id || `master-${regNo}`,
            registrationNumber: regNo,
            name: live?.name || master?.["Name"] || "Unknown",
            branch: live?.branch || master?.["Branch/Stream"] || "",
            contactNumber: live?.contactNumber || master?.["Contact No"] || "",
            status: live?.status || "NOT CHECKED IN"
        };
    }).filter(student => {
        const matchesSearch =
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.branch.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || student.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Placement Control Tower</h1>
                        <p className="text-slate-500 font-medium">Monitoring {rooms.length} active interview rooms</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {uploadStatus.message && (
                            <div className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold border ${uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                uploadStatus.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' :
                                    'bg-blue-50 text-blue-700 border-blue-100'
                                } animate-in fade-in slide-in-from-right-4 duration-300`}>
                                {uploadStatus.type === 'error' ? <AlertCircle className="h-4 w-4 mr-2" /> : <Activity className="h-4 w-4 mr-2" />}
                                {uploadStatus.message}
                            </div>
                        )}

                        <label className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer shadow-sm ${uploading ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                            }`}>
                            <Upload className={`h-4 w-4 mr-2 ${uploading ? 'animate-bounce' : ''}`} />
                            {uploading ? 'Processing...' : 'Upload List'}
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </label>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md active:scale-95"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Student
                        </button>

                        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-100">
                                <Activity className="h-4 w-4 mr-2" /> Live System
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <StatCard
                        icon={<Users className="h-6 w-6 text-blue-600" />}
                        label="Total Registered"
                        value={stats.totalStudents}
                        subValue={`Arrived: ${stats.checkedIn}`}
                        color="blue"
                    />
                    <StatCard
                        icon={<DoorClosed className="h-6 w-6 text-slate-600" />}
                        label="Not Arrived"
                        value={stats.notArrived}
                        subValue="Pre-registered"
                        color="slate"
                    />
                    <StatCard
                        icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
                        label="Interviewed"
                        value={stats.interviewed}
                        subValue={`In Queue: ${stats.waiting}`}
                        color="emerald"
                    />
                    <StatCard
                        icon={<Timer className="h-6 w-6 text-orange-600" />}
                        label="Avg. Duration"
                        value={`${stats.avgDuration}m`}
                        subValue="Per Interview"
                        color="orange"
                    />
                    <StatCard
                        icon={<Clock className="h-6 w-6 text-indigo-600" />}
                        label="Est. Completion"
                        value={`${stats.estimatedRemainingMinutes}m`}
                        subValue="Remaining Time"
                        color="indigo"
                    />
                </div>

                {/* Rooms Monitor Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800">Room Monitoring</h2>
                        <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="h-5 w-5" /></button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-4">Room Name</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4">Now Interviewing</th>
                                    <th className="px-8 py-4">Upcoming</th>
                                    <th className="px-8 py-4 text-center">Check-in QR</th>
                                    <th className="px-8 py-4">Efficiency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rooms.map(room => (
                                    <tr key={room._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-slate-900">{room.name}</div>
                                            <div className="text-xs text-slate-400 font-medium tracking-wide">ID: {room._id.slice(-6).toUpperCase()}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${room.status === 'ACTIVE'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${room.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                {room.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            {room.currentStudent ? (
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                        <Users className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">{room.currentStudent.name}</div>
                                                        <div className="text-xs text-slate-500 font-medium">{room.currentStudent.registrationNumber}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 italic text-sm font-medium">Empty</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            {(() => {
                                                const next = students.filter(s => s.room === room._id && s.status === 'WAITING').sort((a, b) => a.queuePosition - b.queuePosition)[0];
                                                return next ? (
                                                    <div className="flex items-center text-slate-600">
                                                        <Clock className="h-3 w-3 mr-1.5 text-amber-500" />
                                                        <span className="text-xs font-bold">{next.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 text-xs italic">No queue</span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center text-slate-600 font-bold">
                                                <TrendingUp className="h-4 w-4 mr-2 text-blue-400" />
                                                {students.filter(s => s.room === room._id && s.status === 'WAITING').length} Waiting
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:scale-150 transition-transform cursor-pointer">
                                                    <QRCodeCanvas
                                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/check-in?roomId=${room._id}`}
                                                        size={40}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {(() => {
                                                const count = students.filter(s => s.room === room._id && s.status === 'WAITING').length;
                                                const percentage = Math.min(100, (count / 10) * 100);
                                                return (
                                                    <>
                                                        <div className="w-full max-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${percentage > 80 ? 'bg-red-500' : percentage > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-1 font-bold">{Math.round(percentage)}% Load</div>
                                                    </>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Students Data Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800">Student Registration Data</h2>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, reg no..."
                                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select
                                    className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="NOT CHECKED IN">Not Arrived</option>
                                    <option value="WAITING">Waiting</option>
                                    <option value="INTERVIEWING">Interviewing</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                            </div>
                            <a
                                href="/api/students/template"
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 transition-colors"
                                download
                            >
                                <FileSpreadsheet className="h-3 w-3 mr-1.5" /> Template
                            </a>
                            <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-xl uppercase tracking-widest">{mergedStudents.length} {statusFilter !== 'ALL' ? statusFilter.replace(/_/g, ' ') : 'Registered'}</div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-4">Name of Student</th>
                                    <th className="px-8 py-4">Registration Number</th>
                                    <th className="px-8 py-4">Branch/Stream</th>
                                    <th className="px-8 py-4">Contact No</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mergedStudents.map(student => (
                                    <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-8 py-6 font-bold text-slate-900">{student.name}</td>
                                        <td className="px-8 py-6 font-medium text-slate-600">{student.registrationNumber}</td>
                                        <td className="px-8 py-6 font-medium text-slate-600">{student.branch || "N/A"}</td>
                                        <td className="px-8 py-6 font-medium text-slate-600">{student.contactNumber || "N/A"}</td>
                                        <td className="px-8 py-6">
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={() => setActiveActionId(activeActionId === student._id ? null : student._id)}
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${student.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                        student.status === 'INTERVIEWING' ? 'bg-blue-100 text-blue-700' :
                                                            student.status === 'WAITING' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-slate-100 text-slate-500'
                                                        } hover:ring-2 hover:ring-offset-1 hover:ring-slate-200`}
                                                >
                                                    {student.status === 'COMPLETED' ? <CheckCircle2 className="h-3 w-3 mr-1.5" /> :
                                                        student.status === 'INTERVIEWING' ? <Play className="h-3 w-3 mr-1.5" /> :
                                                            student.status === 'WAITING' ? <Clock className="h-3 w-3 mr-1.5" /> :
                                                                <Activity className="h-3 w-3 mr-1.5 opacity-50" />}
                                                    {student.status.replace(/_/g, ' ')}
                                                    <ChevronDown className="h-3 w-3 ml-1.5 opacity-50" />
                                                </button>

                                                {activeActionId === student._id && (
                                                    <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Quick Status Move</div>
                                                        {['WAITING', 'INTERVIEWING', 'COMPLETED'].map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => updateStudentStatus(student._id, s)}
                                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors mb-1 last:mb-0 flex items-center justify-between ${student.status === s ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                {s.replace(/_/g, ' ')}
                                                                {student.status === s && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {student.status !== 'NOT CHECKED IN' ? (
                                                <button
                                                    onClick={() => deleteStudent(student._id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Remove from Queue"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">No Action</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {mergedStudents.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-12 text-center text-slate-400 italic font-medium">
                                            No students found in the database. Use "Upload List" to add students.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Manual Entry</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Add Student to Queue</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddStudent} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                                        placeholder="e.g. John Doe"
                                        value={newStudent.name}
                                        onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Reg Number</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 uppercase"
                                        placeholder="e.g. REG001"
                                        value={newStudent.registrationNumber}
                                        onChange={e => setNewStudent({ ...newStudent, registrationNumber: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Branch/Stream</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                                        placeholder="e.g. CSE"
                                        value={newStudent.branch}
                                        onChange={e => setNewStudent({ ...newStudent, branch: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Contact No</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                                        placeholder="Mobile Number"
                                        value={newStudent.contactNumber}
                                        onChange={e => setNewStudent({ ...newStudent, contactNumber: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Assign Room</label>
                                    <select
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none"
                                        value={newStudent.roomId}
                                        onChange={e => setNewStudent({ ...newStudent, roomId: e.target.value })}
                                    >
                                        <option value="">Auto-Balance Queue</option>
                                        {rooms.map(r => (
                                            <option key={r._id} value={r._id}>{r.name} ({r.currentStudent ? 'Busy' : 'Free'})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all mt-4">
                                Add to Interview Queue
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, trend, subValue, color }) {
    const colors = {
        blue: "bg-blue-600 shadow-blue-200/50",
        emerald: "bg-emerald-600 shadow-emerald-200/50",
        orange: "bg-orange-600 shadow-orange-200/50",
        indigo: "bg-indigo-600 shadow-indigo-200/50",
        slate: "bg-slate-600 shadow-slate-200/50"
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-slate-50 border border-slate-100`}>
                    {icon}
                </div>
                {trend && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-baseline space-x-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
                    {subValue && <span className="text-xs font-bold text-slate-400">{subValue}</span>}
                </div>
            </div>
        </div>
    );
}
