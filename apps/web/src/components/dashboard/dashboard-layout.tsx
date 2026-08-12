import type { ReactNode } from "react";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-cm-bg font-creative-body text-cm-text dark:bg-cm-bg dark:text-cm-text">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto p-6 bg-cm-bg dark:bg-cm-bg">{children}</main>
      </div>
    </div>
  );
}
