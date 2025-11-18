export default function CandidatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-8 py-6">{children}</div>
  );
}
