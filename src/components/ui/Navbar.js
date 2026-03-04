import Link from "next/link";
import { Briefcase, LayoutDashboard, MonitorPlay, QrCode } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <Briefcase className="h-8 w-8 text-blue-600 font-bold" />
                            <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">Interview System</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/check-in" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                            <QrCode className="h-4 w-4 mr-1" /> Check-In
                        </Link>
                        <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors">
                            <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
