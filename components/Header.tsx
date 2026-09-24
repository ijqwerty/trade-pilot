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
                <Link href="/">
                    <Image src="/assets/icons/logo.svg" alt="TradePilot logo" width={160} height={32} className="h-8 w-auto cursor-pointer" />
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} />
                </nav>

                <div className="flex items-center gap-1 sm:gap-2">
                    <NotificationBell initialUnreadCount={unreadCount} />
                    <UserDropdown user={user} initialStocks={initialStocks} />
                </div>
            </div>
        </header>
    )
}
export default Header
