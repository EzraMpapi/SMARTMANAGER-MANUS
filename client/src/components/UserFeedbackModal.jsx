import { useState } from "react";
import { MessageSquarePlus, X, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "../lib/trpc";

export function UserFeedbackModal({ isOpen, onClose }) {
  const [category, setCategory] = useState("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [success, setSuccess] = useState(false);
  const feedbackMutation = trpc.publicFeedback.useMutation({
    onSuccess: () => setSuccess(true),
  });

  const handleClose = () => {
    setCategory("bug");
    setMessage("");
    setEmail("");
    setName("");
    setWebsite("");
    setSuccess(false);
    feedbackMutation.reset();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await feedbackMutation.mutateAsync({
        category,
        message,
        email,
        name,
        website,
        pagePath: typeof window === "undefined" ? "/" : window.location.pathname,
      });
    } catch {
      // The mutation error is rendered below without exposing server details.
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) handleClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="feedback-dialog-title">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" aria-hidden="true">
              <MessageSquarePlus size={18} />
            </span>
            <div>
              <h3 id="feedback-dialog-title" className="text-base font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Poppins, sans-serif" }}>
                Send feedback
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Help us improve Smart Manager.</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} aria-label="Close feedback form" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center" role="status" aria-live="polite">
            <CheckCircle2 size={48} className="mx-auto text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">Feedback received</h4>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Thank you for helping us refine Smart Manager ERP.</p>
            <button type="button" onClick={handleClose} className="mt-6 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="feedback-category" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <select id="feedback-category" value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="bug">Report a Bug</option>
                <option value="feature">Feature Request</option>
                <option value="ui">UI / UX improvement</option>
                <option value="general">General feedback</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="feedback-name" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Name <span className="font-normal text-slate-400">(optional)</span></label>
                <input id="feedback-name" type="text" maxLength={120} placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label htmlFor="feedback-email" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Email <span className="font-normal text-slate-400">(optional)</span></label>
                <input id="feedback-email" type="email" maxLength={320} placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
            </div>

            <div>
              <label htmlFor="feedback-message" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Your feedback</label>
              <textarea id="feedback-message" rows={5} required minLength={10} maxLength={3000} placeholder="Tell us what happened or what you would like to improve…" value={message} onChange={(event) => setMessage(event.target.value)} className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              <p className="mt-1 text-right text-[11px] text-slate-400">{message.length}/3,000</p>
            </div>

            <label htmlFor="feedback-website" className="absolute -left-[9999px] h-px w-px overflow-hidden">Website</label>
            <input id="feedback-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} className="absolute -left-[9999px] h-px w-px" aria-hidden="true" />

            {feedbackMutation.error && (
              <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700 dark:bg-red-950/30 dark:text-red-300" role="alert">
                <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{feedbackMutation.error.message || "The feedback could not be submitted. Please try again."}</span>
              </p>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button type="button" onClick={handleClose} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
              <button type="submit" disabled={feedbackMutation.isPending} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-50">
                <Send size={14} aria-hidden="true" />
                {feedbackMutation.isPending ? "Sending…" : "Submit Feedback"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
