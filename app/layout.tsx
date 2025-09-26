import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import AutoLoginWrapper from "@/components/auto-login-wrapper";
import AutoPushPermission from "@/components/auto-push-permission";
import BugReportWrapper from "@/components/bug-report-wrapper";
import DeploymentVersionCheck from "@/components/deployment-version-check";
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
    icon: "/favicon.ico",
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
      </head>
      <body
        className={`${inter.variable} font-sans antialiased h-full overflow-x-hidden`}
        style={{background: 'linear-gradient(135deg, #fefff8 0%, #f0fdf4 100%)'}}
      >
        <AuthProvider
          autoValidate={true}
          autoRefresh={true}
          refreshInterval={10 * 60 * 1000} // 10 minutes
        >
          <ThemeProvider defaultTheme="system" storageKey="tms-passenger-theme">
            <AutoLoginWrapper>
              <div id="root" className="h-full overflow-x-hidden">
                {children}
                {/* Auto push permission prompt */}
                <AutoPushPermission delay={5000} oncePerSession={true} />
                {/* Floating bug report button */}
                <BugReportWrapper />
                {/* Deployment version check (Ctrl+Shift+V) */}
                <DeploymentVersionCheck />
              </div>
            </AutoLoginWrapper>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                  color: '#fff',
                  maxWidth: '90vw',
                  wordBreak: 'break-word',
                  zIndex: 9999,
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(8px)',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e', // Brand green
                    secondary: '#fff',
                  },
                  style: {
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    border: '1px solid #22c55e',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                  style: {
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    border: '1px solid #ef4444',
                  },
                },
                loading: {
                  iconTheme: {
                    primary: '#eab308', // Brand yellow
                    secondary: '#fff',
                  },
                  style: {
                    background: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)',
                    border: '1px solid #eab308',
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
