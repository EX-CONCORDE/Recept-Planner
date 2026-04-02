import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  providers: [
    // Google OAuth（環境変数が設定されている場合のみ有効）
    ...(process.env.AUTH_GOOGLE_ID
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),

    // Credentials（LAN fallback）
    Credentials({
      credentials: {
        email: { label: "メール", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // 招待制: DBに登録済み & isActive のみ許可
    async signIn({ user, account }) {
      // Credentials は authorize() で既にチェック済み
      if (account?.provider === "credentials") return true;

      // OAuth: DBにメールが存在するかチェック
      if (!user.email) return false;
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (!dbUser || !dbUser.isActive) {
        return "/login?error=NotInvited";
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // 初回サインイン時にDBからユーザー情報を載せる
      if (user) {
        if (account?.provider === "credentials") {
          token.userId = Number(user.id);
          token.role = (user as { role?: string }).role ?? "member";
        } else {
          // OAuth: DBから取得
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email! },
          });
          if (dbUser) {
            token.userId = dbUser.id;
            token.role = dbUser.role;
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId);
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
