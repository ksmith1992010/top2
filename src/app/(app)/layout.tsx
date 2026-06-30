import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          borderBottom: "1px solid #ddd",
        }}
      >
        <div>
          <strong>T.O.P. CRM v2</strong>
          <span style={{ marginLeft: "1rem", color: "#555" }}>{session.user.email}</span>
        </div>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
