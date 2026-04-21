import SectionHeader from "../../components/SectionHeader";
import DataTable from "../../components/DataTable";

export default function ProfessionalsPage() {
  const columns = [
    "Company",
    "Country",
    "Specialization",
    "Availability",
    "Compliance",
    "Rating",
  ];

  const rows = [
    ["CON ING SRL", "RO", "Electrical", "Available", "Valid", "4.8"],
    ["SAP CONS", "RO", "Cable Works", "Active", "Valid", "4.7"],
    ["BuildVolt", "PL", "Medium Voltage", "Available", "Review", "4.5"],
  ];

  return (
    <div className="p-6 md:p-8">
      <SectionHeader
        eyebrow="Professionals"
        title="Suppliers & Workforce"
        description="Manage subcontractors, certifications, ratings and availability."
      />

      <div className="bg-slate-900 p-6 rounded-3xl">
        <DataTable columns={columns} rows={rows} statusColumns={[3, 4]} />
      </div>
    </div>
  );
}