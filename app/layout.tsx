import type { Metadata } from "next";
import { Bricolage_Grotesque, Fraunces, Newsreader, Outfit } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

// Serif italic used for the landing page's "It's handled." style accents.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

// Public website only (.lp-site): Bricolage Grotesque headlines and Fraunces italic accents.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.fullName} — The AI Business Operating System`,
    template: `%s · ${BRAND.name}`,
  },
  description: `Tell ${BRAND.fullName}. It's handled.`,
};

// Set the theme before paint to avoid a flash of the wrong palette.
const themeScript = `
(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'||t==='blue'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${newsreader.variable} ${bricolage.variable} ${fraunces.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
