import fs from "node:fs";

const dashboardPath = "/home/ubuntu/businesssphere-erp/client/src/BusinessSphereDashboard.jsx";
const testPath = "/home/ubuntu/businesssphere-erp/server/collaborationHub.test.ts";
let source = fs.readFileSync(dashboardPath, "utf8");

const feedMarker = "function WhatsAppWebIntegration() {";
if (!source.includes(feedMarker)) throw new Error("WhatsAppWebIntegration marker not found");
if (!source.includes("function DashboardWhatsAppFeed")) {
  const feedBlock = `const WHATSAPP_MESSAGE_SEED = [
  { id: 1, sender: "Juma Kassam", phone: "+255 715 234 567", text: "Hello, checking on our wholesale invoice payment status for Dar es Salaam branch.", time: "10:42 AM", unread: true, readReceipt: true, ageHours: 2 },
  { id: 2, sender: "Aisha Mohamed", phone: "+255 784 987 654", text: "Can we schedule a product delivery for Arusha warehouse tomorrow?", time: "09:15 AM", unread: false, readReceipt: true, ageHours: 4 },
  { id: 3, sender: "Baraka Enterprise", phone: "+255 754 112 233", text: "Sent bank deposit slip for the recent bulk order. Please confirm receipt.", time: "Yesterday", unread: true, readReceipt: false, ageHours: 26 },
];

function DashboardWhatsAppFeed({ onOpen }) {
  const [senderQuery, setSenderQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const feedRows = useMemo(() => WHATSAPP_MESSAGE_SEED.map((message) => ({
    ...message,
    receivedAt: new Date(Date.now() - message.ageHours * 60 * 60 * 1000),
  })), []);
  const filteredRows = useMemo(() => {
    const now = Date.now();
    const dateWindow = dateFilter === "today" ? 24 * 60 * 60 * 1000 : dateFilter === "7d" ? 7 * 24 * 60 * 60 * 1000 : dateFilter === "30d" ? 30 * 24 * 60 * 60 * 1000 : null;
    return feedRows
      .filter((message) => !senderQuery.trim() || message.sender.toLowerCase().includes(senderQuery.trim().toLowerCase()))
      .filter((message) => !dateWindow || now - message.receivedAt.getTime() <= dateWindow)
      .sort((a, b) => sortBy === "sender" ? a.sender.localeCompare(b.sender) : b.receivedAt - a.receivedAt);
  }, [feedRows, senderQuery, dateFilter, sortBy]);
  const unreadCount = feedRows.filter((message) => message.unread).length;

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden" aria-label="WhatsApp feed widget">
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: "#075E54" }}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} className="text-white" />
            <h3 className="text-[13px] font-bold text-white">WhatsApp Feed</h3>
            <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9.5px] font-bold text-white">{unreadCount} unread</span>
          </div>
          <p className="mt-0.5 truncate text-[10.5px] text-white/65">Customer messages from the linked web session</p>
        </div>
        <button type="button" onClick={onOpen} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-[10.5px] font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">
          Open <ChevronRight size={12} />
        </button>
      </div>
      <div className="space-y-2 border-b border-slate-100 bg-slate-50/70 p-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={senderQuery} onChange={(event) => setSenderQuery(event.target.value)} placeholder="Filter by sender" aria-label="Filter WhatsApp messages by sender" className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2.5 text-[11px] text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter WhatsApp messages by date" className="min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-600 outline-none focus:border-emerald-500">
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort WhatsApp messages" className="min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-600 outline-none focus:border-emerald-500">
            <option value="date">Newest first</option>
            <option value="sender">Sender A–Z</option>
          </select>
        </div>
      </div>
      <div className="max-h-[285px] overflow-y-auto px-3 py-2">
        {filteredRows.length === 0 ? (
          <div className="py-8 text-center text-[11.5px] text-slate-400">No WhatsApp messages match these filters.</div>
        ) : filteredRows.map((message) => (
          <button key={message.id} type="button" onClick={onOpen} className="group flex w-full items-start gap-2.5 border-b border-slate-100 py-2.5 text-left last:border-0 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700">{message.sender.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2"><span className="truncate text-[11.5px] font-semibold text-slate-800">{message.sender}</span><span className="shrink-0 text-[10px] text-slate-400">{message.receivedAt.toLocaleDateString([], { month: "short", day: "numeric" })}</span></span>
              <span className="mt-0.5 block truncate text-[11px] text-slate-500">{message.text}</span>
            </span>
            {message.unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-label="Unread message" />}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400">
        <span>{filteredRows.length} of {feedRows.length} messages</span>
        <span className="text-emerald-700">Filter by date or sender</span>
      </div>
    </section>
  );
}

`;
  source = source.replace(feedMarker, `${feedBlock}${feedMarker}`);
}

