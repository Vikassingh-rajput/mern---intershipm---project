import { PageTitle } from "@/components/shared";
import { SimpleCrud } from "@/components/simple-crud";

export default function UsersPage() {
  return (
    <div>
      <PageTitle title="User Management" subtitle="Admin-only staff and role management" />
      <SimpleCrud
        table="users"
        title="Users"
        adminOnly
        columns={[
          { key: "email", label: "Email" },
          { key: "full_name", label: "Full Name" },
          { key: "role", label: "Role" },
        ]}
      />
    </div>
  );
}
