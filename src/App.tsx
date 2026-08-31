import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Simulator from "@/pages/Simulator";
import AgentDesk from "@/pages/AgentDesk";
import AdminDashboard from "@/pages/AdminDashboard";
import Home from "@/pages/Home";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const NAV_ITEMS = [
  { path: "/", label: "Simulator" },
  { path: "/agent", label: "Agent Desk" },
  { path: "/admin", label: "Admin" },
];

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={
              <ErrorBoundary>
                <Simulator />
              </ErrorBoundary>
            } />
            <Route path="/agent" element={
              <ErrorBoundary>
                <AgentDesk />
              </ErrorBoundary>
            } />
            <Route path="/admin" element={
              <ErrorBoundary>
                <AdminDashboard />
              </ErrorBoundary>
            } />
            <Route path="/home" element={
              <ErrorBoundary>
                <Home />
              </ErrorBoundary>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
