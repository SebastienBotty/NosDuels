import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const discordClientId = process.env.DISCORD_CLIENT_ID;
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;

if (!discordClientId || !discordClientSecret) {
  throw new Error(
    "Variables manquantes: DISCORD_CLIENT_ID et/ou DISCORD_CLIENT_SECRET.",
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: discordClientId,
      clientSecret: discordClientSecret,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "discord") {
        return false;
      }

      const pseudo = (await cookies()).get("validated_pseudo")?.value;
      if (!pseudo) {
        return false;
      }

      const user = await prisma.user.findUnique({
        where: { username: pseudo },
        select: { id: true },
      });

      if (!user) {
        return false;
      }

      const discordId = account.providerAccountId;
      const discordProfile = profile as Record<string, unknown> | undefined;
      const discordUsername =
        typeof discordProfile?.global_name === "string"
          ? discordProfile.global_name
          : typeof discordProfile?.username === "string"
            ? discordProfile.username
            : null;

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            discordId,
            discordUsername,
          },
        });
      } catch (error) {
        console.error("Erreur lors du lien Discord -> User:", error);
        return false;
      }

      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        const pseudo = (await cookies()).get("validated_pseudo")?.value;
        if (pseudo) {
          token.validatedPseudo = pseudo;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.validatedPseudo) {
        session.user.username = token.validatedPseudo;
      }

      return session;
    },
  },
};
