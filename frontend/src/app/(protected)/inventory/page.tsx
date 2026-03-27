import { PageTitle } from "@/components/shared";
import { SimpleCrud } from "@/components/simple-crud";

export default function InventoryPage() {
  return (
    <div>
      <PageTitle title="Inventory Management" subtitle="Products, stock quantities, categories, and suppliers" />
      <SimpleCrud
        table="products"
        title="Products"
        columns={[
          { key: "name", label: "Name" },
          { key: "sku", label: "SKU" },
          { key: "barcode", label: "Barcode" },
          { key: "price", label: "Price", type: "number" },
          { key: "cost", label: "Cost", type: "number" },
          { key: "stock_quantity", label: "Stock Qty", type: "number" },
          { key: "low_stock_threshold", label: "Low Stock Threshold", type: "number" },
          { key: "category_id", label: "Category ID" },
          { key: "supplier_id", label: "Supplier ID" },
          { key: "image_url", label: "Image URL" },
        ]}
      />
    </div>
  );
}
