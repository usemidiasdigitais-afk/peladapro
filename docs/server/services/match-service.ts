import { db } from '@/server/db';
import { matches, attendance, inviteLinks } from '@/drizzle/schema-matches';
import { users } from '@/drizzle/schema-auth';
import { eq, and, gt, lte } from 'drizzle-orm';
import * as crypto from 'crypto';

export interface CreateMatchRequest {
  groupId: string;
  createdBy: string;
  title: string;
  description?: string;
  location: string;
  latitude?: string;
  longitude?: string;
  scheduledDate: Date;
  maxPlayers: number;
  maxGoalkeepers?: number;
  pricePerPlayer?: number;
  barbecuePrice?: number;
  paymentRequired?: boolean;
}

export interface UpdateMatchRequest {
  title?: string;
  description?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  scheduledDate?: Date;
  maxPlayers?: number;
  maxGoalkeepers?: number;
  pricePerPlayer?: number;
  barbecuePrice?: number;
  paymentRequired?: boolean;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
}

export class MatchService {
  /**
   * Criar nova pelada
   */
  async createMatch(request: CreateMatchRequest) {
    // Validar que o usuário pertence ao grupo
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, request.createdBy),
        eq(users.groupId, request.groupId)
      ),
    });

    if (!user) {
      throw new Error('User does not belong to this group');
    }

    // Calcular preço total
    const totalPrice = (request.pricePerPlayer || 0) + (request.barbecuePrice || 0);

    // Criar partida
    const newMatch = await db.insert(matches).values({
      groupId: request.groupId,
      createdBy: request.createdBy,
      title: request.title,
      description: request.description,
      location: request.location,
      latitude: request.latitude,
      longitude: request.longitude,
      scheduledDate: request.scheduledDate,
      maxPlayers: request.maxPlayers,
      maxGoalkeepers: request.maxGoalkeepers || 2,
      pricePerPlayer: request.pricePerPlayer || 0,
      barbecuePrice: request.barbecuePrice || 0,
      totalPrice: totalPrice,
      paymentRequired: request.paymentRequired || false,
    }).returning();

    // Gerar link de convite
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    await db.insert(inviteLinks).values({
      matchId: newMatch[0].id,
      token: inviteToken,
      expiresAt,
    });

    return {
      ...newMatch[0],
      inviteToken,
    };
  }

  /**
   * Obter pelada por ID (com validação de group_id)
   */
  async getMatch(matchId: string, groupId: string) {
    const match = await db.query.matches.findFirst({
      where: and(
        eq(matches.id, matchId),
        eq(matches.groupId, groupId)
      ),
      with: {
        creator: true,
        attendance: {
          with: {
            player: true,
          },
        },
      },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    return match;
  }

  /**
   * Listar peladas do grupo
   */
  async listGroupMatches(groupId: string, status?: string) {
    let query = db.query.matches.findMany({
      where: eq(matches.groupId, groupId),
      with: {
        creator: true,
        attendance: true,
      },
      orderBy: (matches, { desc }) => [desc(matches.scheduledDate)],
    });

    if (status) {
      query = db.query.matches.findMany({
        where: and(
          eq(matches.groupId, groupId),
          eq(matches.status, status as any)
        ),
        with: {
          creator: true,
          attendance: true,
        },
        orderBy: (matches, { desc }) => [desc(matches.scheduledDate)],
      });
    }

    return query;
  }

  /**
   * Atualizar pelada
   */
  async updateMatch(matchId: string, groupId: string, request: UpdateMatchRequest) {
    // Validar que a pelada pertence ao grupo
    const match = await db.query.matches.findFirst({
      where: and(
        eq(matches.id, matchId),
        eq(matches.groupId, groupId)
      ),
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Calcular novo preço total se necessário
    let totalPrice = match.totalPrice;
    if (request.pricePerPlayer !== undefined || request.barbecuePrice !== undefined) {
      const price = request.pricePerPlayer ?? Number(match.pricePerPlayer);
      const barbecue = request.barbecuePrice ?? Number(match.barbecuePrice);
      totalPrice = price + barbecue;
    }

    // Atualizar
    const updated = await db.update(matches)
      .set({
        ...request,
        totalPrice: totalPrice as any,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, matchId))
      .returning();

    return updated[0];
  }

  /**
   * Cancelar pelada
   */
  async cancelMatch(matchId: string, groupId: string) {
    const match = await db.query.matches.findFirst({
      where: and(
        eq(matches.id, matchId),
        eq(matches.groupId, groupId)
      ),
    });

    if (!match) {
      throw new Error('Match not found');
    }

    return await db.update(matches)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(matches.id, matchId))
      .returning();
  }

  /**
   * Confirmar presença do jogador
   */
  async confirmAttendance(matchId: string, playerId: string, groupId: string, position?: string) {
    // Validar que a pelada pertence ao grupo
    const match = await db.query.matches.findFirst({
      where: and(
        eq(matches.id, matchId),
        eq(matches.groupId, groupId)
      ),
      with: {
        attendance: true,
      },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Validar que o jogador pertence ao grupo
    const player = await db.query.users.findFirst({
      where: and(
        eq(users.id, playerId),
        eq(users.groupId, groupId)
      ),
    });

    if (!player) {
      throw new Error('Player not found in this group');
    }

    // Verificar se já existe presença
    const existingAttendance = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.matchId, matchId),
        eq(attendance.playerId, playerId)
      ),
    });

    if (existingAttendance) {
      // Atualizar
      return await db.update(attendance)
        .set({
          status: 'CONFIRMED',
          position: position || existingAttendance.position,
          confirmedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(attendance.id, existingAttendance.id))
        .returning();
    } else {
      // Criar nova presença
      return await db.insert(attendance).values({
        matchId,
        playerId,
        status: 'CONFIRMED',
        position: position,
        confirmedAt: new Date(),
      }).returning();
    }
  }

  /**
   * Cancelar presença
   */
  async cancelAttendance(matchId: string, playerId: string, groupId: string) {
    // Validar que a pelada pertence ao grupo
    const match = await db.query.matches.findFirst({
      where: and(
        eq(matches.id, matchId),
        eq(matches.groupId, groupId)
      ),
    });

    if (!match) {
      throw new Error('Match not found');
    }

    return await db.update(attendance)
      .set({
        status: 'CANCELLED',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(attendance.matchId, matchId),
        eq(attendance.playerId, playerId)
      ))
      .returning();
  }

  /**
   * Usar link de convite
   */
  async useInviteLink(token: string, playerId: string) {
    // Buscar link
    const invite = await db.query.inviteLinks.findFirst({
      where: eq(inviteLinks.token, token),
      with: {
        match: true,
      },
    });

    if (!invite) {
      throw new Error('Invalid invite link');
    }

    // Validar expiração
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new Error('Invite link expired');
    }

    // Validar limite de usos
    if (invite.maxUses && invite.usedCount >= invite.maxUses) {
      throw new Error('Invite link limit reached');
    }

    // Validar que o jogador pertence ao grupo
    const player = await db.query.users.findFirst({
      where: and(
        eq(users.id, playerId),
        eq(users.groupId, invite.match.groupId)
      ),
    });

    if (!player) {
      throw new Error('Player not found in this group');
    }

    // Confirmar presença
    await this.confirmAttendance(invite.match.id, playerId, invite.match.groupId);

    // Incrementar contador de usos
    await db.update(inviteLinks)
      .set({ usedCount: invite.usedCount + 1 })
      .where(eq(inviteLinks.id, invite.id));

    return invite.match;
  }

  /**
   * Gerar novo link de convite
   */
  async generateInviteLink(matchId: string, groupId: string) {
    // Validar que a pelada pertence ao grupo
    const match = await db.query.matches.findFirst({
      where: and(
        eq(matches.id, matchId),
        eq(matches.groupId, groupId)
      ),
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Deletar links antigos
    const oldLinks = await db.query.inviteLinks.findMany({
      where: eq(inviteLinks.matchId, matchId),
    });

    for (const link of oldLinks) {
      await db.delete(inviteLinks).where(eq(inviteLinks.id, link.id));
    }

    // Gerar novo link
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    const newLink = await db.insert(inviteLinks).values({
      matchId,
      token,
      expiresAt,
    }).returning();

    return newLink[0];
  }

  /**
   * Obter estatísticas da pelada
   */
  async getMatchStats(matchId: string, groupId: string) {
    const match = await this.getMatch(matchId, groupId);

    const confirmed = match.attendance.filter(a => a.status === 'CONFIRMED').length;
    const pending = match.attendance.filter(a => a.status === 'PENDING').length;
    const cancelled = match.attendance.filter(a => a.status === 'CANCELLED').length;

    const confirmedGoalkeepers = match.attendance.filter(
      a => a.status === 'CONFIRMED' && a.position === 'GOALKEEPER'
    ).length;

    const confirmedFieldPlayers = confirmed - confirmedGoalkeepers;

    return {
      totalConfirmed: confirmed,
      totalPending: pending,
      totalCancelled: cancelled,
      confirmedGoalkeepers,
      confirmedFieldPlayers,
      availableSlots: match.maxPlayers - confirmed,
      availableGoalkeeperSlots: match.maxGoalkeepers - confirmedGoalkeepers,
      isFull: confirmed >= match.maxPlayers,
      isGoalkeepersFull: confirmedGoalkeepers >= match.maxGoalkeepers,
    };
  }
}

export function getMatchService(): MatchService {
  return new MatchService();
}
