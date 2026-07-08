export type Monitor = {
  id: string;
  name: string;
  url: string;
  siteUrl: string;
  description: string;
};

export type Category = {
  id: string;
  name: string;
  monitors: Monitor[];
};

export const REGIONS = ["iad1", "sfo1", "fra1", "syd1"] as const;
export type Region = (typeof REGIONS)[number];

export const REGION_LABELS: Record<Region, string> = {
  iad1: "US East",
  sfo1: "US West",
  fra1: "Europe",
  syd1: "Oceania",
};

export const CATEGORIES: Category[] = [
  {
    id: "core",
    name: "Core Services",
    monitors: [
      {
        id: "esi",
        name: "ESI API",
        url: "https://esi.evetech.net/latest/status/?datasource=tranquility",
        siteUrl: "https://developers.eveonline.com/api-explorer",
        description: "Official EVE Swagger Interface",
      },
      {
        id: "sso",
        name: "EVE SSO",
        url: "https://login.eveonline.com/.well-known/oauth-authorization-server",
        siteUrl: "https://developers.eveonline.com/docs/services/sso/",
        description: "EVE Online single sign-on",
      },
      {
        id: "zkillboard",
        name: "zKillboard",
        url: "https://zkillboard.com/",
        siteUrl: "https://zkillboard.com/",
        description: "Killmail aggregator",
      },
    ],
  },
  {
    id: "market",
    name: "Market Tools",
    monitors: [
      {
        id: "fuzzwork",
        name: "Fuzzwork Market",
        url: "https://market.fuzzwork.co.uk/aggregates/?region=10000002&types=34",
        siteUrl: "https://market.fuzzwork.co.uk/",
        description: "Market aggregates API",
      },
      {
        id: "janice",
        name: "Janice",
        url: "https://janice.e-351.com/",
        siteUrl: "https://janice.e-351.com/",
        description: "Appraisal tool",
      },
      {
        id: "adam4eve",
        name: "Adam4EVE",
        url: "https://www.adam4eve.eu/",
        siteUrl: "https://www.adam4eve.eu/",
        description: "Market charts & statistics",
      },
      {
        id: "evetycoon",
        name: "EVE Tycoon",
        url: "https://evetycoon.com/",
        siteUrl: "https://evetycoon.com/",
        description: "Market browser & profit tracking",
      },
    ],
  },
  {
    id: "maps",
    name: "Maps & Intel",
    monitors: [
      {
        id: "dotlan",
        name: "Dotlan EveMaps",
        url: "https://evemaps.dotlan.net/",
        siteUrl: "https://evemaps.dotlan.net/",
        description: "Maps & sovereignty",
      },
      {
        id: "evescout",
        name: "EVE-Scout",
        url: "https://api.eve-scout.com/v2/public/signatures",
        siteUrl: "https://www.eve-scout.com/",
        description: "Thera & Turnur connections API",
      },
      {
        id: "jitaspace",
        name: "Jita.space",
        url: "https://www.jita.space/",
        siteUrl: "https://www.jita.space/",
        description: "EVE reference client",
      },
    ],
  },
  {
    id: "reference",
    name: "Reference",
    monitors: [
      {
        id: "everef",
        name: "EVE Ref",
        url: "https://everef.net/",
        siteUrl: "https://everef.net/",
        description: "Item & universe reference",
      },
      {
        id: "eveuni",
        name: "EVE University Wiki",
        url: "https://wiki.eveuniversity.org/Main_Page",
        siteUrl: "https://wiki.eveuniversity.org/",
        description: "Community knowledge base",
      },
      {
        id: "eveworkbench",
        name: "EVE Workbench",
        url: "https://www.eveworkbench.com/",
        siteUrl: "https://www.eveworkbench.com/",
        description: "Fitting & market platform",
      },
    ],
  },
];

export const MONITORS: Monitor[] = CATEGORIES.flatMap((c) => c.monitors);
