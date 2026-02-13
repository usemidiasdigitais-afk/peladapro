import { db } from '@/server/db';
import { users, groups, sessions } from '@/drizzle/schema-auth';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '24h';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PLAYER';
  groupId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PLAYER';
  groupId?: string;
}

export class AuthService {
  /**
   * Fazer login com email e senha
   */
  async login(request: LoginRequest): Promise<{
    user: AuthUser;
    token: string;
  }> {
    // Buscar usuário
    const user = await db.query.users.findFirst({
      where: eq(users.email, request.email),
      with: {
        group: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validar senha
    const isPasswordValid = await bcrypt.compare(request.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        groupId: user.groupId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Salvar sessão
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Registrar auditoria
    await this.logAudit({
      userId: user.id,
      groupId: user.groupId,
      action: 'LOGIN',
      resource: 'auth',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'SUPER_ADMIN' | 'ADMIN' | 'PLAYER',
        groupId: user.groupId || undefined,
      },
      token,
    };
  }

  /**
   * Criar novo usuário
   */
  async signup(request: SignupRequest): Promise<{
    user: AuthUser;
    token: string;
  }> {
    // Validar se email já existe
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, request.email),
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(request.password, 10);

    // Se é ADMIN, criar novo grupo
    let groupId = request.groupId;
    if (request.role === 'ADMIN' && !groupId) {
      const newGroup = await db.insert(groups).values({
        name: `${request.name}'s Group`,
      }).returning();
      groupId = newGroup[0].id;
    }

    // Criar usuário
    const newUser = await db.insert(users).values({
      email: request.email,
      passwordHash,
      name: request.name,
      role: request.role,
      groupId,
    }).returning();

    // Se é ADMIN, atualizar grupo com seu ID
    if (request.role === 'ADMIN' && groupId) {
      await db.update(groups)
        .set({ adminId: newUser[0].id })
        .where(eq(groups.id, groupId));
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: newUser[0].id,
        email: newUser[0].email,
        role: newUser[0].role,
        groupId: newUser[0].groupId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Salvar sessão
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      userId: newUser[0].id,
      token,
      expiresAt,
    });

    // Registrar auditoria
    await this.logAudit({
      userId: newUser[0].id,
      groupId: newUser[0].groupId,
      action: 'SIGNUP',
      resource: 'auth',
    });

    return {
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        name: newUser[0].name,
        role: newUser[0].role as 'SUPER_ADMIN' | 'ADMIN' | 'PLAYER',
        groupId: newUser[0].groupId || undefined,
      },
      token,
    };
  }

  /**
   * Validar token JWT
   */
  async validateToken(token: string): Promise<AuthUser | null> {
    try {
      // Verificar JWT
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
        groupId?: string;
      };

      // Verificar se sessão ainda existe
      const session = await db.query.sessions.findFirst({
        where: and(
          eq(sessions.userId, decoded.userId),
          eq(sessions.token, token)
        ),
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      // Buscar usuário
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'SUPER_ADMIN' | 'ADMIN' | 'PLAYER',
        groupId: user.groupId || undefined,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Fazer logout
   */
  async logout(userId: string, token: string): Promise<void> {
    // Deletar sessão
    await db.delete(sessions)
      .where(and(
        eq(sessions.userId, userId),
        eq(sessions.token, token)
      ));

    // Registrar auditoria
    await this.logAudit({
      userId,
      action: 'LOGOUT',
      resource: 'auth',
    });
  }

  /**
   * Registrar ação em auditoria
   */
  private async logAudit(data: {
    userId?: string;
    groupId?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    details?: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      const { auditLogs } = await import('@/drizzle/schema-auth');
      await db.insert(auditLogs).values({
        userId: data.userId,
        groupId: data.groupId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details,
        ipAddress: data.ipAddress,
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }

  /**
   * Obter usuário por ID
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'SUPER_ADMIN' | 'ADMIN' | 'PLAYER',
      groupId: user.groupId || undefined,
    };
  }

  /**
   * Obter grupo do usuário
   */
  async getUserGroup(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        group: true,
      },
    });

    return user?.group || null;
  }

  /**
   * Listar usuários de um grupo
   */
  async getGroupUsers(groupId: string) {
    return await db.query.users.findMany({
      where: eq(users.groupId, groupId),
    });
  }

  /**
   * Listar todos os grupos (apenas para SUPER_ADMIN)
   */
  async getAllGroups() {
    return await db.query.groups.findMany({
      with: {
        users: true,
      },
    });
  }
}

export function getAuthService(): AuthService {
  return new AuthService();
}
