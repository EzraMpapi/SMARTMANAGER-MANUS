import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
const projects = source.slice(source.indexOf("function Projects("), source.indexOf("function ProjectFormPanel("));
const projectForm = source.slice(source.indexOf("function ProjectFormPanel("), source.indexOf("const PROJECT_DETAIL_TABS"));
const projectDetail = source.slice(source.indexOf("function ProjectDetail("), source.indexOf("function ProjectTasks("));
const projectTasks = source.slice(source.indexOf("function ProjectTasks("), source.indexOf("function TaskPanel("));
const taskPanel = source.slice(source.indexOf("function TaskPanel("), source.indexOf("function TaskFormPanel("));
const taskForm = source.slice(source.indexOf("function TaskFormPanel("), source.indexOf("/* ------------------------------------ TIMELINE"));

describe("Projects persistence boundaries", () => {
  it("shows configured project creates only after a returned server row is available", () => {
    const mutationAt = projects.indexOf('runCompanyTableMutation("projects", "insert"');
    const stateAt = projects.indexOf("projects.setRows((prev) => [confirmed, ...prev]);");

    expect(mutationAt).toBeGreaterThan(-1);
    expect(stateAt).toBeGreaterThan(mutationAt);
    expect(projects).toContain("The server did not return the created project.");
    expect(projects).not.toContain("Project created locally, but saving to the server failed.");
  });

  it("preserves the form and blocks duplicate project submissions while saving", () => {
    expect(projects).toContain("const [savingProject, setSavingProject] = useState(false);");
    expect(projects).toContain("if (savingProject) return;");
    expect(projectForm).toContain("disabled={saving}");
    expect(projectForm).toContain('aria-busy={saving}');
    expect(projectForm).toContain('{saving ? "Saving…" : "Create Project"}');
    expect(projects).toContain("Project was not created.");
  });

  it("updates project status only from the confirmed server response", () => {
    const mutationAt = projects.indexOf('runCompanyTableMutation("projects", "update"');
    const stateAt = projects.indexOf("projects.setRows((prev) => prev.map((p) => (p.id === selectedProject.id ? { ...p, ...confirmed } : p)));", mutationAt);

    expect(mutationAt).toBeGreaterThan(-1);
    expect(stateAt).toBeGreaterThan(mutationAt);
    expect(projectDetail).toContain("disabled={statusSaving}");
    expect(projectDetail).toContain("aria-busy={statusSaving}");
    expect(projects).toContain("Project status was not saved.");
  });

  it("keeps task creation, movement, and deletion server-confirmed", () => {
    expect(projectTasks).toContain('runCompanyTableMutation("project_tasks", "insert"');
    expect(projectTasks).toContain('runCompanyTableMutation("project_tasks", "update"');
    expect(projectTasks).toContain('runCompanyTableMutation("project_tasks", "delete"');
    expect(projectTasks).toContain("if (savingTaskId) return;");
    expect(projectTasks).toContain("Task was not added.");
    expect(projectTasks).toContain("Task status was not saved.");
    expect(projectTasks).toContain("Task was not deleted.");
    expect(taskPanel).toContain("disabled={busy || s === task.status}");
    expect(taskPanel).toContain("busy={busy}");
    expect(taskForm).toContain("disabled={saving}");
    expect(taskForm).toContain('{saving ? "Saving…" : "Add Task"}');
  });

  it("keeps milestone creation and completion toggles server-confirmed", () => {
    const milestones = source.slice(source.indexOf("function ProjectMilestones("), source.indexOf("function MilestoneFormPanel("));
    const milestoneForm = source.slice(source.indexOf("function MilestoneFormPanel("), source.indexOf("/* -------------------------------------- FILES"));
    expect(milestones).toContain('runCompanyTableMutation("project_milestones", "insert"');
    expect(milestones).toContain('runCompanyTableMutation("project_milestones", "update"');
    expect(milestones).toContain("if (savingMilestoneId) return;");
    expect(milestones).toContain("Milestone was not added.");
    expect(milestones).toContain("Milestone was not saved.");
    expect(milestones).toContain("disabled={savingMilestoneId === m.id}");
    expect(milestoneForm).toContain("disabled={saving}");
    expect(milestoneForm).toContain('{saving ? "Saving…" : "Add Milestone"}');
  });
});

export {};
