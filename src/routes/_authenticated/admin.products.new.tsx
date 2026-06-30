import { createFileRoute, redirect } from "@tanstack/react-router";

// "new" is handled by /admin/products/$id with id === "new"
export const Route = createFileRoute("/_authenticated/admin/products/new")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/products/$id", params: { id: "new" } });
  },
});
