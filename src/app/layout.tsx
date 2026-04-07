import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peace Corps | Make the Most of Your World",
  description: "The Peace Corps is a volunteer program run by the United States government. Explore volunteer opportunities, learn about countries, and apply to serve abroad.",
  keywords: "Peace Corps, volunteer, international service, apply, countries, development",
  openGraph: {
    title: "Peace Corps | Make the Most of Your World",
    description: "Volunteer with the Peace Corps and make a lasting difference while gaining skills that last a lifetime.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
