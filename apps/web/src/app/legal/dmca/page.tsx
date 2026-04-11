export default function DmcaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold text-white">DMCA & copyright</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-400">
        <p>
          Persona Platform hosts persona-generated and user-facing content. If you believe
          material on the service infringes your copyright, send a notice that includes:
        </p>
        <ul className="list-inside list-disc space-y-2">
          <li>Identification of the copyrighted work and the allegedly infringing material</li>
          <li>Your contact information and a good-faith statement</li>
          <li>A statement under penalty of perjury that your claim is accurate</li>
          <li>Your physical or electronic signature</li>
        </ul>
        <p>
          Replace this placeholder with your legal entity name, registered agent, and an email
          or postal address monitored for takedown requests.
        </p>
        <p className="text-zinc-500">
          Template only — have qualified counsel finalize before you accept public traffic.
        </p>
      </div>
    </div>
  );
}
