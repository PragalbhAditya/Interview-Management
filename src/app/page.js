import Link from "next/link";
import { QrCode, MonitorPlay, Users, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50">

      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Real-Time Interview
          <span className="text-blue-600"> Management</span>
        </h1>
        <p className="text-lg text-slate-600">
          Seamlessly coordinate placement drives. Eliminate crowding outside interview rooms and keep students updated in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        <PortalCard
          href="/check-in"
          icon={<QrCode className="h-8 w-8 text-indigo-600" />}
          title="Student Check-In"
          description="Scan QR or enter registration number to join the interview queue."
          color="bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
        />

        <PortalCard
          href="/dashboard"
          icon={<LayoutDashboard className="h-8 w-8 text-emerald-600" />}
          title="Admin Dashboard"
          description="Monitor real-time statistics and overall queue progression."
          color="bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
        />

        <PortalCard
          href="/interviewer"
          icon={<Users className="h-8 w-8 text-orange-600" />}
          title="Interviewer Panel"
          description="Manage your room, call the next student, and control the flow."
          color="bg-orange-50 hover:bg-orange-100 border-orange-200"
        />

        <PortalCard
          href="/display"
          icon={<MonitorPlay className="h-8 w-8 text-purple-600" />}
          title="Display Board"
          description="Large screen layout to cue students outside the interview rooms."
          color="bg-purple-50 hover:bg-purple-100 border-purple-200"
        />
      </div>
    </div>
  );
}

function PortalCard({ href, icon, title, description, color }) {
  return (
    <Link
      href={href}
      className={`flex flex-col p-6 rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-md ${color}`}
    >
      <div className="p-3 bg-white rounded-xl w-fit shadow-sm mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </Link>
  );
}
