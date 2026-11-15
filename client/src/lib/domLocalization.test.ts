// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  installDocumentLocalization,
  registerPhraseDictionary,
  setDocumentLocalization,
} from "./domLocalization";

const later = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("document localization bridge", () => {
  let teardown: () => void;

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    teardown = installDocumentLocalization("en");
  });

  afterEach(() => {
    teardown();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("switches every known text node, attribute and option label", () => {
    registerPhraseDictionary("sw", {
      "Save changes": "Hifadhi mabadiliko",
      "Search everything": "Tafuta kila kitu",
      Pending: "Inasubiri",
      Items: "Vipengee",
    });
    document.body.innerHTML = `
      <button title="Save changes" aria-label="Save changes">Save changes</button>
      <input placeholder="Search everything" />
      <select><option>Pending</option></select>
      <span>12 Items</span>
      <span>Bakari Juma</span>
    `;

    setDocumentLocalization("sw");

    const button = document.querySelector("button")!;
    expect(button.textContent).toBe("Hifadhi mabadiliko");
    expect(button.getAttribute("title")).toBe("Hifadhi mabadiliko");
    expect(button.getAttribute("aria-label")).toBe("Hifadhi mabadiliko");
    expect(document.querySelector("input")!.getAttribute("placeholder")).toBe(
      "Tafuta kila kitu"
    );
    expect(document.querySelector("option")!.textContent).toBe("Inasubiri");
    expect(document.querySelectorAll("span")[0].textContent).toBe("12 Vipengee");
    // User data that is not a known phrase must never be rewritten.
    expect(document.querySelectorAll("span")[1].textContent).toBe("Bakari Juma");
  });

  it("restores the original English text when English is selected again", () => {
    registerPhraseDictionary("fr", { "Save changes": "Enregistrer les modifications" });
    document.body.innerHTML = `<button>Save changes</button>`;

    setDocumentLocalization("fr");
    expect(document.querySelector("button")!.textContent).toBe(
      "Enregistrer les modifications"
    );

    setDocumentLocalization("en");
    expect(document.querySelector("button")!.textContent).toBe("Save changes");
  });

  it("re-translates content that React renders after the switch", async () => {
    registerPhraseDictionary("es", { Pending: "Pendiente" });
    setDocumentLocalization("es");

    const row = document.createElement("span");
    row.textContent = "Pending";
    document.body.appendChild(row);
    await later();

    expect(row.textContent).toBe("Pendiente");
  });

  it("keeps interpolated counters while localizing the label", async () => {
    registerPhraseDictionary("de", { Items: "Artikel" });
    setDocumentLocalization("de");

    const counter = document.createElement("span");
    counter.textContent = "3 Items";
    document.body.appendChild(counter);
    await later();

    expect(counter.textContent).toBe("3 Artikel");
  });

  it("localizes the document title", () => {
    registerPhraseDictionary("pt", { "Smart Manager": "Smart Manager" });
    document.title = "Dashboard";
    setDocumentLocalization("pt");
    expect(document.title).toBe("Painel");
  });
});
