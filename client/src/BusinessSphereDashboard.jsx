import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { FiSearch, FiBell, FiPlus, FiUser } from "react-icons/fi";
import "./styles/BusinessSphereDashboard.css";

/*
  Note:
  - Replace the mockData below with real data from your store/API.
  - The CSS file contains grid & responsive rules to recreate the provided layout.
*/

const COLORS = ["#2f9e44", "#4c6ef5", "#f59f00", "#e64980", "#20c997"];

const kpiData = [
  {
    title: "Total Revenue",
    value: "TZS 72,540,000",
    delta: "+18.6% vs last month",
    spark: [10, 12, 18, 22, 28, 40, 55, 62, 68, 72],
    color: "#2f9e44",
  },
  {
    title: "Total Expenses",
    value: "TZS 18,250,000",
    delta: "-8.4% vs last month",
    spark: [8, 9, 8, 7, 9, 11, 13, 12, 13, 18],
    color: "#e03131",
  },
  {
    title: "Net Profit",
    value: "TZS 54,290,000",
    delta: "+24.7% vs last month",
    spark: [5, 8, 12, 16, 22, 32, 36, 40, 46, 54],
    color: "#20c997",
  },
  {
    title: "Total Orders",
    value: "1,243",
    delta: "+15.3% vs last month",
    spark: [40, 42, 50, 60, 70, 80, 86, 100, 110, 125],
    color: "#1c7ed6",
  },
  {
    title: "Outstanding Invoices",
    value: "TZS 23,560,000",
    delta: "12 overdue",
    spark: [20, 23, 22, 24, 26, 28, 26, 27, 29, 30],
    color: "#f76707",
  },
];

const revenueAreaData = [
  { date: "01 May", revenue: 8000000 },
  { date: "06 May", revenue: 12000000 },
  { date: "11 May", revenue: 22000000 },
  { date: "16 May", revenue: 38000000 },
  { date: "21 May", revenue: 52000000 },
  { date: "25 May", revenue: 72540000 },
];

const salesByChannel = [
  { name: "POS Sales", value: 35400000 },
  { name: "Direct Sales", value: 18700000 },
  { name: "Online Store", value: 12300000 },
  { name: "Others", value: 6100000 },
];

const topProducts = [
  { id: 1, name: "Cement (Dangote)", value: "TZS 12,540,000", pct: "18.6%" },
  { id: 2, name: "Iron Sheets", value: "TZS 8,750,000", pct: "12.9%" },
  { id: 3, name: "Paint (Various)", value: "TZS 6,240,000", pct: "9.1%" },
  { id: 4, name: "Nails (Box)", value: "TZS 3,850,000", pct: "5.6%" },
  { id: 5, name: "Door (Wooden)", value: "TZS 3,150,000", pct: "4.6%" },
];

const cashFlowData = [
  { date: "01 May", net: 2000000 },
  { date: "08 May", net: 8000000 },
  { date: "15 May", net: -500000 },
  { date: "22 May", net: 10000000 },
  { date: "25 May", net: 4600000 },
];

const recentActivity = [
  { id: 1, title: "New sale of TZS 1,250,000", subtitle: "by John Mwangi", time: "2m ago" },
  { id: 2, title: "Purchase order #PO-2025-045", subtitle: "approved by Admin", time: "15m ago" },
  { id: 3, title: "Payment received TZS 850,000", subtitle: "from ABC Company", time: "1h ago" },
  { id: 4, title: "New customer registered", subtitle: "Grace Mrema", time: "2h ago" },
  { id: 5, title: "Stock alert: 5 products", subtitle: "reaching minimum stock", time: "3h ago" },
];

