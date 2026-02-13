import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';

interface MatchHistory {
  id: string;
  name: string;
  date: string;
  location: string;
  result: string;
  yourTeam: string;
  opponentTeam: string;
  goals: number;
  assists: number;
  rating: number;
  status: 'WON' | 'LOST' | 'DRAW';
}

export default function HistoryScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchHistory[]>([
    {
      id: '1',
      name: 'Pelada do Domingo',
      date: '12 de Fevereiro',
      location: 'Campo do Parque',
      result: '5 x 3',
      yourTeam: 'Time A',
      opponentTeam: 'Time B',
      goals: 2,
      assists: 1,
      rating: 4.8,
      status: 'WON',
    },
    {
      id: '2',
      name: 'Campeonato Amigos',
      date: '5 de Fevereiro',
      location: 'Campo da Escola',
      result: '2 x 2',
      yourTeam: 'Time C',
      opponentTeam: 'Time D',
      goals: 1,
      assists: 0,
      rating: 4.2,
      status: 'DRAW',
    },
    {
      id: '3',
      name: 'Pelada Clássica',
      date: '29 de Janeiro',
      location: 'Quadra Coberta',
      result: '1 x 4',
      yourTeam: 'Time E',
      opponentTeam: 'Time F',
      goals: 0,
      assists: 1,
      rating: 3.5,
      status: 'LOST',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON':
        return '#10B981';
      case 'LOST':
        return '#EF4444';
      case 'DRAW':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'WON':
        return 'Vitória';
      case 'LOST':
        return 'Derrota';
      case 'DRAW':
        return 'Empate';
      default:
        return 'Finalizada';
    }
  };

  const renderMatch = ({ item }: { item: MatchHistory }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => router.push(`/match/${item.id}`)}
    >
      {/* Header */}
      <View style={styles.matchHeader}>
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{item.name}</Text>
          <Text style={styles.matchDate}>{item.date}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusBadgeText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      {/* Result */}
      <View style={styles.resultContainer}>
        <View style={styles.teamResult}>
          <Text style={styles.teamName}>{item.yourTeam}</Text>
          <Text style={styles.score}>{item.result.split(' ')[0]}</Text>
        </View>
        <View style={styles.resultDivider}>
          <Text style={styles.resultText}>vs</Text>
        </View>
        <View style={styles.teamResult}>
          <Text style={styles.teamName}>{item.opponentTeam}</Text>
          <Text style={styles.score}>{item.result.split(' ')[2]}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Gols</Text>
          <Text style={styles.statValue}>{item.goals}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Assistências</Text>
          <Text style={styles.statValue}>{item.assists}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avaliação</Text>
          <Text style={styles.statValue}>⭐ {item.rating}</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.matchFooter}>
        <Text style={styles.locationText}>📍 {item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Histórico de Partidas</Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Partidas</Text>
          <Text style={styles.summaryValue}>{matches.length}</Text>
        </View>
        <View style={styles.summarySeparator} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Vitórias</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>
            {matches.filter((m) => m.status === 'WON').length}
          </Text>
        </View>
        <View style={styles.summarySeparator} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Gols</Text>
          <Text style={styles.summaryValue}>
            {matches.reduce((sum, m) => sum + m.goals, 0)}
          </Text>
        </View>
      </View>

      {/* Matches List */}
      <View style={styles.matchesContainer}>
        {matches.length > 0 ? (
          <FlatList
            data={matches}
            renderItem={renderMatch}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.matchesList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>⚽</Text>
            <Text style={styles.emptyStateTitle}>Nenhuma partida ainda</Text>
            <Text style={styles.emptyStateText}>
              Suas partidas aparecerão aqui
            </Text>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 40,
  },
  backButton: {
    fontSize: 16,
    color: '#F97316',
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F97316',
  },
  summarySeparator: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  matchesContainer: {
    paddingHorizontal: 20,
  },
  matchesList: {
    gap: 12,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  matchDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  teamResult: {
    alignItems: 'center',
  },
  teamName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  score: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  resultDivider: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  matchFooter: {
    paddingTop: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});
