export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SessionCheck handles auth redirects globally
  return <>{children}</>;
}
