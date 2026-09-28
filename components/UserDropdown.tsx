'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {LogOut, Settings} from "lucide-react";
import {signOut} from "@/lib/actions/auth.actions";

const UserDropdown = ({ user }: {user: User, initialStocks?: StockWithWatchlistStatus[]}) => {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/sign-in");
    }

    const firstName = user.name?.split(' ')[0] ?? 'there';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="header-user-trigger">
                    <div className="hidden md:flex flex-col items-end mr-1">
                        <span className="text-sm font-medium text-[var(--briefing-ink)]">
                            Good morning, {firstName}
                        </span>
                    </div>
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[var(--briefing-teal)] text-white text-sm font-bold">
                            {user.name?.[0] ?? '?'}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="packet-menu">
                <DropdownMenuLabel>
                    <div className="flex relative items-center gap-3 py-2">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-[var(--briefing-teal)] text-white text-sm font-bold">
                                {user.name?.[0] ?? '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-base font-medium text-[var(--briefing-ink)]">
                                {user.name}
                            </span>
                            <span className="text-sm text-[var(--briefing-slate)]">{user.email}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => router.push('/settings')}
                    className="packet-menu-item"
                >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="packet-menu-item">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default UserDropdown
