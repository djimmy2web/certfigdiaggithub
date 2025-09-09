import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { generateUniqueCustomId, generateProfileImage } from "@/lib/user-utils";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email et mot de passe",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: String(user._id),
          email: user.email,
          name: user.name ?? undefined,
          customId: user.customId,
          image: user.image,
          role: user.role,
        } as {
          id: string;
          email: string;
          name?: string;
          customId: string;
          image?: string;
          role: "user" | "admin";
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if ('role' in user) token.role = user.role;
        if ('customId' in user) token.customId = user.customId;
        if ('image' in user) token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        if ('role' in session.user) session.user.role = token.role as "user" | "admin";
        if ('customId' in session.user) session.user.customId = token.customId as string;
        if ('image' in session.user) session.user.image = token.image as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Si c'est une connexion OAuth, on s'assure que l'utilisateur existe en base
      if (account?.provider !== "credentials") {
        await connectToDatabase();
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Créer un nouvel utilisateur pour les connexions OAuth
          const existingCustomIds = await User.distinct('customId').catch(() => []);
          const customId = await generateUniqueCustomId(existingCustomIds);
          const profileImage = user.image || generateProfileImage(customId);
          
          const newUser = await User.create({
            email: user.email,
            name: user.name,
            customId,
            image: profileImage,
            emailVerified: new Date(),
            role: "user",
          });
          user.id = String(newUser._id);
          if ('customId' in user) (user as { customId: string }).customId = customId;
          user.image = profileImage;
        } else {
          // Utilisateur existant, mettre à jour les informations si nécessaire
          if (!existingUser.customId) {
            const existingCustomIds = await User.distinct('customId').catch(() => []);
            const customId = await generateUniqueCustomId(existingCustomIds);
            const profileImage = existingUser.image || generateProfileImage(customId);
            await User.findByIdAndUpdate(existingUser._id, { 
              customId, 
              image: profileImage 
            });
            if ('customId' in user) (user as { customId: string }).customId = customId;
            user.image = profileImage;
          } else {
            if ('customId' in user) (user as { customId: string }).customId = existingUser.customId;
            user.image = existingUser.image;
          }
          
          if (!existingUser.image && user.image) {
            await User.findByIdAndUpdate(existingUser._id, { image: user.image });
          }
          if (!existingUser.name && user.name) {
            await User.findByIdAndUpdate(existingUser._id, { name: user.name });
          }
          user.id = String(existingUser._id);
          if ('role' in user) user.role = existingUser.role;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/connexion",
  },
};