const oldWhatsAppState = `  const [messages, setMessages] = useState([\n    { id: 1, sender: "Juma Kassam", phone: "+255 715 234 567", text: "Hello, checking on our wholesale invoice payment status for Dar es Salaam branch.", time: "10:42 AM", unread: true, readReceipt: true },\n    { id: 2, sender: "Aisha Mohamed", phone: "+255 784 987 654", text: "Can we schedule a product delivery for Arusha warehouse tomorrow?", time: "09:15 AM", unread: false, readReceipt: true },\n    { id: 3, sender: "Baraka Enterprise", phone: "+255 754 112 233", text: "Sent bank deposit slip for the recent bulk order. Please confirm receipt.", time: "Yesterday", unread: true, readReceipt: false },\n  ]);`;
const newWhatsAppState = `  const [messages, setMessages] = useState(() => WHATSAPP_MESSAGE_SEED.map(({ ageHours, ...message }) => message));`;
if (source.includes(oldWhatsAppState)) source = source.replace(oldWhatsAppState, newWhatsAppState);

const oldReactionHandler = `  function addReaction(msgId, emoji) {\n    setMessageReactions((prev) => {\n      const current = prev[msgId] || {};\n      const count = current[emoji] || 0;\n      return { ...prev, [msgId]: { ...current, [emoji]: count + 1 } };\n    });\n  }`;
const newReactionHandler = `${oldReactionHandler}\n  const threadReactionSummaries = useMemo(() => {\n    const summaries = {};\n    channelMessages.forEach((message) => {\n      const rootId = message.parentRef || message.id;\n      const summary = summaries[rootId] || { messageCount: 0, reactions: {} };\n      summary.messageCount += 1;\n      Object.entries(messageReactions[message.id] || {}).forEach(([emoji, count]) => {\n        summary.reactions[emoji] = (summary.reactions[emoji] || 0) + count;\n      });\n      summaries[rootId] = summary;\n    });\n    return summaries;\n  }, [channelMessages, messageReactions]);`;
if (source.includes(oldReactionHandler) && !source.includes("const threadReactionSummaries")) source = source.replace(oldReactionHandler, newReactionHandler);

const oldReactionRender = `                  const isPinned = pinnedMessageIds.has(m.id);\n                  const reactions = messageReactions[m.id] || {};`;
const newReactionRender = `                  const isPinned = pinnedMessageIds.has(m.id);\n                  const reactions = messageReactions[m.id] || {};\n                  const threadSummary = threadReactionSummaries[m.parentRef || m.id] || { messageCount: 1, reactions: {} };\n                  const threadReactionTotal = Object.values(threadSummary.reactions).reduce((sum, count) => sum + count, 0);`;
if (source.includes(oldReactionRender)) source = source.replace(oldReactionRender, newReactionRender);

const oldReactionControls = `                        <div className="mt-2 flex flex-wrap items-center gap-1.5">\n                          {Object.entries(reactions).map(([emoji, count]) => (`;
const newReactionControls = `                        {!m.parentRef && (threadSummary.messageCount > 1 || threadReactionTotal > 0) && (\n                          <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50/60 px-2 py-1.5" aria-label="Thread reaction summary">\n                            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Thread context</span>\n                            {Object.entries(threadSummary.reactions).map(([emoji, count]) => <span key={emoji} className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">{emoji} {count}</span>)}\n                            <span className="text-[10px] text-emerald-700">{threadSummary.messageCount} message{threadSummary.messageCount === 1 ? "" : "s"}</span>\n                          </div>\n                        )}\n                        <div className="mt-2 flex flex-wrap items-center gap-1.5">\n                          {Object.entries(reactions).map(([emoji, count]) => (`;
if (source.includes(oldReactionControls)) source = source.replace(oldReactionControls, newReactionControls);

const oldByDept = `  const byDept = useMemo(() => {\n    const map = {};\n    employees.rows.forEach(e => { const d = e.department||"General"; map[d]=(map[d]||0)+1; });\n    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));\n  }, [employees.rows]);`;
const newByDept = `  const byDept = useMemo(() => {\n    const map = {};\n    employees.rows.forEach((employee) => {\n      const name = employee.department || "General";\n      const row = map[name] || { name, active: 0, onLeave: 0, inactive: 0, total: 0 };\n      row.total += 1;\n      if (employee.status === "Active") row.active += 1;\n      else if (employee.status === "On Leave") row.onLeave += 1;\n      else row.inactive += 1;\n      map[name] = row;\n    });\n    return Object.values(map).sort((a, b) => b.total - a.total);\n  }, [employees.rows]);`;
if (source.includes(oldByDept)) source = source.replace(oldByDept, newByDept);

