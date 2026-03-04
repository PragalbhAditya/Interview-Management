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
    User
} from "lucide-react";
import Link from "next/link";

export default function InterviewerDashboard({ params }) {
    const resolvedParams = use(params);
    const roomId = resolvedParams.roomId;

    const { socket } = useSocket();
    const [room, setRoom] = useState(null);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [roomRes, queueRes] = await Promise.all([
                fetch(`/api/rooms`),
                fetch(`/api/students?roomId=${roomId}&status=WAITING`)
            ]);

            const allRooms = await roomRes.json();
            const currentRoom = allRooms.find(r => r._id === roomId);
            const studentQueue = await queueRes.json();

            setRoom(currentRoom);
            setQueue(studentQueue);
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

            const data = await res.json();

            if (socket) {
                if (action === "CALL_NEXT" && data.student) {
                    socket.emit("studentCalled", { roomId, student: data.student });
                } else {
                    socket.emit("roomStatusChanged", { roomId });
                }
            }

            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !room) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const currentStudent = room.currentStudent;

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Top Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <Link href="/interviewer" className="mr-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{room.name}</h1>
                            <div className="flex items-center text-xs font-semibold uppercase tracking-wider">
                                <span className={`w-2 h-2 rounded-full mr-1.5 ${room.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                <span className={room.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-500'}>{room.status}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => handleAction("TOGGLE_PAUSE")}
                            disabled={actionLoading}
                            className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${room.status === 'ACTIVE'
                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                        >
                            {room.status === 'ACTIVE' ? <PauseCircle className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                            {room.status === 'ACTIVE' ? "Pause Queue" : "Resume Queue"}
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
                                <Users className="h-5 w-5 mr-2 text-blue-600" /> Now Interviewing
                            </h2>
                            {currentStudent && (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-widest animate-pulse">
                                    In Progress
                                </span>
                            )}
                        </div>

                        <div className="p-8">
                            {currentStudent ? (
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                                        <User className="h-12 w-12 text-blue-600" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 mb-1">{currentStudent.name}</h3>
                                    <p className="text-lg text-slate-500 font-medium mb-8">{currentStudent.registrationNumber}</p>

                                    <div className="flex space-x-4 w-full">
                                        <button
                                            onClick={() => handleAction("END_INTERVIEW")}
                                            disabled={actionLoading}
                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-all border border-slate-200 flex items-center justify-center"
                                        >
                                            <CheckCircle className="h-5 w-5 mr-2" /> End Interview
                                        </button>
                                        <button
                                            onClick={() => handleAction("CALL_NEXT")}
                                            disabled={actionLoading}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center"
                                        >
                                            <Bell className="h-5 w-5 mr-2" /> Call Next
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center py-12">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <UserPlus className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-400 mb-6">No Student Currently Being Interviewed</h3>
                                    <button
                                        onClick={() => handleAction("CALL_NEXT")}
                                        disabled={actionLoading || queue.length === 0}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center"
                                    >
                                        <UserPlus className="h-5 w-5 mr-2" /> Call First Student
                                    </button>
                                    {queue.length === 0 && <p className="mt-4 text-sm text-slate-400 italic">The queue is currently empty</p>}
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
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Upcoming Queue</h2>
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">{queue.length} Total</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[600px]">
                            {queue.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                                    <p className="text-sm font-medium">Queue is empty</p>
                                </div>
                            ) : (
                                queue.map((s, idx) => (
                                    <div key={s._id} className="group p-4 bg-slate-50 hover:bg-white hover:shadow-md border border-transparent hover:border-blue-100 rounded-2xl transition-all flex items-center">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-400 group-hover:text-blue-600 transition-colors mr-4 shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{s.name}</p>
                                            <p className="text-xs text-slate-500 font-medium">{s.registrationNumber}</p>
                                        </div>
                                        <div className="text-xs font-bold text-slate-400">
                                            ~{idx * room.avgInterviewDuration}m wait
                                        </div>
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
