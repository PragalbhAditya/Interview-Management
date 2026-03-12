"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QrCode, ArrowRight, User, Hash } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";

export default function CheckInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { socket } = useSocket();
    const [formData, setFormData] = useState({ name: "", registrationNumber: "", roomId: "" });

    useEffect(() => {
        const roomId = searchParams.get("roomId");
        if (roomId) {
            setFormData(prev => ({ ...prev, roomId }));
        } else {
            // If no room ID is provided, try to fetch the single available room
            fetch("/api/rooms")
                .then(res => res.json())
                .then(data => {
                    if (data.length === 1) {
                        setFormData(prev => ({ ...prev, roomId: data[0]._id }));
                    }
                });
        }
    }, [searchParams]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verifiedName, setVerifiedName] = useState("");

    useEffect(() => {
        const verifyStudent = async () => {
            if (formData.registrationNumber.length >= 3) {
                setVerifying(true);
                setError("");
                try {
                    const res = await fetch(`/api/students/verify?registrationNumber=${formData.registrationNumber}`);
                    const data = await res.json();
                    if (res.ok) {
                        setVerifiedName(data.name);
                        setFormData(prev => ({ ...prev, name: data.name }));
                    } else {
                        setVerifiedName("");
                        setFormData(prev => ({ ...prev, name: "" }));
                        if (formData.registrationNumber.length > 5) {
                            setError(data.error || "Student not found");
                        }
                    }
                } catch (err) {
                    console.error("Verification error:", err);
                } finally {
                    setVerifying(false);
                }
            } else {
                setVerifiedName("");
                setFormData(prev => ({ ...prev, name: "" }));
            }
        };

        const timer = setTimeout(verifyStudent, 500);
        return () => clearTimeout(timer);
    }, [formData.registrationNumber]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            setError("Please enter a valid registration number");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/students/check-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Check-in failed");
            }

            // Notify server about new check-in to broadcast
            if (socket && data.student?.room) {
                socket.emit("studentCheckedIn", { roomId: data.student.room });
            }

            // Redirect to status page
            router.push(`/status/${formData.registrationNumber}`);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
            <div className="max-w-md w-full glass rounded-3xl p-8 relative overflow-hidden">
                {/* Decorative background blurs */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 z-0"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 z-0"></div>

                <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="bg-blue-100 p-4 rounded-2xl">
                            <QrCode className="w-10 h-10 text-blue-600" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Student Check-In</h2>
                    <p className="text-center text-slate-500 mb-4 text-sm">Enter your registration number to join the queue.</p>

                    {formData.roomId && (
                        <div className="flex justify-center mb-6">
                            <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100 flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                                Room {formData.roomId.slice(-4)} Selected
                            </span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase"
                                    placeholder="e.g. REG001"
                                    value={formData.registrationNumber}
                                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                                />
                                {verifying && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {verifiedName && (
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Welcome,</p>
                                <div className="flex items-center">
                                    <User className="h-5 w-5 text-emerald-500 mr-2" />
                                    <p className="text-lg font-bold text-slate-800">{verifiedName}</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !verifiedName}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Processing..." : "Join Queue"}
                            {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
