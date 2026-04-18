"use client";

import { useEffect, useState, use } from "react";
import { useSocket } from "@/hooks/useSocket";
import {
    Users,
    UserPlus,
    PauseCircle,
    PlayCircle,
    CheckCircle,
    Bell,
    ArrowLeft,
    Clock,
    User,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Filter,
    Monitor,
    Mic2
} from "lucide-react";
import Link from "next/link";

export default function InterviewerDashboard({ params }) {
    const resolvedParams = use(params);
    const roomId = resolvedParams.roomId;

    const { socket } = useSocket();
    const [room, setRoom] = useState(null);
    const [queue, setQueue] = useState([]);
    const [gdQueue, setGdQueue] = useState([]);
    const [gdOngoing, setGdOngoing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [gdSelection, setGdSelection] = useState({}); // { studentId: true/false }
    const [sortBy, setSortBy] = useState('queuePosition');
    const [sortDir, setSortDir] = useState('asc');
    const [priorityStream, setPriorityStream] = useState(null);

    const fetchData = async () => {
        try {
            const [roomRes, interviewQueueRes, gdQueueRes, gdOngoingRes] = await Promise.all([
                fetch(`/api/rooms`),
                fetch(`/api/students?roomId=${roomId}&status=WAITING`),
                fetch(`/api/students?roomId=${roomId}&status=GD_WAITING`),
                fetch(`/api/students?roomId=${roomId}&status=GD_ONGOING`)
            ]);

            const allRooms = await roomRes.json();
            const currentRoom = allRooms.find(r => r._id === roomId);
            const interviewQueue = await interviewQueueRes.json();
            const gdQueue = await gdQueueRes.json();
            const gdOngoing = await gdOngoingRes.json();

            setRoom(currentRoom);
            setQueue(interviewQueue);
            setGdQueue(gdQueue);
            setGdOngoing(gdOngoing);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        if (socket) {
            socket.emit("joinRoom", roomId);

            const handleUpdate = () => fetchData();
            socket.on("queueUpdated", handleUpdate);

            return () => {
                socket.off("queueUpdated", handleUpdate);
            };
        }
    }, [socket, roomId]);

    const handleAction = async (action) => {
        setActionLoading(true);
        try {
            const res = await fetch("/api/interviewer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, roomId }),
            });

            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDir('asc');
        }
    };

    const sortedQueue = [...queue].sort((a, b) => {
        // Priority Stream placement
        if (priorityStream) {
            const aIsPriority = a.branch === priorityStream;
            const bIsPriority = b.branch === priorityStream;
            if (aIsPriority && !bIsPriority) return -1;
            if (!aIsPriority && bIsPriority) return 1;
        }

        let valA = a[sortBy];
        let valB = b[sortBy];

        // Handle string comparison for names/branch/regNo
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const uniqueStreams = Array.from(new Set(queue.map(s => s.branch))).filter(Boolean).sort();

    if (loading || !room) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const currentStudents = room.currentStudents || [];

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Top Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center w-full sm:w-auto">
                        <Link href="/interviewer" className="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-slate-900 truncate">{room.name}</h1>
                            <div className="flex items-center text-xs font-semibold uppercase tracking-wider">
                                <span className={`w-2 h-2 rounded-full mr-1.5 ${room.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                <span className={room.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-500'}>{room.status}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-end gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => handleAction("TOGGLE_GD")}
                            disabled={actionLoading}
                            className={`flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none ${room.isGDEnabled
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                                }`}
                        >
                            <Users className="h-4 w-4 mr-2 shrink-0" />
                            GD: {room.isGDEnabled ? "ON" : "OFF"}
                        </button>
                        <button
                            onClick={() => handleAction("TOGGLE_PAUSE")}
                            disabled={actionLoading}
                            className={`flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none ${room.status === 'ACTIVE'
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                        >
                            {room.status === 'ACTIVE' ? <PauseCircle className="h-4 w-4 mr-2 shrink-0" /> : <PlayCircle className="h-4 w-4 mr-2 shrink-0" />}
                            {room.status === 'ACTIVE' ? "Pause" : "Resume"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Now Interviewing */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                <Monitor className="h-5 w-5 mr-2 text-blue-600" /> Room Control
                            </h2>
                            <div className="flex space-x-2">
                                {currentStudents.length > 0 && (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-widest animate-pulse">
                                        Interviewing
                                    </span>
                                )}
                                {gdOngoing.length > 0 && (
                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-widest animate-pulse">
                                        GD in Progress
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-8">
                            {/* GD MANAGEMENT SECTION */}
                            {room.isGDEnabled && (
                                <div className="mb-10 p-6 bg-indigo-50/50 border border-indigo-100 rounded-[2rem]">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-black text-indigo-900 uppercase tracking-widest text-sm flex items-center">
                                            <Users className="h-4 w-4 mr-2" /> Group Discussion Panel
                                        </h3>
                                        <span className="text-xs font-bold text-indigo-600">{gdQueue.length} Waiting for GD</span>
                                    </div>

                                    {gdOngoing.length > 0 ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                {gdOngoing.map(s => (
                                                    <button 
                                                        key={s._id}
                                                        onClick={() => setGdSelection(prev => ({ ...prev, [s._id]: !prev[s._id] }))}
                                                        className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 ${gdSelection[s._id] ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400'}`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${gdSelection[s._id] ? 'bg-white/20' : 'bg-slate-100'}`}>
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-[10px] font-bold line-clamp-1">{s.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex gap-4 pt-4 border-t border-indigo-100">
                                                <button 
                                                    onClick={async () => {
                                                        const passedIds = Object.keys(gdSelection).filter(id => gdSelection[id]);
                                                        const failedIds = gdOngoing.map(s => s._id).filter(id => !gdSelection[id]);
                                                        setActionLoading(true);
                                                        try {
                                                            await fetch("/api/interviewer", {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ action: "PROCESS_GD_RESULTS", roomId, passedIds, failedIds })
                                                            });
                                                            setGdSelection({});
                                                            fetchData();
                                                        } finally { setActionLoading(false); }
                                                    }}
                                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                                                >
                                                    Process Selected ({Object.values(gdSelection).filter(v => v).length})
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <button 
                                                onClick={() => handleAction("CALL_GD_GROUP")}
                                                disabled={actionLoading || gdQueue.length === 0}
                                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center mx-auto"
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" /> Call Group of 10
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* INTERVIEW SECTION */}
                            <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-6 flex items-center">
                                <Mic2 className="h-3 w-3 mr-2" /> Interview Management
                            </h3>
                            {currentStudents && currentStudents.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentStudents.map(student => (
                                            <div key={student._id} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col items-center text-center">
                                                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                                                    <User className="h-8 w-8 text-blue-600" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-1">{student.name}</h3>
                                                <p className="text-sm text-slate-500 font-medium">{student.registrationNumber}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 w-full pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => handleAction("END_INTERVIEW")}
                                            disabled={actionLoading}
                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-all border border-slate-200 flex items-center justify-center text-sm"
                                        >
                                            <CheckCircle className="h-5 w-5 mr-2" /> End Interview
                                        </button>
                                        <button
                                            onClick={() => handleAction("CALL_NEXT")}
                                            disabled={actionLoading || queue.length === 0}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center text-sm"
                                        >
                                            <Bell className="h-5 w-5 mr-2" /> Call Next
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center py-6">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <UserPlus className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-400 mb-6">Ready for Next Interview</h3>
                                    <button
                                        onClick={() => handleAction("CALL_NEXT")}
                                        disabled={actionLoading || queue.length === 0}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center"
                                    >
                                        <UserPlus className="h-5 w-5 mr-2" /> Call Next Interviewee
                                    </button>
                                    {queue.length === 0 && <p className="mt-4 text-xs text-slate-400 italic">No students waiting for interview{room.isGDEnabled ? ' (check GD results)' : ''}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="relative z-10">
                            <div className="flex items-center mb-6">
                                <Clock className="h-6 w-6 mr-3 text-indigo-300" />
                                <h2 className="text-xl font-bold">Session Overview</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-indigo-300 text-sm font-semibold uppercase tracking-wider mb-1">Avg. Duration</p>
                                    <p className="text-3xl font-black">{room.avgInterviewDuration} min</p>
                                </div>
                                <div>
                                    <p className="text-indigo-300 text-sm font-semibold uppercase tracking-wider mb-1">Queue Depth</p>
                                    <p className="text-3xl font-black underline decoration-indigo-500 underline-offset-4">{queue.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Queue */}
                <div className="lg:col-span-5">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Upcoming Queue</h2>
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">{queue.length} Total</span>
                            </div>
                            
                            {/* Sort Controls */}
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => toggleSort('name')}
                                    className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'name' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Name {sortBy === 'name' && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />)}
                                </button>
                                <button 
                                    onClick={() => toggleSort('registrationNumber')}
                                    className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'registrationNumber' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Reg No {sortBy === 'registrationNumber' && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />)}
                                </button>
                                <button 
                                    onClick={() => toggleSort('branch')}
                                    className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'branch' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Stream {sortBy === 'branch' && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />)}
                                </button>
                                <button 
                                    onClick={() => toggleSort('queuePosition')}
                                    className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'queuePosition' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Default
                                </button>
                            </div>

                            {/* Stream Priority Section */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                                    <Filter className="h-3 w-3 mr-1.5" /> Prioritize Stream
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        onClick={() => setPriorityStream(null)}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${!priorityStream ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
                                    >
                                        None
                                    </button>
                                    {uniqueStreams.map(stream => (
                                        <button 
                                            key={stream}
                                            onClick={() => setPriorityStream(stream)}
                                            className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${priorityStream === stream ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
                                        >
                                            {stream}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[600px]">
                            {queue.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                                    <p className="text-sm font-medium">Queue is empty</p>
                                </div>
                            ) : (
                                sortedQueue.map((s, idx) => (
                                    <div key={s._id} className="group p-4 bg-slate-50 hover:bg-white hover:shadow-md border border-transparent hover:border-blue-100 rounded-2xl transition-all flex items-center">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-400 group-hover:text-blue-600 transition-colors mr-4 shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{s.name}</p>
                                            <div className="flex items-center space-x-2">
                                                <p className="text-xs text-slate-500 font-medium">{s.registrationNumber}</p>
                                                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">{s.branch || 'General'}</span>
                                            </div>
                                        </div>
                                        {sortBy === 'queuePosition' && (
                                            <div className="text-xs font-bold text-slate-400">
                                                ~{idx * room.avgInterviewDuration}m wait
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
