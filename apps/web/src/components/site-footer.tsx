import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Persona Platform · AI personas with memory and live chat.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
          <Link href="/legal/age" className="hover:text-white">
            Age verification
          </Link>
          <Link href="/legal/dmca" className="hover:text-white">
            DMCA
          </Link>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/v1/health`}
            className="hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            API health
          </a>
        </div>
      </div>
    </footer>
  );
}
