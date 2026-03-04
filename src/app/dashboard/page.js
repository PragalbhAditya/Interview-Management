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
    Activity
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useState as useReactState } from "react";

export default function AdminDashboard() {
    const { socket } = useSocket();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const { stats, rooms } = data;

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Placement Control Tower</h1>
                        <p className="text-slate-500 font-medium">Monitoring {rooms.length} active interview rooms</p>
                    </div>
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-100">
                            <Activity className="h-4 w-4 mr-2" /> Live System
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={<Users className="h-6 w-6 text-blue-600" />}
                        label="Total Registered"
                        value={stats.totalStudents}
                        trend="+12% from start"
                        color="blue"
                    />
                    <StatCard
                        icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
                        label="Total Interviewed"
                        value={stats.interviewed}
                        subValue={`Remaining: ${stats.waiting}`}
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
                                            <div className="flex items-center text-slate-600 font-bold">
                                                <TrendingUp className="h-4 w-4 mr-2 text-blue-400" />
                                                {/* We could fetch actual count per room here, but using room prop or static if not aggregated */}
                                                Active Queue
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
                                            <div className="w-full max-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1 font-bold">85% Capacity</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ icon, label, value, trend, subValue, color }) {
    const colors = {
        blue: "bg-blue-600 shadow-blue-200/50",
        emerald: "bg-emerald-600 shadow-emerald-200/50",
        orange: "bg-orange-600 shadow-orange-200/50",
        indigo: "bg-indigo-600 shadow-indigo-200/50"
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
