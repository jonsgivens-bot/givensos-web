import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GivensOS",
  description: "Givens Family Operating System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "GivensOS",
    statusBarStyle: "black-translucent",
  },
  themeColor: "#FDFBF7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen" style={{ backgroundColor: '#FDFBF7', color: '#2C3333' }}>
        {children}
      </body>
    </html>
  );
}
