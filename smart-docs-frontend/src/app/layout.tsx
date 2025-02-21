import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { ScrollToTop } from "@/components/scroll-top";
// import Loading from "./loading";

const poppins = Poppins({
  weight: "400",
  style: "normal",
  subsets: ["latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        {/* <Suspense fallback={<Loading/>}> */}
        {children}
        <Toaster />
        <ScrollToTop />
      </body>
    </html>
  );
}
