"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { Clock, MapPin, User, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function StudentStatusPage({ params }) {
    // Extract params async for Next.js 15+
    const resolvedParams = use(params);
    const regNo = resolvedParams.regNo;

    const router = useRouter();
    const { socket } = useSocket();
    const [student, setStudent] = useState(null);
    const [queuePos, setQueuePos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStatus = async () => {
        try {
            // Find the specific active student
            const res = await fetch(`/api/students?status=active`);
            if (!res.ok) throw new Error("Failed to fetch status");
            const students = await res.json();

            const me = students.find(s => s.registrationNumber === regNo);

            if (!me) {
                // If they are missing or COMPLETED, we show a finished or not found state.
                setStudent(null);
                setLoading(false);
                return;
            }

            setStudent(me);

            // Calculate queue position if they are WAITING
            if (me.status === "WAITING") {
                const waitingAhead = students.filter(
                    s => s.room._id === me.room._id && s.status === "WAITING" && s.queuePosition <= me.queuePosition
                ).length;
                setQueuePos(waitingAhead);
            } else {
                setQueuePos(0);
            }

            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Could not load queue status.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();

        if (socket) {
            // Listen to generic queue updates to refresh data
            const handleUpdate = () => {
                fetchStatus();
            };
            socket.on("queueUpdated", handleUpdate);
            return () => {
                socket.off("queueUpdated", handleUpdate);
            };
        }
    }, [socket, regNo]);

    useEffect(() => {
        // If student room exists, join that room's socket channel to receive focused updates
        if (socket && student?.room?._id) {
            socket.emit("joinRoom", student.room._id);
        }
    }, [socket, student?.room?._id]);

    if (loading) return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!student && !loading) return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-slate-50 p-6">
            <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Interview Completed</h2>
            <p className="text-slate-500 mb-8 max-w-sm text-center">Your interview process has concluded or you are not in the active queue.</p>
            <Link href="/check-in" className="text-blue-600 font-medium hover:underline flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Check-In
            </Link>
        </div>
    );

    const getWaitTime = () => {
        if (student.status === "INTERVIEWING") return 0;
        // Estimate wait time based on position and average duration
        return queuePos * (student.room.avgInterviewDuration || 15);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">

                {/* Header Section */}
                <div className={`p-8 text-center text-white relative ${student.status === 'INTERVIEWING' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>

                    <div className="relative z-10">
                        <h1 className="text-3xl font-black mb-1">
                            {student.status === "INTERVIEWING" ? "IT'S TIME!" : `POSITION ${queuePos}`}
                        </h1>
                        <p className="text-white/80 font-medium tracking-wide text-sm uppercase">
                            {student.status === "INTERVIEWING" ? "Please enter the room" : "Current Queue Status"}
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 space-y-6">
                    <div className="flex items-center p-4 bg-slate-50 rounded-2xl">
                        <div className="bg-blue-100 p-2 rounded-xl mr-4">
                            <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</p>
                            <p className="font-bold text-slate-900">{student.name}</p>
                            <p className="text-sm text-slate-500">{student.registrationNumber}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                            <MapPin className="h-6 w-6 text-indigo-500 mb-2" />
                            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Assigned Room</p>
                            <p className="font-bold text-indigo-900 text-lg">{student.room?.name || "Pending"}</p>
                        </div>

                        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100/50">
                            <Clock className="h-6 w-6 text-orange-500 mb-2" />
                            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Wait Time</p>
                            <p className="font-bold text-orange-900 text-lg">
                                {student.status === "INTERVIEWING" ? "Now" : `~${getWaitTime()} min`}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-center">
                            <span className="relative flex h-3 w-3 mr-2">
                                {student.status === "WAITING" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>}
                                {student.status === "INTERVIEWING" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${student.status === 'INTERVIEWING' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                            </span>
                            <p className="text-sm font-medium text-slate-600">
                                {student.status === "WAITING" ? "Live syncing with queue..." : "Interview in progress"}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
