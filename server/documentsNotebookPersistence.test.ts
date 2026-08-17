import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const documents = source.slice(source.indexOf("function Documents("), source.indexOf("function FilePanel("));
const filePanel = source.slice(source.indexOf("function FilePanel("), source.indexOf("function VersionUploadPanel("));
const versionForm = source.slice(source.indexOf("function VersionUploadPanel("), source.indexOf("function DocumentSignaturePad("));
const fileForm = source.slice(source.indexOf("function FileFormPanel("), source.indexOf("/* ---------------------------------- PROJECTS"));
const notebook = source.slice(source.indexOf("function NotebookView("), source.indexOf("/* --------------------------------- NOTIFICATIONS"));

describe("Documents and Notebook persistence boundaries", () => {
  it("adds documents only after confirmed insert responses and does not fabricate file size", () => {
    const mutationAt = documents.indexOf('runCompanyTableMutation("documents", "insert"');
    const stateAt = documents.indexOf("setFiles((prev) => [confirmed, ...prev]);");
    expect(mutationAt).toBeGreaterThan(-1);
    expect(stateAt).toBeGreaterThan(mutationAt);
    expect(documents).toContain('size: "Not measured"');
    expect(documents).toContain("File was not uploaded.");
    expect(documents).toContain("if (savingFile) return;");
    expect(fileForm).toContain("disabled={saving || ocrBusy}");
    expect(fileForm).toContain('{saving ? "Uploading…" : "Upload"}');
  });

  it("updates document versions and deletes files only after server confirmation", () => {
    expect(documents).toContain('runCompanyTableMutation("documents", "update"');
    expect(documents).toContain('runCompanyTableMutation("documents", "delete"');
    expect(documents).toContain("if (versionSavingFileId) return false;");
    expect(documents).toContain("if (deletingFileId) return false;");
    expect(documents).toContain("Version was not saved.");
    expect(documents).toContain("File was not deleted.");
    expect(filePanel).toContain("busy={deleting}");
    expect(filePanel).toContain("versionSaving");
    expect(versionForm).toContain("disabled={saving}");
    expect(versionForm).toContain('{saving ? "Saving…" : "Save New Version"}');
  });

  it("creates notes only after confirmed insert responses and preserves drafts on failure", () => {
    const mutationAt = notebook.indexOf('runCompanyTableMutation("notebook_notes", "insert"');
    const stateAt = notebook.indexOf("notes.setRows((prev) => [confirmed, ...prev]);");
    expect(mutationAt).toBeGreaterThan(-1);
    expect(stateAt).toBeGreaterThan(mutationAt);
    expect(notebook).toContain("if (savingNote || !form.title.trim()) return;");
    expect(notebook).toContain("Your draft is still available to retry.");
    expect(notebook).toContain("disabled={savingNote}");
    expect(notebook).toContain('{savingNote ? "Saving…" : "Save Note"}');
  });

  it("changes note status only after the confirmed update and blocks duplicates", () => {
    const mutationAt = notebook.indexOf('runCompanyTableMutation("notebook_notes", "update"');
    const stateAt = notebook.indexOf("notes.setRows((prev) => prev.map((n) => (n.id === note.id ? { ...n, status: data.status || newStatus } : n)));" );
    expect(mutationAt).toBeGreaterThan(-1);
    expect(stateAt).toBeGreaterThan(mutationAt);
    expect(notebook).toContain("if (togglingNoteId) return;");
    expect(notebook).toContain("disabled={togglingNoteId === n.id}");
    expect(notebook).toContain("Note status was not changed.");
  });
});

export {};
