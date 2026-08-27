import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
const commandCenter = readFileSync(resolve(process.cwd(), "client/src/components/CommercialCommandCenters.jsx"), "utf8");
const architecture = readFileSync(resolve(process.cwd(), "docs/ecommerce-architecture-map-20260826.md"), "utf8");

describe("E-Commerce module transformation contract", () => {
  it("keeps the dashboard grounded in confirmed commerce and ERP inventory rows", () => {
    expect(source).toContain('useCompanyTable("ecommerce_products"');
    expect(source).toContain('useCompanyTable("ecommerce_orders"');
    expect(source).toContain("Pending Payment");
    expect(source).toContain("Inventory Value");
    expect(source).toContain("confirmed ecommerce orders, ecommerce products, and ERP inventory rows");
    expect(commandCenter).toContain("Storefront health and order execution");
  });

  it("supports catalog search, stock filtering, deterministic sorting, and accessible view controls", () => {
    expect(source).toContain('placeholder="Search products or SKU..."');
    expect(source).toContain('aria-label="Filter products by stock"');
    expect(source).toContain('aria-label="Sort products"');
    expect(source).toContain('aria-label="Grid view"');
    expect(source).toContain('aria-label="List view"');
    expect(source).toContain("Image not configured");
    expect(source).toContain('aria-pressed={p.published}');
  });

  it("supports searchable order execution and keyboard-accessible detail opening", () => {
    expect(source).toContain('aria-label="Search orders"');
    expect(source).toContain('aria-label="Filter orders by status"');
    expect(source).toContain('aria-label="E-Commerce order management"');
    expect(source).toContain('role="button" aria-label={`Open order ${o.id}`}');
    expect(source).toContain('"Payment Pending": "Processing"');
    expect(source).toContain("Review confirmed orders and advance only through supported server states.");
    expect(source).toContain('aria-label="Commerce capability coverage"');
    expect(source).toContain("Checkout & payments");
    expect(source).toContain("Contract gated");
    expect(source).toContain('target: "inventory"');
    expect(source).toContain('target: "sales"');
    expect(source).toContain('target: "crm"');
  });

  it("documents the safety boundary for missing public-commerce contracts", () => {
    expect(architecture).toContain("No live commerce-specific tables for carts");
    expect(architecture).toContain("this slice does not create duplicate entities or client-only business records");
    expect(architecture).toContain("Payment, shipping, refund, reservation, and settlement states must remain server-confirmed");
  });
});
