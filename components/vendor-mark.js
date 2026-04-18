"use client";

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
  SiYoutube
} from "react-icons/si";
import {
  Blocks,
  BookOpenText,
  Calculator,
  CloudCog,
  CreditCard,
  PenTool,
  Video,
  MonitorPlay
} from "lucide-react";

const ICON_MAP = {
  adobe: PenTool,
  aws: CloudCog,
  canva: SiCanva,
  dropbox: SiDropbox,
  figma: SiFigma,
  github: SiGithub,
  google: SiGoogle,
  hubspot: SiHubspot,
  jira: SiJira,
  mailchimp: BookOpenText,
  netflix: SiNetflix,
  notion: SiNotion,
  quickbooks: Calculator,
  shopify: SiShopify,
  slack: SiSlack,
  spotify: SiSpotify,
  vercel: SiVercel,
  youtube: SiYoutube,
  zoom: Video
};

export function VendorMark({ logoKey, category = "default" }) {
  const Icon =
    ICON_MAP[logoKey] ||
    (category === "finance" ? CreditCard : category === "marketing" ? MonitorPlay : Blocks);

  return (
    <span className="sg-vendor-mark" aria-hidden="true">
      <Icon />
    </span>
  );
}
