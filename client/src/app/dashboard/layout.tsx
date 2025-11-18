export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto w-full max-w-5xl p-4 md:p-6">{children}</div>;
}
