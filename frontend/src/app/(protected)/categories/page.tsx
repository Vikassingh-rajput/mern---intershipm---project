import { PageTitle } from "@/components/shared";
import { SimpleCrud } from "@/components/simple-crud";

export default function CategoriesPage() {
  return (
    <div>
      <PageTitle title="Categories" subtitle="Create, update, and delete product categories" />
      <SimpleCrud
        table="categories"
        title="Category List"
        columns={[
          { key: "name", label: "Name" },
          { key: "description", label: "Description" },
        ]}
      />
    </div>
  );
}
