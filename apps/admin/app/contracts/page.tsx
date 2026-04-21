import SectionHeader from "../../components/SectionHeader";
import DataTable from "../../components/DataTable";
import StatCard from "../../components/StatCard";

export default function ContractsPage() {
  const columns = [
    "Code",
    "Employer",
    "Supplier",
    "Value",
    "Billing",
    "Guarantee",
    "Signature",
  ];

  const rows = [
    ["CTR-001", "GESOO", "SAP CONS", "€126k", "Bi-weekly", "Active", "Completed"],
    ["CTR-002", "NordGrid", "CON ING", "€88k", "Weekly", "Pending", "Pending"],
  ];

  return (
    <div className="p-6 md:p-8">
      <SectionHeader
        eyebrow="Contracts"
        title="Contract Management"
        description="Full lifecycle management with OTP signing and guarantees."
      />

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Signed" value="97" />
        <StatCard title="Pending OTP" value="12" />
        <StatCard title="Amendments" value="4" />
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl">
        <DataTable columns={columns} rows={rows} statusColumns={[5, 6]} />
      </div>
    </div>
  );
}