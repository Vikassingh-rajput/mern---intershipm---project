import { PageTitle } from "@/components/shared";
import { SimpleCrud } from "@/components/simple-crud";

export default function SuppliersPage() {
  return (
    <div>
      <PageTitle title="Suppliers" subtitle="Manage supplier contacts and sourcing" />
      <SimpleCrud
        table="suppliers"
        title="Supplier Directory"
        columns={[
          { key: "name", label: "Name" },
          { key: "contact_person", label: "Contact Person" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "address", label: "Address" },
        ]}
      />
    </div>
  );
}
