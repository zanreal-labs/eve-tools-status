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
    ],
  },
  {
    id: "combat",
    name: "Killboards & Combat",
    monitors: [
      {
        id: "zkillboard",
        name: "zKillboard",
        url: "https://zkillboard.com/",
        siteUrl: "https://zkillboard.com/",
        description: "Killmail aggregator",
      },
      {
        id: "evekill",
        name: "EVE-KILL",
        url: "https://eve-kill.com/",
        siteUrl: "https://eve-kill.com/",
        description: "Killboard & battle intel",
      },
      {
        id: "brevetools",
        name: "BR EVE Tools",
        url: "https://br.evetools.org/",
        siteUrl: "https://br.evetools.org/",
        description: "Battle report generator",
      },
    ],
  },
  {
    id: "market",
    name: "Market & Industry",
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
      {
        id: "ravworks",
        name: "Ravworks",
        url: "https://ravworks.com/",
        siteUrl: "https://ravworks.com/",
        description: "Industry & production planner",
      },
      {
        id: "mutaplasmid",
        name: "Mutaplasmid.space",
        url: "https://mutaplasmid.space/",
        siteUrl: "https://mutaplasmid.space/",
        description: "Abyssal module market & stats",
      },
      {
        id: "abysstracker",
        name: "Abyss Tracker",
        url: "https://abysstracker.com/",
        siteUrl: "https://abysstracker.com/",
        description: "Abyssal run & loot tracker",
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
      {
        id: "gatecheck",
        name: "Gatecamp Check",
        url: "https://eve-gatecheck.space/",
        siteUrl: "https://eve-gatecheck.space/",
        description: "Gatecamp checker for travel routes",
      },
      {
        id: "dscan",
        name: "DScan.info",
        url: "https://dscan.info/",
        siteUrl: "https://dscan.info/",
        description: "D-Scan & fleet composition analyzer",
      },
      {
        id: "localthreat",
        name: "Local Threat",
        url: "https://localthreat.xyz/",
        siteUrl: "https://localthreat.xyz/",
        description: "Local chat threat analysis",
      },
      {
        id: "incursions",
        name: "EVE Incursions",
        url: "https://eve-incursions.de/",
        siteUrl: "https://eve-incursions.de/",
        description: "Incursion spawn tracker",
      },
    ],
  },
  {
    id: "wormholes",
    name: "Wormholes",
    monitors: [
      {
        id: "tripwire",
        name: "Tripwire",
        url: "https://tripwiremap.app/",
        siteUrl: "https://tripwiremap.app/",
        description: "Wormhole mapping tool",
      },
      {
        id: "anoikis",
        name: "Anoik.is",
        url: "https://anoik.is/",
        siteUrl: "https://anoik.is/",
        description: "Wormhole system database",
      },
      {
        id: "nexum",
        name: "Nexum",
        url: "https://eve-nexum.com/",
        siteUrl: "https://eve-nexum.com/",
        description: "Open-source wormhole mapper",
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
      {
        id: "hoboleaks",
        name: "Hoboleaks",
        url: "https://hoboleaks.space/",
        siteUrl: "https://hoboleaks.space/",
        description: "Datamined patch diffs",
      },
    ],
  },
];

export const MONITORS: Monitor[] = CATEGORIES.flatMap((c) => c.monitors);
