// src/app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full bg-[#F5F7FB]">
      <div
        className="
          mx-auto flex w-full max-w-7xl
          min-h-[calc(100vh-66px)]
          p-4 md:p-6
        "
      >
        {children}
      </div>
    </div>
  );
}
