// VoteLayout.jsx
import { ShieldCheck } from "lucide-react";

export default function VoteLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="text-indigo-600 w-7 h-7" />
          <h1 className="text-2xl font-extrabold text-gray-800">
            Vote sécurisé
          </h1>
        </div>

        <p className="text-gray-600 mb-8">
          {title}
        </p>

        {children}
      </div>
    </div>
  );
}