const oldHrChart = `        {/* Department breakdown BarChart */}\n        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">\n          <h3 className="text-[14px] font-semibold text-[#111827] mb-3">Headcount by Department</h3>\n          {byDept.length === 0 ? (\n            <p className="text-slate-400 text-center py-8">No department data</p>\n          ) : (\n            <ResponsiveContainer width="100%" height={180}>\n              <BarChart data={byDept} layout="vertical" margin={{left:5,right:20,top:0,bottom:0}}>\n                <XAxis type="number" tick={{fontSize:10}} axisLine={false} tickLine={false}/>\n                <YAxis dataKey="name" type="category" tick={{fontSize:11}} axisLine={false} tickLine={false} width={80}/>\n                <Tooltip formatter={v=>[v+" staff","Department"]}/>\n                <Bar dataKey="value" fill="#16A34A" radius={[0,6,6,0]}/>\n              </BarChart>\n            </ResponsiveContainer>\n          )}\n        </div>`;
const newHrChart = `        {/* Department headcount summary */}\n        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">\n          <div className="flex items-start justify-between gap-3 mb-3">\n            <div>\n              <h3 className="text-[14px] font-semibold text-[#111827]">Department Headcount Summary</h3>\n              <p className="mt-0.5 text-[11px] text-slate-400">Team size with active, leave, and inactive status context</p>\n            </div>\n            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{employees.rows.length} total</span>\n          </div>\n          {byDept.length === 0 ? (\n            <p className="text-slate-400 text-center py-8">No department data</p>\n          ) : (\n            <>\n              <ResponsiveContainer width="100%" height={205}>\n                <BarChart data={byDept} layout="vertical" margin={{left:5,right:20,top:0,bottom:0}}>\n                  <CartesianGrid horizontal={false} stroke="#F1F5F9" />\n                  <XAxis type="number" allowDecimals={false} tick={{fontSize:10}} axisLine={false} tickLine={false}/>\n                  <YAxis dataKey="name" type="category" tick={{fontSize:10.5}} axisLine={false} tickLine={false} width={92}/>\n                  <Tooltip formatter={(value, name) => [value + " staff", name]} />\n                  <Legend iconSize={8} wrapperStyle={{fontSize: "10px"}} />\n                  <Bar dataKey="active" name="Active" stackId="status" fill="#16A34A" />\n                  <Bar dataKey="onLeave" name="On leave" stackId="status" fill="#F59E0B" />\n                  <Bar dataKey="inactive" name="Inactive" stackId="status" fill="#CBD5E1" radius={[0,6,6,0]} />\n                </BarChart>\n              </ResponsiveContainer>\n              <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2 text-[10.5px] text-slate-500">\n                <span><strong className="text-emerald-700">{byDept.reduce((sum, row) => sum + row.active, 0)}</strong> active</span>\n                <span><strong className="text-amber-700">{byDept.reduce((sum, row) => sum + row.onLeave, 0)}</strong> on leave</span>\n                <span><strong className="text-slate-600">{byDept.reduce((sum, row) => sum + row.inactive, 0)}</strong> inactive</span>\n              </div>\n            </>\n          )}\n        </div>`;
if (source.includes(oldHrChart)) source = source.replace(oldHrChart, newHrChart);

const commandPanelEnd = `        </div>\n      </div>\n      {/* ══════════════════ REVENUE vs EXPENSES TREND ══════════════════ */}`;
const commandPanelEndReplacement = `        </div>\n        <DashboardWhatsAppFeed onOpen={() => onNavigate("collaboration")} />\n      </div>\n      {/* ══════════════════ REVENUE vs EXPENSES TREND ══════════════════ */}`;
if (source.includes(commandPanelEnd) && !source.includes("<DashboardWhatsAppFeed")) source = source.replace(commandPanelEnd, commandPanelEndReplacement);

fs.writeFileSync(dashboardPath, source);

let tests = fs.readFileSync(testPath, "utf8");
const testInsertMarker = `  it("supports emoji reactions, pinned messages, calendar reminders, and department workspace permissions", () => {`;
const newTest = `  it("supports threaded reaction summaries, HR department headcount, and WhatsApp feed filters", () => {\n    expect(dashboardSource).toContain("threadReactionSummaries");\n    expect(dashboardSource).toContain("Thread reaction summary");\n    expect(dashboardSource).toContain("Department Headcount Summary");\n    expect(dashboardSource).toContain("dateFilter");\n    expect(dashboardSource).toContain("senderQuery");\n    expect(dashboardSource).toContain("Sender A–Z");\n  });\n`;
if (tests.includes(testInsertMarker) && !tests.includes("supports threaded reaction summaries")) tests = tests.replace(testInsertMarker, `${newTest}${testInsertMarker}`);
fs.writeFileSync(testPath, tests);

console.log("Applied Team Chat reaction summaries, HR headcount summary chart, WhatsApp feed filters, and regression assertions.");
