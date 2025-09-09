import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      customId: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "user" | "admin";
    customId: string;
    email: string;
    name?: string;
    image?: string;
    emailVerified?: Date;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "user" | "admin";
    customId?: string;
  }
}


