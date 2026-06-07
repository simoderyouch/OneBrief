export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 to-neutral-900 flex items-center justify-center px-4">
      {children}
    </div>
  );
}
