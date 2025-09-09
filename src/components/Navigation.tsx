"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function Navigation() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-white border-b border-black/[.08]">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="inline-flex items-center">
            <span className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-blue-500 text-white text-sm font-semibold select-none">
              Certif
            </span>
          </Link>
          <div className="flex gap-6 text-sm text-black">
            <Link href="/" className="hover:underline">Bienvenue</Link>
            <Link href="/reviser" className="hover:underline">Réviser</Link>
            <Link href="/badges" className="hover:underline">Badges</Link>
            <Link href="/classement" className="hover:underline">Classement</Link>
            <Link href="/classement-divisions" className="hover:underline">🏆 Divisions</Link>
            <Link href="/lexique" className="hover:underline">Lexique</Link>
            <Link href="/tarifs" className="hover:underline">Tarifs</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-black">
          <Link href="/aide" aria-label="Aide" className="hover:opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25a3 3 0 0 1 2.904 2.25c.27 1.08-.36 1.86-1.26 2.46-.72.48-1.144.84-1.144 1.79m.5 3h-.5" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </Link>
          
          <Link href="/notifications" aria-label="Notifications" className="hover:opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 18.75a2.25 2.25 0 0 1-4.5 0M4.5 9.75a7.5 7.5 0 0 1 15 0c0 3.429 1.125 5.25 1.5 5.25H3c.375 0 1.5-1.821 1.5-5.25z" />
            </svg>
          </Link>
          
          {status === "loading" ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          ) : session ? (
            <div className="flex items-center gap-4">
                             {/* Affichage du customId */}
               <span className="text-sm font-medium text-gray-700">
                 {session.user?.customId || session.user?.email}
               </span>
              
              {/* Menu déroulant du profil */}
              <div className="relative group">
                                 <button className="flex items-center gap-2 hover:opacity-70">
                   {session.user?.image ? (
                     <Image 
                       src={session.user.image} 
                       alt="Profil" 
                       width={32}
                       height={32}
                       className="w-8 h-8 rounded-full border border-gray-200"
                     />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                       {(session.user?.customId || session.user?.email || '?').charAt(0).toUpperCase()}
                     </div>
                   )}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Menu déroulant */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Mon Profil
                    </Link>
                    <Link 
                      href="/mes-statistiques" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Mes Statistiques
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link 
                href="/connexion" 
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Se connecter
              </Link>
              <Link 
                href="/register" 
                className="inline-flex items-center px-4 py-2 rounded-md bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                S&apos;inscrire
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
