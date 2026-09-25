import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import NotificationBell from "@/components/NotificationBell";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import {getMyUnreadCount} from "@/lib/actions/notification.actions";

const Header = async ({ user }: { user: User }) => {
    const [initialStocks, unreadCount] = await Promise.all([
        searchStocks(),
        getMyUnreadCount(),
    ]);

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/" className="header-logo">
                    <Image src="/assets/icons/logo.svg" alt="TradePilot logo" width={160} height={32} className="h-8 w-auto cursor-pointer" />
                </Link>
                <nav className="hidden sm:flex justify-center" aria-label="Primary">
                    <NavItems initialStocks={initialStocks} />
                </nav>

                <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
                    <NotificationBell initialUnreadCount={unreadCount} />
                    <UserDropdown user={user} />
                </div>
            </div>
            <nav
                className="header-mobile-nav sm:hidden"
                aria-label="Primary"
            >
                <div className="container">
                    <NavItems initialStocks={initialStocks} />
                </div>
            </nav>
        </header>
    )
}
export default Header
