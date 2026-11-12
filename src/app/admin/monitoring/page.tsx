"use client";

import { portalFetch } from "@/lib/browser-session";

import { useEffect, useState } from "react";
import {
  Eye,
  AlertTriangle,
  ShieldAlert,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

interface LiveAttempt {
  attemptId: number;
  examId: number;
  examTitle: string;
  examCode: string;
  durationMinutes: number;
  studentId: number;
  studentName: string;
  studentRollNo: string | null;
  studentEmail: string;
  startTime: string;
  tabSwitchCount: number;
  fullscreenExitCount: number;
  status: string;
}

interface SuspiciousLog {
  id: number;
  attemptId: number;
  eventType: string;
  details: string | null;
  timestamp: string;
  studentName: string;
  studentRollNo: string | null;
  studentEmail: string;
  examTitle: string;
}

export default function AdminMonitoringPage() {
  const [liveAttempts, setLiveAttempts] = useState<LiveAttempt[]>([]);
  const [logs, setLogs] = useState<SuspiciousLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchMonitoring();
    const interval = setInterval(fetchMonitoring, 8000); // poll every 8 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoring = async () => {
    try {
      const res = await portalFetch("/api/admin/monitoring");
      if (res.ok) {
        const data = await res.json();
        setLiveAttempts(data.liveAttempts || []);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "force-submit" | "disqualify", attemptId: number) => {
    const reason = prompt(
      action === "force-submit"
        ? "Reason for force-submitting attempt:"
        : "Reason for candidate disqualification:"
    );
    if (reason === null) return;

    setActionLoading(attemptId);
    try {
      const res = await portalFetch("/api/admin/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, attemptId, reason }),
      });
      if (res.ok) {
        fetchMonitoring();
      } else {
        alert("Action failed to apply");
      }
    } catch {
      alert("Error contacting server");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Eye className="w-6 h-6 text-emerald-600" />
            Live Examination Proctoring & Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time feed of active test takers and anti-cheating violation audit trail
          </p>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            fetchMonitoring();
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Feed
        </button>
      </div>

      {/* Live Attempts Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="font-bold text-slate-900 text-base">Active Examinees In Progress</h2>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {liveAttempts.length} Active
            </span>
          </div>
          <span className="text-xs text-slate-400">Auto-refreshing every 8s</span>
        </div>

        {liveAttempts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No candidates are currently taking an active exam session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Candidate</th>
                  <th className="px-6 py-3">Examination</th>
                  <th className="px-6 py-3">Started</th>
                  <th className="px-6 py-3">Tab Switches</th>
                  <th className="px-6 py-3">Fullscreen Exits</th>
                  <th className="px-6 py-3 text-right">Proctor Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liveAttempts.map((item) => {
                  const hasSuspicious = item.tabSwitchCount > 0 || item.fullscreenExitCount > 0;

                  return (
                    <tr
                      key={item.attemptId}
                      className={hasSuspicious ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-slate-50"}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.studentName}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          ID: {item.studentRollNo || item.studentEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{item.examTitle}</div>
                        <div className="text-xs text-slate-400 font-mono">{item.examCode}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {new Date(item.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {item.tabSwitchCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {item.tabSwitchCount} warning(s)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.fullscreenExitCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            {item.fullscreenExitCount} exit(s)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction("force-submit", item.attemptId)}
                            disabled={actionLoading === item.attemptId}
                            className="px-2.5 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold transition"
                          >
                            Force Submit
                          </button>
                          <button
                            onClick={() => handleAction("disqualify", item.attemptId)}
                            disabled={actionLoading === item.attemptId}
                            className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold transition"
                          >
                            Disqualify
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspicious Activity Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Security Incident Audit Log
            </h2>
            <p className="text-xs text-slate-500">
              Timestamped browser focus losses, tab switches, and fullscreen deterrent alerts
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{logs.length} logged events</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No suspicious activities logged.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4 text-xs hover:bg-slate-50/80 transition">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 mt-0.5 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-900">{log.studentName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({log.studentRollNo || "No Roll"})</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        {log.eventType}
                      </span>
                    </div>
                    <p className="text-slate-600">{log.details || "Browser focus violation detected."}</p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Exam: {log.examTitle}
                    </span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
