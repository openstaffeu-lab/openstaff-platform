export default function CountriesVatPage() {
  const countries = [
    { country: "Finland", currency: "EUR", vatMode: "EU VAT", reverseCharge: "Enabled" },
    { country: "Ireland", currency: "EUR", vatMode: "EU VAT", reverseCharge: "Enabled" },
    { country: "United Kingdom", currency: "GBP", vatMode: "Local VAT", reverseCharge: "Review" },
    { country: "Turkey", currency: "TRY", vatMode: "Local VAT", reverseCharge: "Manual" },
  ];

  return (
    <div className="p-6 md:p-8">
      <section className="mb-8">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-400">Countries & VAT</div>
        <h2 className="mt-2 text-3xl font-semibold">Country, VAT and Currency Configuration</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Manage active countries, VAT validation settings, reverse charge rules,
          currency behavior, localization and geographic normalization rules.
        </p>
      </section>

      <section className="rounded-3xl bg-slate-900 p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h3 className="text-2xl font-semibold">Country Rules</h3>
          <button className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950">
            Add Country Rule
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-400">
              <tr>
                <th className="p-4 font-medium">Country</th>
                <th className="p-4 font-medium">Currency</th>
                <th className="p-4 font-medium">VAT Mode</th>
                <th className="p-4 font-medium">Reverse Charge</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((item) => (
                <tr key={item.country} className="border-t border-slate-800">
                  <td className="p-4">{item.country}</td>
                  <td className="p-4">{item.currency}</td>
                  <td className="p-4">{item.vatMode}</td>
                  <td className="p-4">{item.reverseCharge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}