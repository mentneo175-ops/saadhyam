import { useEffect, useState } from "react";

type Props = {
  storageKey?: string;
  message?: string;
  ctaLabel?: string;
};

export default function ResponsiveDesktopNotice({
  storageKey = "saadhyam_desktop_notice",
  message = "Best viewed on desktop — Open desktop preview",
  ctaLabel = "Open desktop preview",
}: Props) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v === "1") setHidden(true);
    } catch (e) {}
  }, [storageKey]);

  if (hidden) return null;

  const openDesktopPreview = () => {
    try {
      const url = window.location.href;
      const sep = url.includes("?") ? "&" : "?";
      window.open(url + sep + "desktop_preview=1", "_blank");
    } catch (e) {}
  };

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch (e) {}
    setHidden(true);
  };

  return (
    <div className="block lg:hidden mb-4">
      <div className="flex items-start justify-between gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">{message}</p>
          <p className="text-xs text-yellow-700 mt-1">For the best layout and full controls, open the desktop preview.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openDesktopPreview}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-yellow-200 rounded-md text-sm font-semibold text-yellow-800"
          >
            {ctaLabel}
          </button>
          <button onClick={dismiss} className="text-yellow-600 text-lg leading-4 px-2">×</button>
        </div>
      </div>
    </div>
  );
}
