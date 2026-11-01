"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AssistantButton, AssistantPanel, AssistantProvider } from "@/components/assistant";
import { WelcomeDialog } from "@/components/welcome-dialog";

// The live product uses a tighter 0.2rem spacing unit across the app; scoped here so the
// marketing site keeps Tailwind's default.
const APP_SPACING = "[--spacing:0.2rem]";

export function Shell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AssistantProvider>
      <div className={`${APP_SPACING} group/shell flex h-screen overflow-hidden bg-background`}>
        <AppSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden panel-expanded:hidden">
          <TopBar onMenu={() => setMobileOpen(true)} />
          <div className="relative flex-1 overflow-y-auto">
            <main className="p-4 lg:p-6">
              <Breadcrumbs />
              {children}
            </main>
          </div>
        </div>
        {/* Record panels (new / detail) portal in here; see components/accounting/kit.tsx SidePanel. */}
        <div id="side-panel-slot" className="flex h-screen shrink-0 panel-expanded:flex-1" />
        <AssistantPanel />
        <AssistantButton />
        <WelcomeDialog />
      </div>
    </AssistantProvider>
  );
}
