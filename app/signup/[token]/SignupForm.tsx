"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupForm({
  token,
  suggestedEmail,
}: {
  token: string;
  suggestedEmail?: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/invitations/token/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.message ?? "Unable to create your account.");
        return;
      }

      router.push("/login?registered=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-4 rounded-2xl border border-white/15 bg-black/20 p-6"
    >
      {suggestedEmail && (
        <p className="text-xs text-emerald-100/70">
          We recommend using the email <span className="font-semibold">{suggestedEmail}</span> for
          your notifications.
        </p>
      )}
      <div className="space-y-1">
        <label className="text-sm font-medium text-emerald-100" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
          placeholder="Pick a username"
          autoComplete="username"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-emerald-100" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
          placeholder="Create a strong password"
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-emerald-100" htmlFor="confirmPassword">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
          placeholder="Repeat your password"
          autoComplete="new-password"
        />
      </div>
      {error && (
        <p className="text-sm text-amber-200" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
