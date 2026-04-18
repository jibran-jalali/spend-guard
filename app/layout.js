import "./globals.css";

export const metadata = {
  title: "SpendGuard",
  description: "Track renewals, spending, duplicate tools, and subscription health across your business.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
