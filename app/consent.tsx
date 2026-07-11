"use client";

import { useEffect } from "react";
import {
  ConsentManagerProvider,
  ConsentBanner,
  ConsentDialog,
  useConsentDialogTrigger,
} from "@c15t/react";
import { baseTranslations } from "@c15t/translations/all";
import { gtag } from "@c15t/scripts/google-tag";
import { vercelAnalytics } from "@c15t/scripts/vercel-analytics";
import "@c15t/react/styles.css";

/* Analytics via c15t's official vendor integrations: gtag handles the
 * Consent Mode v2 bootstrap/defaults/updates itself; Vercel Analytics
 * is consent-gated on the "measurement" category. */
const analyticsScripts = [
  gtag({ id: "G-FCHN28KZ3T", category: "measurement" }),
  vercelAnalytics(),
];

const FONT_MONO =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Cascadia Mono', monospace";

// Dark mono theme matching the status page. Hides the c15t branding tag.
const theme = {
  colors: {
    primary: "#22d3ee",
    primaryHover: "#67e8f9",
    surface: "#18181b",
    surfaceHover: "#27272a",
    border: "#3f3f46",
    borderHover: "#52525b",
    text: "#e4e4e7",
    textMuted: "#a1a1aa",
    textOnPrimary: "#09090b",
    overlay: "rgba(9, 9, 11, 0.7)",
    switchTrack: "#3f3f46",
    switchTrackActive: "#10b981",
    switchThumb: "#e4e4e7",
  },
  typography: { fontFamily: FONT_MONO },
  radius: { sm: "2px", md: "4px", lg: "6px", full: "999px" },
  shadows: {
    sm: "0 1px 2px rgba(0,0,0,.4)",
    md: "0 6px 18px rgba(0,0,0,.5)",
    lg: "0 24px 60px rgba(0,0,0,.6)",
  },
  consentActions: {
    accept: { variant: "primary", mode: "filled" },
    reject: { variant: "neutral", mode: "stroke" },
    customize: { variant: "neutral", mode: "stroke" },
  },
  slots: {
    consentBannerTag: { className: "ets-c15t-hide" },
    consentDialogTag: { className: "ets-c15t-hide" },
    consentWidgetTag: { className: "ets-c15t-hide" },
    consentBanner: { className: "ets-c15t-banner" },
    consentBannerCard: { className: "ets-c15t-card" },
    consentBannerFooterSubGroup: { className: "ets-c15t-footrow" },
    consentDialog: { className: "ets-c15t-dialog" },
    consentDialogCard: { className: "ets-c15t-dialog-card" },
    consentDialogFooter: { className: "ets-c15t-footrow" },
    consentWidgetFooter: { className: "ets-c15t-footrow" },
    consentWidgetFooterSubGroup: { className: "ets-c15t-footrow" },
  },
} as const;

/** Lets the footer reopen the preferences dialog via a window event. */
function DialogBridge() {
  const { openDialog } = useConsentDialogTrigger({ showWhen: "always" });
  useEffect(() => {
    const handler = () => openDialog();
    window.addEventListener("ets:open-cookie-preferences", handler);
    return () =>
      window.removeEventListener("ets:open-cookie-preferences", handler);
  }, [openDialog]);
  return null;
}

export function Consent() {
  return (
    <ConsentManagerProvider
      options={{
        // No backend: consent is stored locally in the browser.
        mode: "offline",
        i18n: {
          locale: "en",
          detectBrowserLanguage: false,
          messages: { en: baseTranslations.en },
        },
        consentCategories: [
          "necessary",
          "functionality",
          "measurement",
          "experience",
          "marketing",
        ],
        // Analytics load through the consent-gated script loader.
        scripts: analyticsScripts,
        theme,
      }}
    >
      <ConsentBanner />
      <ConsentDialog />
      <DialogBridge />
    </ConsentManagerProvider>
  );
}

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new Event("ets:open-cookie-preferences"))
      }
      className="text-zinc-300 underline-offset-4 hover:underline"
    >
      Cookie preferences
    </button>
  );
}
