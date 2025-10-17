"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";

type UserRow = {
  id: number;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

type InvitationRow = {
  id: number;
  token: string;
  email: string | null;
  role: UserRole;
  createdAt: string;
  expiresAt: string | null;
  usedAt: string | null;
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "Editor" },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

function buildInviteLink(token: string) {
  if (typeof window === "undefined") return token;
  return `${window.location.origin}/signup/${token}`;
}

export default function UsersManager({
  users,
  invitations,
}: {
  users: UserRow[];
  invitations: InvitationRow[];
}) {
  const router = useRouter();

  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    role: "user" as UserRole,
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<{
    username: string;
    password: string;
    role: UserRole;
  } | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "user" as UserRole,
    expiresAt: "",
  });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  function handleCreateChange(
    field: "username" | "password" | "role",
    value: string,
  ) {
    setCreateForm((prev) => ({
      ...prev,
      [field]: field === "role" ? (value as UserRole) : value,
    }));
  }

  async function submitCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    setCreatingUser(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const firstFieldError = payload?.errors
          ? Object.values(payload.errors.fieldErrors ?? {})
              .flat()
              .at(0)
          : null;
        setCreateError(payload?.message ?? firstFieldError ?? "Unable to create user.");
        return;
      }

      setCreateForm({ username: "", password: "", role: "user" });
      router.refresh();
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Unable to create user account.",
      );
    } finally {
      setCreatingUser(false);
    }
  }

  function startEditing(user: UserRow) {
    setEditingId(user.id);
    setEditingError(null);
    setEditingForm({
      username: user.username,
      password: "",
      role: user.role,
    });
  }

  async function submitEditUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingForm || editingId === null) return;
    setSavingEdit(true);
    setEditingError(null);

    try {
      const response = await fetch(`/api/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingForm),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const firstFieldError = payload?.errors
          ? Object.values(payload.errors.fieldErrors ?? {})
              .flat()
              .at(0)
          : null;
        setEditingError(payload?.message ?? firstFieldError ?? "Unable to update user.");
        return;
      }

      setEditingId(null);
      setEditingForm(null);
      router.refresh();
    } catch (error) {
      setEditingError(
        error instanceof Error ? error.message : "Unable to update user.",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteUser(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        alert(payload?.message ?? "Unable to delete user.");
        return;
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to delete user.");
    }
  }

  function handleInviteChange(
    field: "email" | "role" | "expiresAt",
    value: string,
  ) {
    setInviteForm((prev) => ({
      ...prev,
      [field]: field === "role" ? (value as UserRole) : value,
    }));
  }

  async function createInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteError(null);
    setCreatingInvite(true);

    try {
      const payload = {
        email: inviteForm.email,
        role: inviteForm.role,
        expiresAt: inviteForm.expiresAt,
      };

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const firstFieldError = body?.errors
          ? Object.values(body.errors.fieldErrors ?? {})
              .flat()
              .at(0)
          : null;
        setInviteError(body?.message ?? firstFieldError ?? "Unable to create invitation.");
        return;
      }

      const invitation: InvitationRow = await response.json();
      setInviteForm({ email: "", role: "user", expiresAt: "" });
      setLastInviteLink(buildInviteLink(invitation.token));
      router.refresh();
    } catch (error) {
      setInviteError(
        error instanceof Error ? error.message : "Unable to create invitation.",
      );
    } finally {
      setCreatingInvite(false);
    }
  }

  async function revokeInvitation(id: number) {
    const confirmed = window.confirm(
      "Revoke this invitation link? Recipients will no longer be able to sign up with it.",
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/invitations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        alert(payload?.message ?? "Unable to revoke invitation.");
        return;
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to revoke invitation.");
    }
  }

  async function copyToClipboard(token: string) {
    const link = buildInviteLink(token);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 3000);
    } catch (error) {
      console.error("Clipboard copy failed", error);
      alert("Copy failed. Try selecting the link and copying manually.");
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">Team access</h1>
        <p className="mt-2 text-sm text-stone-600">
          Invite trusted editors, adjust roles, or remove accounts that no longer need
          access.
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Create a user</h2>
          <p className="mt-1 text-sm text-stone-600">
            Create accounts directly for teammates who are ready to log in.
          </p>
          <form className="mt-6 space-y-4" onSubmit={submitCreateUser}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700" htmlFor="new-username">
                Username
              </label>
              <input
                id="new-username"
                value={createForm.username}
                onChange={(event) => handleCreateChange("username", event.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="jessie"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700" htmlFor="new-password">
                Password
              </label>
              <input
                id="new-password"
                type="password"
                value={createForm.password}
                onChange={(event) => handleCreateChange("password", event.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700" htmlFor="new-role">
                Role
              </label>
              <select
                id="new-role"
                value={createForm.role}
                onChange={(event) => handleCreateChange("role", event.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {createError && (
              <p className="text-sm text-red-600" role="alert">
                {createError}
              </p>
            )}
            <button
              type="submit"
              disabled={creatingUser}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingUser ? "Creating…" : "Create user"}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-800">Generate invitation</h2>
          <p className="mt-1 text-sm text-emerald-700">
            Send a single-use link that lets a teammate pick their own password.
          </p>
          <form className="mt-6 space-y-4" onSubmit={createInvitation}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-emerald-900" htmlFor="invite-email">
                Email <span className="text-emerald-500">(optional)</span>
              </label>
              <input
                id="invite-email"
                value={inviteForm.email}
                onChange={(event) => handleInviteChange("email", event.target.value)}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="friend@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-emerald-900" htmlFor="invite-role">
                Role
              </label>
              <select
                id="invite-role"
                value={inviteForm.role}
                onChange={(event) => handleInviteChange("role", event.target.value)}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-emerald-900" htmlFor="invite-expiry">
                Expires <span className="text-emerald-500">(optional)</span>
              </label>
              <input
                id="invite-expiry"
                type="datetime-local"
                value={inviteForm.expiresAt}
                onChange={(event) => handleInviteChange("expiresAt", event.target.value)}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            {inviteError && (
              <p className="text-sm text-red-600" role="alert">
                {inviteError}
              </p>
            )}
            <button
              type="submit"
              disabled={creatingInvite}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingInvite ? "Generating…" : "Generate invite"}
            </button>
            {lastInviteLink && (
              <div className="rounded-lg border border-emerald-300 bg-white/70 px-4 py-3 text-xs text-emerald-800">
                <p className="font-semibold text-emerald-900">Share this link:</p>
                <p className="mt-1 break-all">{lastInviteLink}</p>
              </div>
            )}
          </form>
        </div>
      </section>

      <section className="space-y-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-stone-900">Current users</h2>
          <p className="text-sm text-stone-500">{users.length} total</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-stone-200">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50">
              <tr className="text-left font-semibold text-stone-500">
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {users.map((user) =>
                editingId === user.id && editingForm ? (
                  <tr key={user.id} className="bg-emerald-50/60">
                    <td className="px-4 py-3" colSpan={5}>
                      <form className="grid gap-4" onSubmit={submitEditUser}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs font-medium uppercase text-stone-600">
                              Username
                            </label>
                            <input
                              value={editingForm.username}
                              onChange={(event) =>
                                setEditingForm((prev) =>
                                  prev
                                    ? { ...prev, username: event.target.value }
                                    : prev,
                                )
                              }
                              className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium uppercase text-stone-600">
                              Role
                            </label>
                            <select
                              value={editingForm.role}
                              onChange={(event) =>
                                setEditingForm((prev) =>
                                  prev
                                    ? { ...prev, role: event.target.value as UserRole }
                                    : prev,
                                )
                              }
                              className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            >
                              {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium uppercase text-stone-600">
                            New password <span className="text-stone-400">(optional)</span>
                          </label>
                          <input
                            type="password"
                            value={editingForm.password}
                            onChange={(event) =>
                              setEditingForm((prev) =>
                                prev
                                  ? { ...prev, password: event.target.value }
                                  : prev,
                              )
                            }
                            className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            placeholder="Leave blank to keep current password"
                          />
                        </div>
                        {editingError && (
                          <p className="text-sm text-red-600" role="alert">
                            {editingError}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditingForm(null);
                              setEditingError(null);
                            }}
                            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={savingEdit}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingEdit ? "Saving…" : "Save changes"}
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-medium text-stone-900">{user.username}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-stone-600">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-stone-500">{formatDate(user.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEditing(user)}
                          className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(user.id)}
                          className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
              {users.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-stone-500" colSpan={5}>
                    No users yet. Create the first account above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-stone-900">Invitation links</h2>
          <p className="text-sm text-stone-500">{invitations.length} generated</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-stone-200">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr className="text-left font-semibold">
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {invitations.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-stone-500" colSpan={7}>
                    No invitations yet. Generate a link above to invite a teammate.
                  </td>
                </tr>
              ) : (
                invitations.map((invitation) => {
                  const link = buildInviteLink(invitation.token);
                  const isUsed = Boolean(invitation.usedAt);
                  const isExpired =
                    !isUsed &&
                    invitation.expiresAt !== null &&
                    new Date(invitation.expiresAt).getTime() < Date.now();

                  return (
                    <tr key={invitation.id}>
                      <td className="px-4 py-3 font-mono text-xs text-stone-500">
                        {invitation.token}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {invitation.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-stone-600">
                          {invitation.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500">
                        {formatDate(invitation.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-stone-500">
                        {formatDate(invitation.expiresAt)}
                      </td>
                      <td className="px-4 py-3">
                        {isUsed ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Used
                          </span>
                        ) : isExpired ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Expired
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(invitation.token)}
                            className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                          >
                            {copiedToken === invitation.token ? "Copied!" : "Copy link"}
                          </button>
                          {!isUsed && (
                            <button
                              type="button"
                              onClick={() => revokeInvitation(invitation.id)}
                              className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                        {!isUsed && (
                          <p className="mt-1 text-xs text-stone-400">{link}</p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
