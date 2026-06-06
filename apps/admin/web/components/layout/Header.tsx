"use client";

import { Navbar } from "../Navbar";
import type { ShellMode } from "../../lib/authenticated-navigation";
import { AuthenticatedNavbar } from "./AuthenticatedNavbar";
import { OpenStaffLogo } from "../OpenStaffLogo";

export function Header({ mode }: { mode: ShellMode }) {
  if (mode === "ONBOARDING") {
    return null;
  }

  if (mode === "LOADING") {
    return (
      <header className="sticky top-0 z-[1000] h-16 border-b border-white/10 bg-[#0F172A]">
        <div className="mx-auto flex h-full max-w-[1600px] items-center px-4 lg:px-6">
          <OpenStaffLogo size="sm" variant="full" dark />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-[1000]">
      {mode === "AUTHENTICATED" ? <AuthenticatedNavbar /> : <Navbar />}
    </header>
  );
}

export default Header;
