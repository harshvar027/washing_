import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { googleProfileExtras } from "./googleProfile";

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: googleId && googleSecret
    ? [
        GoogleProvider({
          clientId: googleId,
          clientSecret: googleSecret,
          authorization: {
            params: {
              scope:
                "openid email profile https://www.googleapis.com/auth/user.phonenumbers.read",
              prompt: "consent",
              access_type: "offline",
            },
          },
        }),
      ]
    : [],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        const extras = await googleProfileExtras(account.access_token);
        token.phone = extras.phone;
        if (profile && "name" in profile && profile.name) {
          token.name = profile.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.phone = typeof token.phone === "string" ? token.phone : "";
      }
      return session;
    },
  },
};
