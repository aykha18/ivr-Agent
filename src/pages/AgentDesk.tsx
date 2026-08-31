import { useEffect } from "react";
import { useAgentStore } from "@/stores/index";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
  pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
  resolved: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  requested: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  scheduled: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
  completed: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
  canceled: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200"}`}>
      {status}
    </span>
  );
}

function formatTime(time: string) {
  try {
    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return date.toLocaleDateString();
  } catch {
    return time;
  }
}

export default function AgentDesk() {
  const { sessions, tickets, callbacks, loading, fetchRecords } = useAgentStore();

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, [fetchRecords]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Agent Desk</h1>
        <p className="text-gray-600 dark:text-gray-400">View tickets, callbacks, and session history</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{tickets.filter((t) => t.status === "open").length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Open Tickets</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{callbacks.filter((c) => c.status === "requested").length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending Callbacks</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{sessions.filter((s) => s.outcome === "escalated").length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Escalated Sessions</div>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Callbacks ({callbacks.length})</h2>
          {callbacks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No callback requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2">ID</th>
                    <th className="text-left py-2">Session</th>
                    <th className="text-left py-2">Phone</th>
                    <th className="text-left py-2">Reason</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {callbacks.map((cb) => (
                    <tr key={cb.callback_id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 font-mono text-xs">{cb.callback_id.substring(0, 8)}</td>
                      <td className="py-2 font-mono text-xs">{cb.session_id.substring(0, 8)}</td>
                      <td className="py-2">{cb.phone || "—"}</td>
                      <td className="py-2">{cb.reason}</td>
                      <td className="py-2"><StatusBadge status={cb.status} /></td>
                      <td className="py-2 text-gray-500 dark:text-gray-400">{formatTime(cb.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Tickets ({tickets.length})</h2>
          {tickets.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No tickets yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2">ID</th>
                    <th className="text-left py-2">Session</th>
                    <th className="text-left py-2">Category</th>
                    <th className="text-left py-2">Order</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.ticket_id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 font-mono text-xs">{t.ticket_id.substring(0, 8)}</td>
                      <td className="py-2 font-mono text-xs">{t.session_id.substring(0, 8)}</td>
                      <td className="py-2">{t.category}</td>
                      <td className="py-2">{t.order_number || "—"}</td>
                      <td className="py-2 max-w-xs truncate">{t.description}</td>
                      <td className="py-2"><StatusBadge status={t.status} /></td>
                      <td className="py-2 text-gray-500 dark:text-gray-400">{formatTime(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Sessions ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No sessions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2">ID</th>
                    <th className="text-left py-2">Channel</th>
                    <th className="text-left py-2">Language</th>
                    <th className="text-left py-2">Outcome</th>
                    <th className="text-left py-2">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.session_id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 font-mono text-xs">{s.session_id.substring(0, 8)}</td>
                      <td className="py-2">{s.channel}</td>
                      <td className="py-2">{s.language || "—"}</td>
                      <td className="py-2"><StatusBadge status={s.outcome} /></td>
                      <td className="py-2 text-gray-500 dark:text-gray-400">{formatTime(s.started_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">Loading...</div>
        </div>
      )}
    </div>
  );
}
