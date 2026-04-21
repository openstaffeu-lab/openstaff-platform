export default function ServicesPage() {
  const services = [
    { name: "PPS / UK support", pricing: "Fixed or per user", status: "Active" },
    { name: "Country authorizations", pricing: "Per contract", status: "Active" },
    { name: "Flight tickets", pricing: "Operational pass-through", status: "Active" },
    { name: "Accommodation support", pricing: "Per booking", status: "Active" },
    { name: "Tax recovery support", pricing: "Per case", status: "Draft" },
  ];

  return (
    <div className="p-6 md:p-8">
      <section className="mb-8">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-400">Services</div>
        <h2 className="mt-2 text-3xl font-semibold">Extra Services Catalog</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Configure paid platform services including logistics, authorizations, PPS support,
          tax recovery, insurance support and premium administration services.
        </p>
      </section>

      <section className="rounded-3xl bg-slate-900 p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h3 className="text-2xl font-semibold">Configurable Services</h3>
          <button className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950">
            Add Service
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-400">
              <tr>
                <th className="p-4 font-medium">Service</th>
                <th className="p-4 font-medium">Pricing</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.name} className="border-t border-slate-800">
                  <td className="p-4">{service.name}</td>
                  <td className="p-4">{service.pricing}</td>
                  <td className="p-4">{service.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}