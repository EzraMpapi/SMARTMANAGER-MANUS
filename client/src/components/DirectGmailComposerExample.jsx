import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Link2, LoaderCircle, Mail, Paperclip, Send, X } from "lucide-react";

/**
 * UI-only example for a future Gmail OAuth send endpoint.
 *
 * Expected production integration:
 *   onSend({ to, cc, subject, body, attachments })
 *   -> POST /api/communications/email
 *
 * The component deliberately does not contain OAuth tokens or Gmail API calls.
 */
export function DirectGmailComposerExample({
  sender = "smatimeneja@gmail.com",
  connected = true,
  onConnectGmail,
  onSend,
  onSaveReference,
  onClose,
}) {
  const [form, setForm] = useState({ to: "", cc: "", subject: "", body: "" });
  const [attachments, setAttachments] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addAttachments(event) {
    const selected = Array.from(event.target.files || []);
    setAttachments((current) => [...current, ...selected]);
    event.target.value = "";
  }

  function removeAttachment(fileName) {
    setAttachments((current) => current.filter((file) => file.name !== fileName));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!connected) return onConnectGmail?.();
    if (!form.to.trim() || !form.subject.trim() || !form.body.trim()) {
      setError("Recipient, subject and message are required.");
      return;
    }

    setError("");
    setStatus("sending");
    try {
      await onSend?.({ ...form, attachments });
      setStatus("sent");
    } catch (sendError) {
      setStatus("error");
      setError(sendError?.message || "Email could not be sent. Your draft is still available.");
    }
  }

  async function saveReference() {
    await onSaveReference?.({ ...form, attachments, status: "saved_reference" });
    setStatus("saved");
  }

  const isBusy = status === "sending";

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Mail size={19} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-slate-900">New customer email</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Gmail</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Sending as <strong className="text-slate-700">{sender}</strong>
            </p>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close email composer">
            <X size={17} />
          </button>
        )}
      </div>

      {!connected && (
        <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11.5px] text-amber-800">
          <Link2 size={15} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Connect Gmail to send directly</p>
            <p className="mt-0.5 text-amber-700">The app will request send-only permission. No inbox access is required.</p>
          </div>
          <button type="button" onClick={onConnectGmail} className="shrink-0 rounded-lg bg-amber-700 px-2.5 py-1.5 font-semibold text-white hover:bg-amber-800">Connect</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
        <div>
          <label htmlFor="direct-gmail-to" className="text-[11px] font-medium text-slate-600">To</label>
          <input id="direct-gmail-to" type="email" value={form.to} onChange={(event) => update("to", event.target.value)} placeholder="customer@example.com" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15" />
        </div>

        <div>
          <label htmlFor="direct-gmail-cc" className="text-[11px] font-medium text-slate-600">CC <span className="font-normal text-slate-400">(optional)</span></label>
          <input id="direct-gmail-cc" type="text" value={form.cc} onChange={(event) => update("cc", event.target.value)} placeholder="team@example.com" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15" />
        </div>

        <div>
          <label htmlFor="direct-gmail-subject" className="text-[11px] font-medium text-slate-600">Subject</label>
          <input id="direct-gmail-subject" type="text" value={form.subject} onChange={(event) => update("subject", event.target.value)} placeholder="Follow-up on your quotation" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15" />
        </div>

        <div>
          <label htmlFor="direct-gmail-body" className="text-[11px] font-medium text-slate-600">Message</label>
          <textarea id="direct-gmail-body" value={form.body} onChange={(event) => update("body", event.target.value)} rows={8} placeholder="Write your message…" className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12.5px] leading-relaxed outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15" />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
            <Paperclip size={14} /> Attach files
            <input type="file" multiple className="sr-only" onChange={addAttachments} />
          </label>
          {attachments.map((file) => (
            <span key={file.name} className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10.5px] text-slate-600">
              <span className="max-w-40 truncate">{file.name}</span>
              <button type="button" onClick={() => removeAttachment(file.name)} className="text-slate-400 hover:text-slate-700" aria-label={`Remove ${file.name}`}><X size={12} /></button>
            </span>
          ))}
        </div>

        {error && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[11.5px] text-red-700"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</div>}
        {status === "sent" && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11.5px] text-emerald-700"><CheckCircle2 size={15} />Email sent and added to the customer timeline.</div>}
        {status === "saved" && <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-[11.5px] text-sky-700"><CheckCircle2 size={15} />Reference saved to the customer timeline.</div>}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" onClick={saveReference} disabled={isBusy} className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Save as reference</button>
          <button type="submit" disabled={isBusy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-[11.5px] font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isBusy ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}
            {isBusy ? "Sending…" : connected ? "Send directly" : "Connect Gmail"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DirectGmailComposerExample;
