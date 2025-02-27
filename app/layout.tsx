import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BetOnIt - Predict and Win",
  description: "Make predictions on events and earn coins",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 