"use client";

import { useEffect } from "react";
import {
  ConsentManagerProvider,
  ConsentBanner,
  ConsentDialog,
  useConsentDialogTrigger,
} from "@c15t/react";
import { baseTranslations } from "@c15t/translations/all";
import "@c15t/react/styles.css";

const GA_ID = "G-FCHN28KZ3T";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/* Analytics load through c15t's consent-gated script loader.
 *
 * - gtag bootstrap + gtag.js use Google Consent Mode v2 in advanced mode:
 *   they always load, every signal defaults to denied, and c15t's
 *   onConsentChange pushes category changes into consent updates.
 * - Vercel Analytics only loads at all once "measurement" is granted,
 *   and c15t unloads it again if consent is revoked.
 */
const analyticsScripts = [
  {
    id: "gtag-bootstrap",
    category: "necessary" as const,
    alwaysLoad: true,
    textContent: `
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500,
});
gtag('set', 'url_passthrough', true);
gtag('set', 'ads_data_redaction', true);
gtag('js', new Date());
gtag('config', '${GA_ID}');`,
  },
  {
    id: "google-analytics",
    src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`,
    category: "measurement" as const,
    alwaysLoad: true, // Consent Mode v2 advanced — gtag honours the signals above
    async: true,
    onConsentChange: ({
      consents,
    }: {
      consents: Record<string, boolean>;
    }) => {
      if (typeof window.gtag !== "function") return;
      const g = (granted: boolean | undefined) =>
        granted ? "granted" : "denied";
      window.gtag("consent", "update", {
        analytics_storage: g(consents.measurement),
        ad_storage: g(consents.marketing),
        ad_user_data: g(consents.marketing),
        ad_personalization: g(consents.marketing),
        functionality_storage: g(consents.functionality),
        personalization_storage: g(consents.experience),
        security_storage: "granted",
      });
    },
  },
  {
    id: "vercel-analytics",
    src: "/_vercel/insights/script.js",
    category: "measurement" as const,
    defer: true,
  },
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
