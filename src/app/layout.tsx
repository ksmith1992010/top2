export const metadata = {
  title: "T.O.P. CRM v2",
  description: "Over The Top Restoration CRM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
