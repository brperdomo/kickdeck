import { useOrganizationSettings } from "@/hooks/use-organization-settings";
import { useMediaQuery } from "@/hooks/use-media-query";

export function AdminBanner() {
  const { settings } = useOrganizationSettings();
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return null; // Don't show banner on mobile, we'll use the header instead
  }

  return (
    <div className="w-full bg-white shadow-sm border-b sticky top-0 z-50 hidden md:block">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-center items-center">
          <img
            src={settings?.logoUrl || "/attached_assets/MatchPro.ai_Stacked_Color.png"}
            alt="Organization Logo"
            className="w-auto h-48 md:h-60 max-w-[840px] md:max-w-[960px] object-contain"
          />
        </div>
      </div>
    </div>
  );
}