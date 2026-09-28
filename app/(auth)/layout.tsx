import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/better-auth/auth";
import { getSafeNextFromAuthHeaders } from "@/lib/auth/safe-next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AuthCover from "@/components/auth/AuthCover";

const formatCoverDate = (date: Date) =>
  date
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const headerList = await headers();
  const session = await auth.api.getSession({ headers: headerList });

  if (session?.user) redirect(getSafeNextFromAuthHeaders(headerList));

  const dateLine = formatCoverDate(new Date());

  return (
    <main className="auth-layout">
      <section className="auth-form-section scrollbar-hide-default">
        <div className="auth-form-rail">
          <AuthCover variant="compact" dateLine={dateLine} />

          <div className="auth-sheet">
            <Link href="/" className="auth-logo" aria-label="TradePilot home">
              <Image
                src="/assets/icons/logo.svg"
                alt="TradePilot"
                width={200}
                height={40}
                className="h-9 w-auto"
                priority
              />
            </Link>

            <div className="auth-form-body">{children}</div>
          </div>
        </div>
      </section>

      <aside
        className="auth-cover-section"
        aria-label="TradePilot product preview"
      >
        <AuthCover variant="panel" dateLine={dateLine} />
      </aside>
    </main>
  );
};

export default Layout;
