import { BottomNav, SideNav } from "./Nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <SideNav />
      <div className="flex flex-1 flex-col">
        <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-4 lg:max-w-2xl lg:pb-8 lg:pt-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
