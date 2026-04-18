import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/demo", label: "Demo" },
  { href: "/data", label: "Data" },
  { href: "/predictions", label: "Predictions" },
  { href: "/settings", label: "Settings" },
];

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border-soft pb-4">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition",
            pathname === l.href
              ? "bg-primary-muted text-primary"
              : "text-neutral-600 hover:bg-white hover:text-primary"
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
