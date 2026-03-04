"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MonitorPlay, Tv } from "lucide-react";

export default function DisplayBoardSelect() {
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
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center p-6 bg-slate-900 text-white">
            <div className="text-center mt-16 mb-16">
                <h1 className="text-5xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                    Interview Display Boards
                </h1>
                <p className="text-slate-400 text-xl font-medium">Select a room to launch the public display interface.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
                {rooms.map(room => (
                    <Link
                        key={room._id}
                        href={`/display/${room._id}`}
                        className="group relative bg-slate-800 rounded-3xl overflow-hidden p-1 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20"
                    >
                        <div className="bg-slate-900 rounded-[calc(1.5rem-1px)] p-10 h-full flex flex-col items-center text-center">
                            <div className="bg-blue-500/10 p-6 rounded-[2.5rem] mb-8 group-hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                                <Tv className="h-16 w-16 text-blue-500" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{room.name}</h2>
                            <div className="flex items-center space-x-2 bg-white/5 py-2 px-6 rounded-full border border-white/10 group-hover:border-blue-500/50 transition-colors">
                                <MonitorPlay className="h-5 w-5 text-blue-400" />
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-300">Launch Board</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
