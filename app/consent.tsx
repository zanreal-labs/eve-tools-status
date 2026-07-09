"use client";

import { useEffect } from "react";
import {
  ConsentManagerProvider,
  ConsentBanner,
  ConsentDialog,
  useConsentManager,
  useConsentDialogTrigger,
} from "@c15t/react";
import { baseTranslations } from "@c15t/translations/all";
import { Analytics } from "@vercel/analytics/react";
import "@c15t/react/styles.css";

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
  },
} as const;

/**
 * Vercel Analytics only mounts once the visitor granted the "measurement"
 * category — nothing is tracked before consent.
 */
function GatedAnalytics() {
  const { consents } = useConsentManager();
  return consents?.measurement ? <Analytics /> : null;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Pushes c15t consent state into Google Consent Mode v2. GA4 loads with all
 * signals denied by default (layout script); this maps every c15t category to
 * the corresponding Google signal and updates on every consent change.
 */
function GoogleConsentSync() {
  const { consents } = useConsentManager();
  useEffect(() => {
    if (typeof window.gtag !== "function" || !consents) return;
    const g = (granted: boolean | undefined) => (granted ? "granted" : "denied");
    window.gtag("consent", "update", {
      analytics_storage: g(consents.measurement),
      ad_storage: g(consents.marketing),
      ad_user_data: g(consents.marketing),
      ad_personalization: g(consents.marketing),
      functionality_storage: g(consents.functionality),
      personalization_storage: g(consents.experience),
      security_storage: "granted",
    });
  }, [consents]);
  return null;
}

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
        theme,
      }}
    >
      <ConsentBanner />
      <ConsentDialog />
      <DialogBridge />
      <GoogleConsentSync />
      <GatedAnalytics />
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
