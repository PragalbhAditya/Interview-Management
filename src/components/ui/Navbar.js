"use client";

import Link from "next/link";
import { useState } from "react";
import { Briefcase, LayoutDashboard, MonitorPlay, QrCode, Menu, X } from "lucide-react";

const links = [
    { href: "/check-in", icon: QrCode, label: "Check-In" },
    { href: "/interviewer", icon: Briefcase, label: "Interviewer" },
    { href: "/display", icon: MonitorPlay, label: "Display" },
    { href: "/display/all", icon: MonitorPlay, label: "Command Center" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <Briefcase className="h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">Interview System</span>
                        </Link>
                    </div>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center space-x-1">
                        {links.map(({ href, icon: Icon, label }) => (
                            <Link key={href} href={href} className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                                <Icon className="h-4 w-4 mr-1.5 shrink-0" /> {label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile hamburger */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
                    <div className="px-4 py-3 space-y-1">
                        {links.map(({ href, icon: Icon, label }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center px-3 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                <Icon className="h-4 w-4 mr-3 shrink-0" /> {label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}
