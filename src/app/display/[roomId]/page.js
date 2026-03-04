"use client";

import { useEffect, useState, useRef, use } from "react";
import { useSocket } from "@/hooks/useSocket";
import { User, Bell, Users, DoorOpen, Monitor, Mic2 } from "lucide-react";

export default function RoomDisplayBoard({ params }) {
    const resolvedParams = use(params);
    const roomId = resolvedParams.roomId;

    const { socket } = useSocket();
    const [room, setRoom] = useState(null);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNotification, setShowNotification] = useState(false);
    const [calledStudent, setCalledStudent] = useState(null);

    const audioRef = useRef(null);

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
        }
    };

    useEffect(() => {
        fetchData();

        if (socket) {
            socket.emit("joinRoom", roomId);

            socket.on("queueUpdated", fetchData);

            socket.on("playBell", (student) => {
                setCalledStudent(student);
                setShowNotification(true);

                // Play Bell Sound
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(e => console.log("Audio play blocked by browser:", e));
                }

                // Hide notification after 10 seconds
                setTimeout(() => setShowNotification(false), 10000);
            });

            return () => {
                socket.off("queueUpdated");
                socket.off("playBell");
            };
        }
    }, [socket, roomId]);

    if (loading || !room) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-pulse flex flex-col items-center">
                    <Monitor className="h-20 w-20 text-blue-500 mb-4" />
                    <p className="text-blue-200 font-bold uppercase tracking-[0.5em]">Initializing Board</p>
                </div>
            </div>
        );
    }

    const currentStudent = room.currentStudent;
    const nextStudent = queue[0];
    const remainingQueue = queue.slice(1, 6); // Show next 5 students

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col font-sans">
            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

            {/* Header Banner */}
            <div className="h-24 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-12 shrink-0">
                <div className="flex items-center">
                    <div className="p-3 bg-blue-600 rounded-2xl mr-4 shadow-lg shadow-blue-500/20">
                        <DoorOpen className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{room.name}</h1>
                        <p className="text-blue-500 text-sm font-bold uppercase tracking-widest flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${room.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            Interview Progress Board
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-1">Queue Depth</div>
                    <div className="text-2xl font-black text-white">{queue.length} Pending</div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">

                {/* Left Section: NOW INTERVIEWING */}
                <div className="w-2/3 p-12 flex flex-col">
                    <div className="mb-10">
                        <span className="bg-emerald-600/10 text-emerald-500 text-sm font-black py-2 px-6 rounded-full border border-emerald-600/20 uppercase tracking-[0.3em]">
                            Now Interviewing
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center">
                        {currentStudent ? (
                            <div className="w-full animate-in fade-in zoom-in duration-700">
                                <div className="text-center">
                                    <div className="inline-block relative mb-12">
                                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
                                        <div className="relative w-48 h-48 bg-slate-800 rounded-[3rem] border-2 border-slate-700 flex items-center justify-center shadow-2xl">
                                            <User className="h-24 w-24 text-blue-500" />
                                        </div>
                                    </div>
                                    <h2 className="text-7xl font-black mb-4 tracking-tighter text-white tracking-wide">
                                        {currentStudent.name}
                                    </h2>
                                    <p className="text-3xl font-medium text-slate-500 uppercase tracking-[0.2em] mb-12">
                                        {currentStudent.registrationNumber}
                                    </p>

                                    <div className="inline-flex items-center px-8 py-4 bg-white/5 rounded-2xl border border-white/10">
                                        <span className="relative flex h-3 w-3 mr-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-lg font-bold uppercase tracking-widest text-slate-400">Current Session</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center opacity-30">
                                <Users className="h-40 w-40 text-slate-700 mb-8 mx-auto" />
                                <h2 className="text-4xl font-black uppercase tracking-widest text-slate-700 italic">Waiting for Next</h2>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section: UP NEXT & QUEUE */}
                <div className="w-1/3 bg-slate-900/50 border-l border-slate-800 p-12 flex flex-col gap-8">

                    {/* Up Next Card */}
                    <div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] mb-6 flex items-center">
                            <Bell className="h-4 w-4 mr-2 text-orange-500" /> Up Next
                        </p>

                        <div className="bg-slate-800/80 rounded-[2.5rem] p-8 border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            {nextStudent ? (
                                <div className="relative z-10 transition-transform hover:scale-[1.02] duration-300">
                                    <h3 className="text-3xl font-black text-white mb-2 leading-none">{nextStudent.name}</h3>
                                    <p className="text-lg font-bold text-slate-500 tracking-wider mb-6">{nextStudent.registrationNumber}</p>
                                    <div className="bg-orange-500/10 text-orange-500 py-3 px-6 rounded-2xl border border-orange-500/20 inline-block font-black text-xs uppercase tracking-widest">
                                        Please Prepare
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-600 font-bold italic py-8">No impending students</p>
                            )}
                        </div>
                    </div>

                    {/* Remaining Queue */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] mb-6">Upcoming List</p>
                        <div className="flex-1 space-y-4 overflow-hidden">
                            {remainingQueue.map((s, idx) => (
                                <div key={s._id} className="flex items-center p-5 bg-white/5 border border-white/5 rounded-2xl animate-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-black text-slate-500 mr-5 shrink-0 border border-slate-700">
                                        {idx + 2}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-300 truncate text-lg">{s.name}</p>
                                        <p className="text-sm font-bold text-slate-600 tracking-wider">Queue Position {s.queuePosition}</p>
                                    </div>
                                </div>
                            ))}

                            {remainingQueue.length === 0 && (
                                <div className="text-slate-700 text-center py-10 italic">
                                    Queue list is clear
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bell Notification Overlay */}
            {showNotification && calledStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-12 bg-blue-600/10 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="max-w-4xl w-full bg-slate-900 rounded-[4rem] p-20 shadow-[0_0_100px_rgba(37,99,235,0.4)] border-4 border-blue-500 border-animate animate-in zoom-in duration-500 flex flex-col items-center text-center">
                        <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mb-12 animate-bounce">
                            <Bell className="h-16 w-16 text-white" />
                        </div>
                        <p className="text-blue-500 text-2xl font-black uppercase tracking-[0.5em] mb-8">Calling Next Student</p>
                        <h1 className="text-8xl font-black text-white mb-6 tracking-tighter">{calledStudent.name}</h1>
                        <p className="text-4xl font-medium text-slate-400 uppercase tracking-widest">{calledStudent.registrationNumber}</p>

                        <div className="mt-16 flex items-center space-x-4 bg-white/5 px-10 py-5 rounded-3xl border border-white/10">
                            <DoorOpen className="h-8 w-8 text-blue-500" />
                            <span className="text-2xl font-bold text-slate-300 italic">Please proceed to {room.name}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Info */}
            <div className="h-12 bg-slate-900 border-t border-slate-800 px-12 flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-widest shrink-0">
                <div>Auto-syncing active (Socket.io)</div>
                <div>Interactive Placement Drive System</div>
            </div>

            <style jsx global>{`
        .border-animate {
          animation: border-pulse 2s infinite;
        }
        @keyframes border-pulse {
          0% { border-color: rgba(37,99,235,1); }
          50% { border-color: rgba(37,99,235,0.2); }
          100% { border-color: rgba(37,99,235,1); }
        }
      `}</style>
        </div>
    );
}
