import Header from "@/components/Header";
import {auth} from "@/lib/better-auth/auth";
import { touchLastSignedInAt } from "@/lib/profile/last-signed-in";
import { buildSignInRedirect, getRequestedPathFromHeaders } from "@/lib/auth/safe-next";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const headerList = await headers();
    const session = await auth.api.getSession({ headers: headerList });

    if(!session?.user) {
        redirect(buildSignInRedirect(getRequestedPathFromHeaders(headerList)));
    }

    try {
        await touchLastSignedInAt(session.user.id);
    } catch (err) {
        console.error('layout lastSignedInAt update failed', err);
    }

    const user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
    }

    return (
        <main className="briefing-shell min-h-screen">
            <Header user={user} />

            <div className="container briefing-main">
                {children}
            </div>
        </main>
    )
}
export default Layout
