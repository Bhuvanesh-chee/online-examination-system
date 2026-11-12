"use client";

import { portalFetch } from "@/lib/browser-session";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  PlusCircle,
  FolderOpen,
  HelpCircle,
  Loader2,
  AlertCircle,
  X,
  ArrowRight,
} from "lucide-react";

interface BankItem {
  id: number;
  name: string;
  description: string | null;
  category: string;
  questionCount: number;
  createdAt: string;
}

export default function AdminBanksPage() {
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New bank form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Core Computer Science");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await portalFetch("/api/admin/banks");
      if (res.ok) {
        const data = await res.json();
        setBanks(data.banks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await portalFetch("/api/admin/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create question bank");
      } else {
        setName("");
        setDescription("");
        setShowModal(false);
        fetchBanks();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Question Banks</h1>
          <p className="text-xs text-slate-500">
            Organize questions into topical repositories and categories
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition"
        >
          <PlusCircle className="w-4 h-4" /> Create Question Bank
        </button>
      </div>

      {/* Banks Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm">Loading question banks...</span>
        </div>
      ) : banks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No question banks yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Create your first bank to start organizing MCQ and essay questions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((bank) => (
            <div
              key={bank.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {bank.category}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    {bank.questionCount} Questions
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-2">{bank.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                  {bank.description || "Topical question bank collection."}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/admin/questions?bankId=${bank.id}`}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  Browse Questions <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/admin/questions?bankId=${bank.id}&openAdd=true`}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  + Add Question
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Bank Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                New Question Bank
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateBank} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Operating Systems & Shell Scripting"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discipline / Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Core Computer Science"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of topics covered..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow"
                >
                  {saving ? "Creating..." : "Create Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
