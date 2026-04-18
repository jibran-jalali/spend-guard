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
  SiYoutube,
  SiZoom,
  SiOpenai,
  SiSalesforce,
  SiDatadog,
  SiAmazon,
  SiSnowflake,
  SiZendesk,
  SiIntercom,
  SiAsana,
  SiAtlassian
} from "react-icons/si";
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
  Mail
} from "lucide-react";

const ICON_MAP = {
  adobe: PenTool,
  aws: SiAmazon,
  amazon: SiAmazon,
  asana: SiAsana,
  canva: SiCanva,
  datadog: SiDatadog,
  dropbox: SiDropbox,
  figma: SiFigma,
  github: SiGithub,
  google: SiGoogle,
  hubspot: SiHubspot,
  intercom: SiIntercom,
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
  salesforce: SiSalesforce,
  shopify: SiShopify,
  slack: SiSlack,
  snowflake: SiSnowflake,
  spotify: SiSpotify,
  tableau: BarChart3,
  vercel: SiVercel,
  youtube: SiYoutube,
  zendesk: SiZendesk,
  zoom: SiZoom,
  crowdstrike: Shield,
  bloomberg: DollarSign,
  carta: CreditCard,
  greenhouse: Users,
  gusto: DollarSign,
  ironclad: Shield,
  docusign: BookOpenText,
  sendgrid: Mail,
  looker: SiGoogle,
};

export function VendorMark({ logoKey, category = "default" }) {
  const Icon =
    ICON_MAP[logoKey] ||
    ICON_MAP[String(logoKey || "").toLowerCase().replace(/[^a-z0-9]/g, "")] ||
    (category === "finance" ? CreditCard : category === "marketing" ? MonitorPlay : Blocks);

  return (
    <span className="sg-vendor-mark" aria-hidden="true">
      <Icon />
    </span>
  );
}
