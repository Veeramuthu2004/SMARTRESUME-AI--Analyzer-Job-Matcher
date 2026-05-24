import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export const AppShell = () => {
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <section className="w-full">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
};
