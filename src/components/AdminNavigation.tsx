"use client";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function AdminNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Vérifier si l'utilisateur est admin
  if (!session?.user || session.user.role !== "admin") {
    return null;
  }

  const navItems = [
    { href: "/admin/quizzes", label: "Quiz", icon: "📚" },
    { href: "/admin/vocabulary", label: "Vocabulaire", icon: "📝" },
    { href: "/admin/users", label: "Utilisateurs", icon: "👥" },
    { href: "/admin/stats", label: "Statistiques", icon: "📊" },
    { href: "/admin/themes", label: "Thèmes", icon: "🎨" },
    { href: "/admin/badges", label: "Badges", icon: "🏆" },
  ];

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="flex space-x-8">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
