import AdminLoginGate from "./AdminLogin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLoginGate>{children}</AdminLoginGate>;
}
