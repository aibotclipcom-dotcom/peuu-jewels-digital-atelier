import { createFileRoute } from "@tanstack/react-router";
import { AdminProductEditor } from "@/components/AdminProductEditor";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  component: () => <AdminProductEditor />,
});
