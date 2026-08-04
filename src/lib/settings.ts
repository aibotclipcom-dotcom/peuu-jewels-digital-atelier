import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, parseSettings, type SettingsRow, type SiteSettings } from "@/lib/settings-schema";

export type {
  AnnouncementSettings,
  CartSettings,
  ShippingSettings,
  SiteSettings,
  SettingsRow,
} from "@/lib/settings-schema";
export { DEFAULT_SETTINGS, parseSettings } from "@/lib/settings-schema";

export const SITE_SETTINGS_KEY = ["site-settings"] as const;

export const siteSettingsQuery = {
  queryKey: SITE_SETTINGS_KEY,
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<SiteSettings> => {
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (error) throw error;
    return parseSettings(data as SettingsRow[]);
  },
};

export function useSiteSettings(): SiteSettings {
  const { data } = useQuery(siteSettingsQuery);
  return data ?? DEFAULT_SETTINGS;
}
