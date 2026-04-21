import SectionHeader from "../../components/SectionHeader";
import DataTable from "../../components/DataTable";

export default function SupervisorsPage() {
  const columns = [
    "Name",
    "Type",
    "Country",
    "Contract",
    "Status",
  ];

  const rows = [
    ["Mihai Popescu", "Execution", "RO", "Direct", "Available"],
    ["Andrei Ionescu", "SSM", "IE", "Assigned", "Active"],
    ["Laura Stan", "Contractual", "DE", "Independent", "Available"],
  ];

  return (
    <div className="p-6 md:p-8">
      <SectionHeader
        eyebrow="Supervisors"
        title="Supervision Layer"
        description="Execution, SSM and contractual supervisors."
      />

      <div className="bg-slate-900 p-6 rounded-3xl">
        <DataTable columns={columns} rows={rows} statusColumns={[4]} />
      </div>
    </div>
  );
}