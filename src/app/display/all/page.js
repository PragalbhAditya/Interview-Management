"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { User, Users, Monitor, Clock, Play } from "lucide-react";

export default function DisplayAllRooms() {
    const { socket } = useSocket();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [roomsRes, interviewingRes] = await Promise.all([
                fetch("/api/rooms"),
                fetch("/api/students?status=INTERVIEWING")
            ]);

            const roomsData = await roomsRes.json();
            const interviewingData = await interviewingRes.json();

            if (Array.isArray(roomsData)) {
                // Group INTERVIEWING students by roomId
                const studentsByRoom = new Map();
                if (Array.isArray(interviewingData)) {
                    interviewingData.forEach(s => {
                        const roomId = String(s.room?._id || s.room);
                        if (!studentsByRoom.has(roomId)) studentsByRoom.set(roomId, new Map());
                        studentsByRoom.get(roomId).set(String(s._id), s);
                    });
                }

                // Merge per room
                const mergedRooms = roomsData.map(room => {
                    const roomIdStr = String(room._id);
                    const studentMap = studentsByRoom.get(roomIdStr) || new Map();
                    (room.currentStudents || []).forEach(s => studentMap.set(String(s._id), s));
                    return { ...room, currentStudents: Array.from(studentMap.values()) };
                });

                setRooms(mergedRooms);
            }
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch rooms:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);

        if (socket) {
            socket.on("queueUpdated", fetchData);
            return () => {
                socket.off("queueUpdated", fetchData);
            };
        }
        return () => clearInterval(interval);
    }, [socket]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-slate-400 font-medium animate-pulse">Initializing Command Center...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 pb-12">
            {/* Header */}
            <header className="flex justify-between items-center mb-10 px-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                        INTERVIEW COMMAND CENTER
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Live Multi-Room Supervision</p>
                </div>
                <div className="flex items-center space-x-4 bg-slate-900/50 border border-slate-800 py-2 px-4 rounded-2xl">
                    <div className="flex items-center">
                        <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">System Live</span>
                    </div>
                </div>
            </header>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => (
                    <div
                        key={room._id}
                        className={`group bg-slate-900/40 border ${room.status === 'PAUSED' ? 'border-orange-500/20' : 'border-slate-800'} rounded-[2.5rem] overflow-hidden transition-all hover:border-blue-500/30 hover:bg-slate-900/60`}
                    >
                        {/* Room Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <div className="flex items-center">
                                <div className={`p-2 rounded-xl mr-3 ${room.status === 'PAUSED' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                    <Monitor className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight">{room.name}</h3>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${room.status === 'PAUSED' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {room.status}
                            </span>
                        </div>

                        {/* Current Candidates */}
                        <div className="p-8">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Currently Interviewing</p>

                            {room.currentStudents && room.currentStudents.length > 0 ? (
                                <div className="space-y-4">
                                    {room.currentStudents.map(student => (
                                        <div key={student._id} className="flex items-center animate-in slide-in-from-left duration-300">
                                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mr-4 border border-slate-700">
                                                <User className="h-6 w-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-white leading-tight">{student.name}</div>
                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{student.registrationNumber}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-2 text-slate-600 italic font-medium">No active candidates</div>
                            )}

                            {/* Stats/Footer */}
                            <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                                <div className="flex items-center text-slate-400">
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span className="text-xs font-bold">{room.avgInterviewDuration}m avg.</span>
                                </div>
                                <a
                                    href={`/display/${room._id}`}
                                    className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors flex items-center"
                                >
                                    Launch Board <Play className="h-3 w-3 ml-1 fill-current" />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {rooms.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem]">
                        <Users className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-600">No rooms configured</h3>
                        <p className="text-slate-500 mt-2">Add rooms in the admin dashboard to see them here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
