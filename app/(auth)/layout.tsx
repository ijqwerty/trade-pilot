import Link from "next/link";
import Image from "next/image";
import {auth} from "@/lib/better-auth/auth";
import { getSafeNextFromAuthHeaders } from "@/lib/auth/safe-next";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const headerList = await headers();
    const session = await auth.api.getSession({ headers: headerList })

    if(session?.user) redirect(getSafeNextFromAuthHeaders(headerList))

    return (
        <main className="auth-layout">
            <section className="auth-left-section scrollbar-hide-default">
                <Link href="/" className="auth-logo">
                    <Image src="/assets/icons/logo.svg" alt="TradePilot logo" width={200} height={40} className="h-9 w-auto" />
                </Link>

                <div className="pb-6 lg:pb-8 flex-1">{children}</div>
            </section>

            <section className="auth-right-section">
                <div className="z-10 relative lg:mt-8 lg:mb-12 max-w-md">
                    <p className="auth-aside-kicker">TradePilot</p>
                    <h2 className="auth-aside-title">Your morning market briefing</h2>
                    <p className="auth-aside-body">
                        Watch the stocks you follow, set useful price alerts, and keep market context
                        one glance away — without a trading terminal.
                    </p>
                </div>
            </section>
        </main>
    )
}
export default Layout
