import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/** Wishlist state for the signed-in shopper. */
export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: ids = new Set<string>() } = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.product_id as string));
    },
  });

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Please sign in to save pieces to your wishlist.");
      if (ids.has(productId)) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase
        .from("wishlist")
        .insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ["wishlist", user?.id] });
      toast.success(result === "added" ? "Saved to your wishlist" : "Removed from your wishlist");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return {
    isSaved: (id: string) => ids.has(id),
    toggle: (id: string) => toggle.mutate(id),
    pending: toggle.isPending,
    enabled: !!user,
  };
}
