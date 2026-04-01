import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { verifyPassword } from './passwords';

type LegacyUserRow = {
  id: number;
  username: string;
  password: string;
  role: string | null;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const username = credentials.username.trim();

        const user = await prisma.usuario.findUnique({
          where: { username },
        });

        if (user) {
          const isValid = await verifyPassword(credentials.password, user.password);
          if (!isValid) return null;

          return {
            id: user.id.toString(),
            name: user.nombre || user.username,
            role: 'user',
          };
        }

        const legacyUsers = await prisma.$queryRawUnsafe<LegacyUserRow[]>(
          'select id, username, password, role from usuarios where lower(username) = lower($1) limit 1',
          username,
        );
        const legacyUser = legacyUsers[0];

        if (!legacyUser) return null;

        const isLegacyValid = await verifyPassword(credentials.password, legacyUser.password);
        if (!isLegacyValid) return null;

        return {
          id: `legacy-${legacyUser.id}`,
          name: legacyUser.username,
          role: legacyUser.role || 'user',
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
