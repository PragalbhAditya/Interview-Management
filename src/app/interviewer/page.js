"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DoorOpen, Users } from "lucide-react";

export default function InterviewerRoomSelect() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/rooms")
            .then(res => res.json())
            .then(data => {
                setRooms(data);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center p-6 bg-slate-50">
            <div className="text-center mt-10 mb-12">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Select Interview Room</h1>
                <p className="text-slate-500 max-w-lg mx-auto">Choose the room you are managing to open the Interviewer Control Panel.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                {rooms.map(room => (
                    <Link
                        key={room._id}
                        href={`/interviewer/${room._id}`}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-slate-200 p-8 flex flex-col items-center text-center group"
                    >
                        <div className="bg-orange-100 p-4 rounded-full mb-6 group-hover:bg-orange-500 transition-colors">
                            <DoorOpen className="h-10 w-10 text-orange-600 group-hover:text-white transition-colors" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">{room.name}</h2>
                        <div className="flex items-center text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-sm font-medium">
                            <span className={`w-2 h-2 rounded-full mr-2 ${room.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {room.status}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
