export default function AgeVerificationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold text-white">Age verification</h1>
      <div className="mt-6 max-w-none space-y-4 text-sm leading-relaxed text-zinc-400">
        <p>
          This platform may offer adult-leaning experiences depending on how you configure
          personas and marketing. You are responsible for complying with applicable age and
          consent laws in each region you operate.
        </p>
        <p>
          The technical baseline in this codebase includes an{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">ageVerified</code>{" "}
          flag on users for gating premium or sensitive content. Replace the placeholder with
          your chosen provider (document scan, third-party API, or attestation flow) before
          production launch.
        </p>
        <p>
          Nothing here is legal advice — have counsel review your flows for the US, Canada,
          EU, and any other market you target.
        </p>
      </div>
    </div>
  );
}
