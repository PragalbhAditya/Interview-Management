import Link from "next/link";
import { QrCode, MonitorPlay, Users, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50">

      <div className="text-center mb-16 max-w-3xl animate-slide-up">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Real-Time Interview
          <span className="text-blue-600 block sm:inline"> Management</span>
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed italic">
          "Seamlessly coordinate recruitment drives. Eliminate chaos, keep students informed."
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        <PortalCard
          href="/check-in"
          icon={<QrCode className="h-8 w-8 text-blue-600" />}
          title="Student Check-In"
          description="Scan QR or enter registration number to join the interview queue."
          color="hover:border-blue-300"
        />

        <PortalCard
          href="/dashboard"
          icon={<LayoutDashboard className="h-8 w-8 text-indigo-600" />}
          title="Admin Dashboard"
          description="Monitor real-time statistics and overall queue progression."
          color="hover:border-indigo-300"
        />

        <PortalCard
          href="/interviewer"
          icon={<Users className="h-8 w-8 text-cyan-600" />}
          title="Interviewer Panel"
          description="Manage your room, call the next student, and control the flow."
          color="hover:border-cyan-300"
        />

        <PortalCard
          href="/display"
          icon={<MonitorPlay className="h-8 w-8 text-violet-600" />}
          title="Display Board"
          description="Large screen layout to cue students outside the interview rooms."
          color="hover:border-violet-300"
        />
      </div>
    </div>
  );
}

function PortalCard({ href, icon, title, description, color }) {
  return (
    <Link
      href={href}
      className={`glass group flex flex-col p-8 rounded-3xl border transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl ${color}`}
    >
      <div className="p-4 bg-slate-50/50 group-hover:bg-white rounded-2xl w-fit shadow-inner mb-6 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-lg">{description}</p>
      <div className="mt-6 flex items-center text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
        Enter Portal →
      </div>
    </Link>
  );
}
