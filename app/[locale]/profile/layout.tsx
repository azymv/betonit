"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n-config";
import { Home, User, Settings, BarChart3, Share2, Coins } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/types/supabase";

export default function ProfileLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { t } = useTranslation(params.locale);
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const supabase = createClientComponentClient<Database>();
  
  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!user || isLoading) return;
      
      setIsBalanceLoading(true);
      try {
        const { data, error } = await supabase
          .from('balances')
          .select('amount')
          .eq('user_id', user.id)
          .eq('currency', 'coins')
          .single();
        
        if (error) {
          console.error('Error fetching balance:', error);
          setBalance(null);
        } else {
          setBalance(data?.amount || 0);
        }
      } catch (err) {
        console.error('Exception fetching balance:', err);
        setBalance(null);
      } finally {
        setIsBalanceLoading(false);
      }
    };

    fetchUserBalance();
  }, [user, isLoading, supabase]);

  // Format number with locale-specific separators
  const formatNumber = (num: number | null) => {
    if (num === null) return "0";
    return new Intl.NumberFormat(params.locale === 'en' ? 'en-US' : 'ru-RU').format(num);
  };

  // Navigation items
  const navItems = [
    {
      name: t("profile.dashboard") || "My Dashboard",
      url: `/${params.locale}/profile`,
      icon: BarChart3,
      section: "dashboard"
    },
    {
      name: t("profile.social") || "Social",
      url: `/${params.locale}/profile/social`,
      icon: Share2,
      section: "social"
    },
    {
      name: t("profile.settings") || "Settings",
      url: `/${params.locale}/profile/settings`,
      icon: Settings,
      section: "settings"
    }
  ];

  // Check which section is active
  const getActiveSection = (path: string) => {
    if (path.includes("/social")) return "social";
    if (path.includes("/settings")) return "settings";
    return "dashboard"; // Default
  };

  const activeSection = getActiveSection(pathname);

  // If not authenticated, show a loading state or redirect
  if (isLoading) {
    return <div className="flex-grow flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    // In a real application, you might want to redirect to login
    // For now, let's just show a message
    return (
      <div className="flex-grow flex items-center justify-center">
        You need to be logged in to view this page.
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-400" />
            <h2 className="font-medium truncate">
              {user.user_metadata?.username || user.email?.split('@')[0] || "User"}
            </h2>
          </div>
          <div className="mt-2 flex items-center space-x-2 text-gray-300">
            <Coins className="h-4 w-4 text-yellow-400" />
            <span>
              {isBalanceLoading ? 
                <span className="inline-block w-16 h-4 bg-gray-700 animate-pulse rounded"></span> : 
                formatNumber(balance)
              }
            </span>
          </div>
        </div>
        <nav className="flex-grow p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = activeSection === item.section;
              return (
                <li key={item.url}>
                  <Link 
                    href={item.url}
                    className={`flex items-center space-x-3 p-2 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-gray-800 text-white' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
            <li className="pt-4 mt-4 border-t border-gray-800">
              <Link 
                href={`/${params.locale}`}
                className="flex items-center space-x-3 p-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Home className="h-5 w-5" />
                <span>{t("nav.home") || "Home"}</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-grow flex flex-col">
        <main className="flex-grow p-4 md:p-6 pb-16 md:pb-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white border-t border-gray-800">
          <ul className="flex justify-around">
            {navItems.map((item) => {
              const isActive = activeSection === item.section;
              return (
                <li key={item.url} className="flex-1">
                  <Link 
                    href={item.url}
                    className={`flex flex-col items-center py-3 ${
                      isActive 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs mt-1">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
} 