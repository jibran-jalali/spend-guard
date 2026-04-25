"use client";

import { useState } from "react";
import {
  SiCanva,
  SiDropbox,
  SiFigma,
  SiGithub,
  SiGoogle,
  SiHubspot,
  SiJira,
  SiNetflix,
  SiNotion,
  SiShopify,
  SiSlack,
  SiSpotify,
  SiVercel,
  SiYoutube,
  SiZoom,
  SiOpenai
} from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import {
  Blocks,
  BookOpenText,
  Calculator,
  CloudCog,
  CreditCard,
  PenTool,
  Video,
  MonitorPlay,
  Shield,
  Users,
  Brain,
  DollarSign,
  Database,
  Grid,
  BarChart3,
  Mail,
  Activity,
  Snowflake,
  LifeBuoy,
  MessageSquare,
  CheckSquare,
  Box
} from "lucide-react";

const ICON_MAP = {
  adobe: PenTool,
  aws: CloudCog,
  amazon: CloudCog,
  asana: CheckSquare,
  canva: SiCanva,
  datadog: Activity,
  dropbox: SiDropbox,
  figma: SiFigma,
  github: SiGithub,
  google: FcGoogle,
  hubspot: SiHubspot,
  intercom: MessageSquare,
  jira: SiJira,
  mailchimp: BookOpenText,
  microsoft: Grid,
  netflix: SiNetflix,
  notion: SiNotion,
  openai: SiOpenai,
  anthropic: Brain,
  oracle: Database,
  quickbooks: Calculator,
  rippling: Users,
  salesforce: Blocks,
  shopify: SiShopify,
  slack: SiSlack,
  snowflake: Snowflake,
  spotify: SiSpotify,
  tableau: BarChart3,
  vercel: SiVercel,
  youtube: SiYoutube,
  zendesk: LifeBuoy,
  zoom: SiZoom,
  crowdstrike: Shield,
  bloomberg: DollarSign,
  carta: CreditCard,
  greenhouse: Users,
  gusto: DollarSign,
  ironclad: Shield,
  docusign: BookOpenText,
  sendgrid: Mail,
  looker: FcGoogle,
};

const BRAND_COLORS = {
  slack: "#4A154B",
  zoom: "#2D8CFF",
  figma: "#F24E1E",
  vercel: "#000000",
  hubspot: "#FF7A59",
  google: "#4285F4",
  notion: "#000000",
  github: "#181717",
  canva: "#00C4CC",
  adobe: "#FF0000",
  netflix: "#E50914",
  spotify: "#1DB954",
  dropbox: "#0061FF",
  shopify: "#7AB55C",
  jira: "#0052CC",
  aws: "#FF9900",
  youtube: "#FF0000",
  openai: "#412991",
  intercom: "#0057FF",
  salesforce: "#00A1E0",
  asana: "#F06595",
  datadog: "#632CA6",
  monday: "#FF3D57",
  trello: "#0079BF",
  miro: "#FFD02F",
  microsoft: "#00A4EF",
  linkedin: "#0A66C2",
  twitter: "#1DA1F2",
  facebook: "#1877F2",
  instagram: "#E4405F",
  tiktok: "#000000",
  apple: "#000000",
  amazon: "#FF9900",
};

export function VendorMark({ logoKey, category = "default", domain }) {
  const [imgError, setImgError] = useState(false);
  const [useSecondary, setUseSecondary] = useState(false);

  const normalizedKey = String(logoKey || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const Icon =
    ICON_MAP[logoKey] ||
    ICON_MAP[normalizedKey] ||
    (category === "finance" ? CreditCard : category === "marketing" ? MonitorPlay : Blocks);

  const brandColor = BRAND_COLORS[logoKey] || BRAND_COLORS[normalizedKey];

  let activeDomain = domain;
  if (activeDomain && activeDomain.includes("://")) {
    try {
      activeDomain = new URL(activeDomain).hostname;
    } catch (e) {
      activeDomain = domain;
    }
  }

  // Final fallback to Google Favicons if Clearbit fails
  const imgSrc = useSecondary
    ? `https://www.google.com/s2/favicons?domain=${activeDomain}&sz=128`
    : `https://logo.clearbit.com/${activeDomain}`;

  return (
    <span
      className={`sg-vendor-mark ${activeDomain && !imgError ? "has-image" : ""}`}
      style={!activeDomain || imgError ? { color: brandColor || "inherit" } : {}}
      aria-hidden="true"
    >
      {activeDomain && !imgError ? (
        <img
          src={imgSrc}
          alt=""
          onError={() => {
            if (!useSecondary) {
              setUseSecondary(true);
            } else {
              setImgError(true);
            }
          }}
          style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "inherit" }}
        />
      ) : (
        <Icon />
      )}
    </span>
  );
}
