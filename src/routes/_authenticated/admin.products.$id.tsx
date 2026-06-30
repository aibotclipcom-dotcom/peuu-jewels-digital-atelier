import { createFileRoute } from "@tanstack/react-router";
import { AdminProductEditor } from "@/components/AdminProductEditor";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: EditProductRoute,
});

function EditProductRoute() {
  const { id } = Route.useParams();
  return <AdminProductEditor productId={id} />;
}
