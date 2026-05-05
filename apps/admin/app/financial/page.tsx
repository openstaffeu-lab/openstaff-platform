import DataTable from "../../components/DataTable";
import SectionHeader from "../../components/SectionHeader";
import StatCard from "../../components/StatCard";

export default function FinancialPage() {
  const columns = ["Issuer", "Recipient", "Type", "Amount", "Status"];

  const rows = [
    ["OpenStaff", "GESOO", "Commission", "EUR 14k", "Issued"],
    ["CON ING", "NordGrid", "Services", "EUR 22k", "Approved"],
    ["Insurance", "GESOO", "Policy", "EUR 4k", "Pending"],
  ];

  return (
    <div className="p-6 md:p-8">
      <SectionHeader
        eyebrow="Financial"
        title="Financial Engine"
        description="Invoices, guarantees and automation."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard title="Revenue" value="EUR 82k" />
        <StatCard title="Pending" value="EUR 9k" />
        <StatCard title="Guarantees" value="EUR 67k" />
      </div>

      <div className="rounded-3xl bg-slate-900 p-6">
        <DataTable columns={columns} rows={rows} statusColumns={[4]} />
      </div>
    </div>
  );
}
