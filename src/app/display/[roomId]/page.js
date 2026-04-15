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
    const [showGDNotification, setShowGDNotification] = useState(false);
    const [calledGDGroup, setCalledGDGroup] = useState([]);
    const [gdWaiting, setGdWaiting] = useState([]);
    const [gdOngoing, setGdOngoing] = useState([]);

    const audioRef = useRef(null);

    const fetchData = async () => {
        try {
            const [roomRes, queueRes, interviewingRes, gdWaitingRes, gdOngoingRes] = await Promise.all([
                fetch(`/api/rooms`),
                fetch(`/api/students?roomId=${roomId}&status=WAITING`),
                fetch(`/api/students?roomId=${roomId}&status=INTERVIEWING`),
                fetch(`/api/students?roomId=${roomId}&status=GD_WAITING`),
                fetch(`/api/students?roomId=${roomId}&status=GD_ONGOING`)
            ]);

            const allRooms = await roomRes.json();
            const studentQueue = await queueRes.json();
            const interviewingStudents = await interviewingRes.json();
            const gdWaiting = await gdWaitingRes.json();
            const gdOngoing = await gdOngoingRes.json();

            if (Array.isArray(allRooms)) {
                const currentRoom = allRooms.find(r => r._id === roomId);
                if (currentRoom) {
                    // Merge currentStudents from room with all INTERVIEWING students
                    // Use a Map to deduplicate by _id
                    const studentMap = new Map();
                    (currentRoom.currentStudents || []).forEach(s => studentMap.set(String(s._id), s));
                    (Array.isArray(interviewingStudents) ? interviewingStudents : []).forEach(s => studentMap.set(String(s._id), s));
                    currentRoom.currentStudents = Array.from(studentMap.values());
                    setRoom(currentRoom);
                }
            }

            if (Array.isArray(studentQueue)) {
                setQueue(studentQueue);
            }

            setGdWaiting(Array.isArray(gdWaiting) ? gdWaiting : []);
            setGdOngoing(Array.isArray(gdOngoing) ? gdOngoing : []);

            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();

        // Add a polling interval as a fallback to sockets
        const interval = setInterval(fetchData, 30000);

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

            socket.on("gdGroupCalled", (students) => {
                setCalledGDGroup(students);
                setShowGDNotification(true);

                // Play Bell Sound
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(e => console.log("Audio play blocked by browser:", e));
                }

                // Hide notification after 15 seconds (longer because there are 10 names)
                setTimeout(() => setShowGDNotification(false), 15000);
            });
        }

        return () => {
            clearInterval(interval);
            if (socket) {
                socket.off("queueUpdated");
                socket.off("playBell");
            }
        };
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

    const currentStudents = room.currentStudents || [];
    const waitingRoomStudent = queue[0]; // The single next student
    const upcomingQueue = queue.slice(1, 10); // Everyone else in the pipeline

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
                            Drive Progress Monitor
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-1">Queue Status</div>
                    <div className="text-2xl font-black text-white">{queue.length} Ready • {gdWaiting.length} Pending GD</div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">

                {/* Left Section: Active Areas */}
                <div className="w-2/3 p-10 flex flex-col gap-8">
                    
                    {/* Active GD (Only if enabled) */}
                    {room.isGDEnabled && (
                        <div className="flex-1 flex flex-col min-h-0 bg-indigo-900/10 rounded-[3rem] p-8 border border-indigo-500/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <span className="bg-indigo-600/10 text-indigo-500 text-xs font-black py-2.5 px-6 rounded-full border border-indigo-600/20 uppercase tracking-[0.3em] flex items-center">
                                    <Mic2 className="h-4 w-4 mr-2" /> Group Discussion Room
                                </span>
                                {gdOngoing.length > 0 && (
                                    <div className="flex items-center space-x-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                        </span>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Active Batch ({gdOngoing.length})</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex items-center justify-center relative z-10">
                                {gdOngoing.length > 0 ? (
                                    <div className="grid grid-cols-5 gap-4 w-full">
                                        {gdOngoing.slice(0, 10).map((s, idx) => (
                                            <div key={s._id} className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-4 border border-indigo-500/20 text-center animate-in zoom-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                                <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-indigo-600/10">
                                                    <User className="h-5 w-5 text-indigo-500" />
                                                </div>
                                                <p className="text-[11px] font-black text-white line-clamp-1 mb-0.5 leading-tight">{s.name}</p>
                                                <p className="text-[8px] font-bold text-indigo-500/50 uppercase tracking-tighter">{s.registrationNumber}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center opacity-20">
                                        <Users className="h-24 w-24 text-slate-700 mb-6 mx-auto" />
                                        <h3 className="text-2xl font-black uppercase tracking-widest text-slate-700">Waiting for GD Batch</h3>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Interviewing Section */}
                    <div className="flex-1 flex flex-col min-h-0 bg-emerald-500/5 rounded-[3rem] p-8 border border-emerald-500/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                        <div className="mb-8 relative z-10">
                            <span className="bg-emerald-600/10 text-emerald-500 text-xs font-black py-2.5 px-6 rounded-full border border-emerald-600/20 uppercase tracking-[0.3em] flex items-center w-fit">
                                <DoorOpen className="h-4 w-4 mr-2" /> Interview Room
                            </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center items-center relative z-10">
                            {currentStudents && currentStudents.length > 0 ? (
                                <div className={`w-full grid ${currentStudents.length > 1 ? 'grid-cols-2 gap-12' : 'grid-cols-1'} animate-in fade-in zoom-in duration-700`}>
                                    {currentStudents.map(student => (
                                        <div key={student._id} className="text-center">
                                            <div className="inline-block relative mb-6">
                                                <div className="absolute inset-0 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
                                                <div className={`relative ${currentStudents.length > 1 ? 'w-28 h-28' : 'w-44 h-44'} bg-slate-800 rounded-[2.5rem] border-2 border-slate-700 flex items-center justify-center shadow-2xl`}>
                                                    <User className={`${currentStudents.length > 1 ? 'h-14 w-14' : 'h-24 w-24'} text-blue-500`} />
                                                </div>
                                            </div>
                                            <h2 className={`${currentStudents.length > 1 ? 'text-4xl' : 'text-7xl'} font-black tracking-tighter text-white mb-2 leading-none whitespace-nowrap`}>
                                                {student.name}
                                            </h2>
                                            <p className={`${currentStudents.length > 1 ? 'text-lg' : 'text-3xl'} font-bold text-slate-500 uppercase tracking-widest`}>
                                                {student.registrationNumber}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center opacity-20">
                                    <Monitor className="h-24 w-24 text-slate-700 mb-6 mx-auto" />
                                    <h3 className="text-2xl font-black uppercase tracking-widest text-slate-700 italic">Board Ready for Intake</h3>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Section: UP NEXT & QUEUES */}
                <div className="w-1/3 bg-slate-900/50 border-l border-slate-800 p-10 flex flex-col gap-10">
                    
                    {/* GD Queue (Only if enabled) */}
                    {room.isGDEnabled && (
                        <div className="shrink-0 bg-indigo-900/10 rounded-3xl p-6 border border-indigo-500/10">
                            <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mb-5 flex justify-between items-center">
                                <span className="flex items-center"><Users className="h-3.5 w-3.5 mr-2 text-indigo-500" /> Pending GD</span>
                                <span className="text-indigo-500/50">{gdWaiting.length} Total</span>
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {gdWaiting.slice(0, 10).map(s => (
                                    <div key={s._id} className="bg-slate-800/60 rounded-xl p-3 border border-indigo-500/5 hover:border-indigo-500/20 transition-all">
                                        <p className="text-[10px] font-black text-slate-200 line-clamp-1 mb-0.5">{s.name}</p>
                                        <p className="text-[8px] font-bold text-indigo-500/40 uppercase tracking-tighter">{s.registrationNumber}</p>
                                    </div>
                                ))}
                                {gdWaiting.length === 0 && <p className="text-[10px] italic text-slate-600 col-span-2 text-center py-2">No students in GD queue</p>}
                            </div>
                        </div>
                    )}

                    {/* Waiting Room Section */}
                    <div>
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mb-6 flex items-center">
                            <Users className="h-3.5 w-3.5 mr-2 text-orange-500" /> Proceed to Waiting Room
                        </p>

                        <div className="space-y-4">
                            {waitingRoomStudent ? (
                                <div className="bg-slate-800 rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group animate-in slide-in-from-right duration-500">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-3xl font-black text-white mb-1 leading-none tracking-tight">{waitingRoomStudent.name}</h3>
                                            <p className="text-lg font-bold text-slate-500 tracking-widest">{waitingRoomStudent.registrationNumber}</p>
                                        </div>
                                        <div className="bg-orange-500/10 text-orange-500 h-12 w-12 flex items-center justify-center rounded-2xl border border-orange-500/20 font-black text-2xl shadow-lg">
                                            1
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-800/40 rounded-3xl p-8 border border-white/5 text-center">
                                    <p className="text-slate-600 font-bold italic text-sm text-slate-700">Waiting room clear</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Remaining Queue */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mb-6">Queue Pipeline</p>
                        <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                            {upcomingQueue.map((s, idx) => (
                                <div key={s._id} className="flex items-center p-4 bg-white/5 border border-white/5 rounded-2xl animate-in fade-in transition-all hover:bg-white/10" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-slate-600 mr-4 shrink-0 border border-slate-700 text-xs">
                                        {idx + 2}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-400 truncate text-base leading-tight">{s.name}</p>
                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{s.registrationNumber}</p>
                                    </div>
                                </div>
                            ))}

                            {upcomingQueue.length === 0 && (
                                <div className="text-slate-800 text-center py-6 italic text-sm">
                                    Pipeline clear
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* GD Group Notification Overlay */}
            {showGDNotification && calledGDGroup.length > 0 && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-indigo-600/20 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="max-w-6xl w-full bg-slate-950 rounded-[4rem] p-12 shadow-[0_0_120px_rgba(79,70,229,0.5)] border-4 border-indigo-500 animate-in zoom-in duration-500">
                        <div className="flex flex-col items-center text-center mb-12">
                            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 animate-bounce shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                                <Users className="h-10 w-10 text-white" />
                            </div>
                            <h1 className="text-5xl font-black text-white tracking-widest uppercase mb-2">Group Discussion</h1>
                            <p className="text-indigo-400 text-xl font-black tracking-[0.5em] uppercase">The Following 10 Candidates</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {calledGDGroup.map((s, idx) => (
                                <div key={s._id} className="flex items-center p-6 bg-white/5 rounded-3xl border border-white/10 animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-900/50 flex items-center justify-center font-black text-indigo-400 mr-6 text-xl border border-indigo-500/30 shadow-inner">
                                        {idx + 1}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-white text-2xl tracking-tight leading-none mb-1">{s.name}</p>
                                        <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">{s.registrationNumber}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 text-center">
                            <div className="inline-flex items-center px-10 py-4 bg-indigo-600 rounded-full shadow-2xl shadow-indigo-600/40 animate-pulse">
                                <DoorOpen className="h-6 w-6 text-white mr-3" />
                                <p className="text-xl font-black text-white uppercase tracking-widest">Proceed to GD Room Now</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bell Notification Overlay */}
            {showNotification && calledStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-blue-600/10 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in duration-500">
                        
                        {/* Primary: Called to Room */}
                        <div className="bg-slate-900 rounded-[4rem] p-12 shadow-[0_0_80px_rgba(37,99,235,0.4)] border-4 border-blue-500 border-animate flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-8 animate-bounce shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                                <Bell className="h-12 w-12 text-white" />
                            </div>
                            <p className="text-blue-500 text-xl font-black uppercase tracking-[0.4em] mb-6">Proceed to Interview</p>
                            <h1 className="text-6xl font-black text-white mb-4 tracking-tighter leading-none whitespace-nowrap">{calledStudent.name}</h1>
                            <p className="text-2xl font-bold text-slate-500 uppercase tracking-widest mb-10">{calledStudent.registrationNumber}</p>

                            <div className="flex items-center space-x-3 bg-white/5 px-8 py-4 rounded-3xl border border-white/10">
                                <DoorOpen className="h-6 w-6 text-blue-500" />
                                <span className="text-xl font-bold text-slate-300 italic tracking-tight">Report to {room.name}</span>
                            </div>
                        </div>

                        {/* Secondary: Proceed to Waiting Room */}
                        <div className="bg-slate-900/90 backdrop-blur-md rounded-[4rem] p-12 shadow-2xl border-4 border-orange-500/30 flex flex-col justify-center text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <div className="flex flex-col items-center mb-10">
                                <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6">
                                    <Users className="h-8 w-8 text-orange-500" />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Waiting Room</h2>
                                <p className="text-orange-500 text-sm font-black uppercase tracking-widest mt-2">Next in Queue</p>
                            </div>

                            {waitingRoomStudent ? (
                                <div className="p-8 bg-white/5 rounded-3xl border border-white/10 animate-in zoom-in duration-500">
                                    <h1 className="text-5xl font-black text-white mb-2 tracking-tighter leading-none">{waitingRoomStudent.name}</h1>
                                    <p className="text-2xl font-bold text-slate-500 uppercase tracking-widest">{waitingRoomStudent.registrationNumber}</p>
                                </div>
                            ) : (
                                <div className="p-8 bg-white/5 rounded-3xl border border-white/5 opacity-30">
                                    <p className="text-xl font-bold italic text-slate-700">Waiting room clear</p>
                                </div>
                            )}

                            <div className="mt-12 flex items-center justify-center space-x-3">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                </span>
                                <p className="text-lg font-black text-slate-300 uppercase tracking-[0.2em]">Move to Entry Point</p>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Footer Info */}
            <div className="h-12 bg-slate-900 border-t border-slate-800 px-12 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] shrink-0">
                <div className="flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                    Live Connection Active (Socket.io)
                </div>
                <div>Interview Management System • v2.0</div>
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
        </div>
    );
}
