import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SignupForm from "./SignupForm";
import { getDefaultLocale } from "@/lib/settings";

type SignupPageProps = {
  params: { token: string };
};

function isExpired(expiresAt: Date | null | undefined) {
  return expiresAt ? expiresAt.getTime() < Date.now() : false;
}

export default async function SignupPage({ params }: SignupPageProps) {
  const invitation = await prisma.invitation.findUnique({
    where: { token: params.token },
    include: { consumedBy: true },
  });

  if (!invitation) {
    notFound();
  }

  const expired = isExpired(invitation.expiresAt);
  const used = Boolean(invitation.usedAt);

  const defaultLocale = await getDefaultLocale();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-stone-900 via-stone-900/90 to-stone-900 px-6 py-16 text-stone-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-2 text-sm text-emerald-200">
          <Link
            href={`/${defaultLocale}`}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300 transition hover:text-emerald-100"
          >
            <span aria-hidden>←</span>
            Back to homestead
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          <h1 className="text-2xl font-semibold text-white">Create your account</h1>
          <p className="text-sm text-emerald-100/80">
            You&apos;ve been invited to join the CCJM Homesteading admin team. Choose a
            username and password to get started.
          </p>
          {invitation.email && (
            <p className="text-xs text-emerald-200/80">
              Invitation sent to <span className="font-semibold">{invitation.email}</span>
            </p>
          )}
        </div>

        {used ? (
          <p className="mt-6 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            This invitation has already been used. Ask an admin for a new link.
          </p>
        ) : expired ? (
          <p className="mt-6 rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-200">
            This invitation link has expired. Request a fresh link from an administrator.
          </p>
        ) : (
          <SignupForm token={invitation.token} suggestedEmail={invitation.email ?? undefined} />
        )}
      </div>
    </div>
  );
}
