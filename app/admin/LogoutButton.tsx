"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded px-3 py-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
    >
      Sign out
    </button>
  );
}
