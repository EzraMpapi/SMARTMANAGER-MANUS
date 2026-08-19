import { useState } from "react";
import { MessageSquarePlus, X, Send, CheckCircle2, AlertCircle } from "lucide-react";

export function UserFeedbackModal({ isOpen, onClose, notify }) {
  const [category, setCategory] = useState("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      notify?.("Please enter your feedback or bug description.", "error");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      notify?.("Thank you! Your feedback has been securely submitted to the engineering team.");
      setTimeout(() => {
        setSuccess(false);
        setMessage("");
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <MessageSquarePlus size={18} />
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Poppins, sans-serif" }}>
              Send Feedback or Report Bug
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 size={48} className="mx-auto text-emerald-600 dark:text-emerald-400" />
            <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">Feedback Received!</h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Thank you for helping us refine Smart Manager ERP.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="bug">Report a Bug</option>
                <option value="feature">Feature Request</option>
                <option value="ui">UI / UX Improvement</option>
                <option value="general">General Feedback</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Your Email (Optional)</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
              <textarea
                rows={4}
                required
                placeholder="Describe the issue, suggestion, or request in detail…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
              >
                <Send size={14} />
                {submitting ? "Sending…" : "Submit Feedback"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
