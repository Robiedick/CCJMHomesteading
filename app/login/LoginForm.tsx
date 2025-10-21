"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

type LoginFormCopy = {
  usernameLabel: string;
  usernamePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  signInButtonLabel: string;
  signingInLabel: string;
  sessionExpiredMessage: string;
  invalidCredentialsMessage: string;
  successMessage: string;
};

export default function LoginForm({ copy }: { copy: LoginFormCopy }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const initialSuccess = searchParams.get("registered")
    ? copy.successMessage
    : null;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    callbackError ? copy.sessionExpiredMessage : null,
  );
  const [success, setSuccess] = useState<string | null>(initialSuccess);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError(copy.invalidCredentialsMessage);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-stone-200 bg-white p-6 shadow-lg"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-stone-700" htmlFor="username">
          {copy.usernameLabel}
        </label>
        <input
          id="username"
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder={copy.usernamePlaceholder}
        />
      </div>
      <div className="mt-4 space-y-1">
        <label className="text-sm font-medium text-stone-700" htmlFor="password">
          {copy.passwordLabel}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder={copy.passwordPlaceholder}
        />
      </div>
      {success && (
        <p className="mt-4 text-sm text-emerald-700" role="status">
          {success}
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? copy.signingInLabel : copy.signInButtonLabel}
      </button>
    </form>
  );
}
