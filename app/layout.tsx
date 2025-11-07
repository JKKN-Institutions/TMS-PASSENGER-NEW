import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import AutoLoginWrapper from "@/components/auto-login-wrapper";
import AutoPushPermission from "@/components/auto-push-permission";
import BugReportWrapper from "@/components/bug-report-wrapper";
import DeploymentVersionCheck from "@/components/deployment-version-check";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MYJKKN TMS - JKKN College Transport Portal",
  description: "Student transport booking and management portal",
  keywords: ["transport", "student", "booking", "management", "bus"],
  authors: [{ name: "JKKN College" }],
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JKKN TMS",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10b981" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script src="/sw-register.js" defer></script>
      </head>
      <body
        className={`${inter.variable} font-sans antialiased h-full overflow-x-hidden`}
      >
        <AuthProvider
          autoValidate={true}
          autoRefresh={true}
          refreshInterval={10 * 60 * 1000} // 10 minutes
        >
          <ThemeProvider defaultTheme="light" storageKey="tms-passenger-theme">
            <AutoLoginWrapper>
              {/* Bug Reporter SDK - Wraps entire app with centralized bug reporting */}
              <BugReportWrapper>
                <div id="root" className="h-full overflow-x-hidden">
                  {children}
                  {/* PWA Install Prompt */}
                  <PWAInstallPrompt />
                  {/* Auto push permission prompt */}
                  <AutoPushPermission delay={5000} oncePerSession={true} />
                  {/* Deployment version check (Ctrl+Shift+V) */}
                  <DeploymentVersionCheck />
                </div>
              </BugReportWrapper>
            </AutoLoginWrapper>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  maxWidth: '90vw',
                  wordBreak: 'break-word',
                  zIndex: 9999,
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
