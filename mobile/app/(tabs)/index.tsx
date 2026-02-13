import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';

interface Match {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  playersConfirmed: number;
  playersNeeded: number;
  status: 'upcoming' | 'live' | 'finished';
  score?: string;
}

interface PlayerStats {
  matches: number;
  goals: number;
  assists: number;
  rating: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStats>({
    matches: 12,
    goals: 8,
    assists: 5,
    rating: 4.8,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Mock data - será substituído por API
    const mockMatches: Match[] = [
      {
        id: '1',
        title: 'Pelada do Domingo',
        date: '12 de Fevereiro',
        time: '14:00',
        location: 'Campo da Vila',
        playersConfirmed: 8,
        playersNeeded: 12,
        status: 'upcoming',
      },
      {
        id: '2',
        title: 'Campeonato Amigos',
        date: '11 de Fevereiro',
        time: '20:00',
        location: 'Quadra Central',
        playersConfirmed: 10,
        playersNeeded: 10,
        status: 'live',
      },
      {
        id: '3',
        title: 'Pelada Clássica',
        date: '10 de Fevereiro',
        time: '18:00',
        location: 'Campo da Praia',
        playersConfirmed: 11,
        playersNeeded: 11,
        status: 'finished',
        score: '3 x 2',
      },
    ];
    setMatches(mockMatches);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#3B82F6';
      case 'live':
        return '#EF4444';
      case 'finished':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Próxima';
      case 'live':
        return 'Ao Vivo';
      case 'finished':
        return 'Finalizada';
      default:
        return status;
    }
  };

  const renderMatchCard = ({ item }: { item: Match }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => router.push(`/match/${item.id}`)}
      activeOpacity={0.8}
    >
      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      >
        <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
      </View>

      {/* Match Info */}
      <View style={styles.matchInfo}>
        <Text style={styles.matchTitle}>{item.title}</Text>
        <View style={styles.matchDetails}>
          <Text style={styles.matchDetailText}>📅 {item.date}</Text>
          <Text style={styles.matchDetailText}>🕐 {item.time}</Text>
          <Text style={styles.matchDetailText}>📍 {item.location}</Text>
        </View>
      </View>

      {/* Players Info */}
      <View style={styles.playersInfo}>
        <View style={styles.playerCount}>
          <Text style={styles.playerCountText}>
            {item.playersConfirmed}/{item.playersNeeded}
          </Text>
          <Text style={styles.playerCountLabel}>Jogadores</Text>
        </View>
        {item.score && (
          <View style={styles.scoreBox}>
            <Text style={styles.scoreText}>{item.score}</Text>
          </View>
        )}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          item.status === 'finished' && styles.actionButtonDisabled,
        ]}
        disabled={item.status === 'finished'}
      >
        <Text style={styles.actionButtonText}>
          {item.status === 'finished' ? 'Ver Resultado' : 'Confirmar Presença'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: user?.avatar || 'https://via.placeholder.com/60' }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.greeting}>Olá, {user?.name}! 👋</Text>
              <Text style={styles.userRole}>{user?.role === 'PLAYER' ? 'Jogador' : user?.role}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Suas Estatísticas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.matches}</Text>
            <Text style={styles.statLabel}>Partidas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.goals}</Text>
            <Text style={styles.statLabel}>Gols</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.assists}</Text>
            <Text style={styles.statLabel}>Assistências</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
        </View>
      </View>

      {/* Matches Section */}
      <View style={styles.matchesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas Partidas</Text>
          <TouchableOpacity onPress={() => router.push('/matches')}>
            <Text style={styles.seeAllText}>Ver Tudo</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#F97316" />
        ) : (
          <FlatList
            data={matches}
            renderItem={renderMatchCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.matchesList}
          />
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/create-match')}
        >
          <Text style={styles.quickActionIcon}>⚽</Text>
          <Text style={styles.quickActionText}>Criar Partida</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/payments')}
        >
          <Text style={styles.quickActionIcon}>💰</Text>
          <Text style={styles.quickActionText}>Pagamentos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.quickActionIcon}>👤</Text>
          <Text style={styles.quickActionText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F97316',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  matchesSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '600',
  },
  matchesList: {
    gap: 16,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  matchInfo: {
    marginBottom: 12,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  matchDetails: {
    gap: 4,
  },
  matchDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  playersInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  playerCount: {
    alignItems: 'center',
  },
  playerCountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F97316',
  },
  playerCountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  scoreBox: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