function StatCard({ item }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-title">{item.title}</div>
        <div className="stat-value">{item.value}</div>
      </div>
      <div className="stat-body">
        <div className="stat-delta">{item.delta}</div>
        <div className="sparkline">
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={item.spark.map((v, i) => ({ i, v }))}>
              <Area
                type="monotone"
                dataKey="v"
                stroke={item.color}
                fill={item.color}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function BusinessSphereDashboard() {
  return (
    <div className="bsd-root">
      <aside className="bsd-sidebar">
        <div className="brand">
          <div className="logo">SMART</div>
          <div className="brand-sub">MANAGER</div>
        </div>

        <nav className="nav-list">
          <a className="nav-item active">Dashboard</a>
          <a className="nav-item">Sales</a>
          <a className="nav-item">POS</a>
          <a className="nav-item">Inventory</a>
          <a className="nav-item">Procurement</a>
          <a className="nav-item">Finance</a>
          <a className="nav-item">CRM</a>
          <a className="nav-item">Reports</a>
        </nav>

        <div className="plan-box">
          <div>Your Plan</div>
          <div className="plan-sub">Enterprise — Active until 25 Dec 2025</div>
          <button className="btn small">View Details</button>
        </div>
      </aside>

      <main className="bsd-main">
        <header className="bsd-header">
          <div className="search-wrap">
            <FiSearch className="icon" />
            <input placeholder="Search modules, records, reports..." />
          </div>
          <div className="header-actions">
            <button className="icon-btn"><FiPlus /></button>
            <button className="icon-btn"><FiBell /></button>
            <div className="profile">
              <FiUser />
              <div className="profile-name">Kigamboni Traders Ltd</div>
            </div>
          </div>
        </header>

        <section className="content-grid">
          <div className="greet-row">
            <h2>Good morning, Ezra Mpapi 👋</h2>
            <div className="date-and-actions">
              <div className="today-date">Sunday, 25 May 2025</div>
              <button className="btn primary">Customize Dashboard</button>
            </div>
          </div>

          <div className="kpi-grid">
            {kpiData.map((k) => (
              <StatCard key={k.title} item={k} />
            ))}
          </div>

          <div className="media-grid">
            <div className="card revenue-card">
              <div className="card-header">
                <div>Revenue Overview</div>
                <select className="select-small">
                  <option>This Month</option>
                </select>
              </div>
              <div className="card-body chart-area">
                <div className="rev-total">TZS 72,540,000</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueAreaData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2f9e44" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2f9e44" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip formatter={(v) => `${new Intl.NumberFormat().format(v)}`} />
                    <Area type="monotone" dataKey="revenue" stroke="#2f9e44" fill="url(#colorRev)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card pie-card">
              <div className="card-header">
                <div>Sales by Channel</div>
                <select className="select-small">
                  <option>This Month</option>
                </select>
              </div>
              <div className="card-body pie-body">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={salesByChannel}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      labelLine={false}
                    >
                      {salesByChannel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-total">72.54M <div className="muted">Total</div></div>
              </div>
            </div>

            <div className="card quick-actions-card">
              <div className="card-header">Quick Actions</div>
              <div className="card-body quick-actions-grid">
                {["New Sale","Add Expense","New Purchase","Add Customer","Add Product","Bank Reconcile","Payroll Run","Create Invoice"].map((a) => (
                  <button key={a} className="quick-btn">{a}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="three-col-grid">
            <div className="card top-products-card">
              <div className="card-header">
                <div>Top Products</div>
                <select className="select-small"><option>This Month</option></select>
              </div>
              <div className="card-body">
                <ul className="product-list">
                  {topProducts.map((p) => (
                    <li key={p.id} className="product-item">
                      <div className="product-name">{p.name}</div>
                      <div className="product-meta">
                        <div>{p.value}</div>
                        <div className="muted">{p.pct}</div>
                      </div>
                    </li>
                  ))}
                </ul>
                <a className="link">View all products →</a>
              </div>
            </div>

            <div className="card cashflow-card">
              <div className="card-header">Cash Flow Overview</div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(v) => `${new Intl.NumberFormat().format(v)}`} />
                    <Bar dataKey="net" fill="#4c6ef5" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="cash-legend">
                  <div>Cash In: TZS 85,450,000</div>
                  <div>Cash Out: TZS 38,920,000</div>
                  <div>Net Cash Flow: TZS 46,530,000</div>
                </div>
              </div>
            </div>

            <div className="card business-health-card">
              <div className="card-header">Business Health</div>
              <div className="card-body radial-body">
                <ResponsiveContainer width="100%" height={140}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={18} data={[{ name: "health", value: 85, fill: "#20c997" }]}>
                    <RadialBar minAngle={15} background clockWise dataKey="value" />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="health-details">
                  <div className="health-score">85%</div>
                  <div className="muted">Excellent — Your business is performing well</div>
                  <ul className="health-list">
                    <li>Cash flow is positive</li>
                    <li>Sales are growing</li>
                    <li>Expenses are under control</li>
                    <li>Inventory levels are optimal</li>
                  </ul>
                  <a className="link">View full analysis →</a>
                </div>
              </div>
            </div>
          </div>

          <div className="recent-activity-card card">
            <div className="card-header">
              <div>Recent Activity</div>
              <a className="link">View All</a>
            </div>
            <div className="card-body">
              <ul className="activity-list">
                {recentActivity.map((a) => (
                  <li key={a.id} className="activity-item">
                    <div>
                      <div className="activity-title">{a.title}</div>
                      <div className="muted">{a.subtitle}</div>
                    </div>
                    <div className="muted small">{a.time}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
