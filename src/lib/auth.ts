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
        console.log('[auth] authorize:start', { username, env: process.env.VERCEL_ENV ?? process.env.NODE_ENV });

        let user = null;
        try {
          user = await prisma.usuario.findUnique({
            where: { username },
          });
          console.log('[auth] usuario:lookup', { found: !!user, username });
        } catch (error) {
          console.error('[auth] usuario:lookup:error', error);
        }

        if (user) {
          const isValid = await verifyPassword(credentials.password, user.password);
          console.log('[auth] usuario:password-check', { username, isValid });
          if (!isValid) return null;

          return {
            id: user.id.toString(),
            name: user.nombre || user.username,
            role: 'user',
          };
        }

        let legacyUsers: LegacyUserRow[] = [];
        try {
          legacyUsers = await prisma.$queryRawUnsafe<LegacyUserRow[]>(
            'select id, username, password, role from usuarios where lower(username) = lower($1) limit 1',
            username,
          );
          console.log('[auth] usuarios:lookup', { found: legacyUsers.length > 0, username });
        } catch (error) {
          console.error('[auth] usuarios:lookup:error', error);
        }
        const legacyUser = legacyUsers[0];

        if (!legacyUser) return null;

        const isLegacyValid = await verifyPassword(credentials.password, legacyUser.password);
        console.log('[auth] usuarios:password-check', {
          username,
          matchedUser: legacyUser.username,
          passwordLength: legacyUser.password?.length ?? 0,
          isLegacyValid,
        });
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
