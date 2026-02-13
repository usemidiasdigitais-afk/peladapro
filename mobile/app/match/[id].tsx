import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Player {
  id: string;
  name: string;
  position: string;n  confirmed: boolean;
  paid: boolean;
  avatar: string;
}

export default function MatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [players, setPlayers] = useState<Player[]>([
    {
      id: '1',
      name: 'João Silva',
      position: 'Goleiro',
      confirmed: true,
      paid: true,
      avatar: 'https://via.placeholder.com/40',
    },
    {
      id: '2',
      name: 'Pedro Santos',
      position: 'Zagueiro',
      confirmed: true,
      paid: true,
      avatar: 'https://via.placeholder.com/40',
    },
    {
      id: '3',
      name: 'Carlos Costa',
      position: 'Lateral',
      confirmed: true,
      paid: false,
      avatar: 'https://via.placeholder.com/40',
    },
    {
      id: '4',
      name: 'Lucas Oliveira',
      position: 'Meia',
      confirmed: false,
      paid: false,
      avatar: 'https://via.placeholder.com/40',
    },
  ]);

  const handleConfirmPresence = async () => {
    setIsLoading(true);
    try {
      // TODO: Integrar com backend
      // await confirmMatchPresence(id);
      setIsConfirmed(true);
      Alert.alert('Sucesso', 'Presença confirmada!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao confirmar presença');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      // Redirecionar para tela de pagamento
      router.push({
        pathname: '/payment/[matchId]',
        params: { matchId: id, amount: '50.00' },
      });
    } catch (error) {
      Alert.alert('Erro', 'Falha ao processar pagamento');
    }
  };

  const renderPlayerItem = ({ item }: { item: Player }) => (
    <View style={styles.playerItem}>
      <View style={styles.playerInfo}>
        <View style={styles.playerAvatar}>
          <Text style={styles.playerInitial}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.playerDetails}>
          <Text style={styles.playerName}>{item.name}</Text>
          <Text style={styles.playerPosition}>{item.position}</Text>
        </View>
      </View>
      <View style={styles.playerStatus}>
        {item.confirmed && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusIcon}>✓</Text>
            <Text style={styles.statusText}>Confirmado</Text>
          </View>
        )}
        {item.paid && (
          <View style={[styles.statusBadge, styles.paidBadge]}>
            <Text style={styles.statusIcon}>💰</Text>
            <Text style={styles.statusText}>Pago</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detalhes da Partida</Text>
      </View>

      {/* Match Info Card */}
      <View style={styles.matchInfoCard}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchTitle}>Pelada do Domingo</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Próxima</Text>
          </View>
        </View>

        <View style={styles.matchDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Data</Text>
            <Text style={styles.detailValue}>12 de Fevereiro de 2024</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🕐 Horário</Text>
            <Text style={styles.detailValue}>14:00 - 16:00</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Local</Text>
            <Text style={styles.detailValue}>Campo da Vila, Rua Principal, 123</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>👥 Jogadores</Text>
            <Text style={styles.detailValue}>8/12 Confirmados</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💰 Taxa</Text>
            <Text style={styles.detailValue}>R$ 50,00</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Descrição</Text>
          <Text style={styles.descriptionText}>
            Pelada amistosa com jogadores de todos os níveis. Todos são bem-vindos! Traga sua energia
            e disposição para se divertir.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isConfirmed && styles.actionButtonConfirmed,
          ]}
          onPress={handleConfirmPresence}
          disabled={isConfirmed || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.actionButtonIcon}>✓</Text>
              <Text style={styles.actionButtonText}>
                {isConfirmed ? 'Presença Confirmada' : 'Confirmar Presença'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.paymentButton,
            isPaid && styles.actionButtonConfirmed,
          ]}
          onPress={handlePayment}
          disabled={isPaid}
        >
          <Text style={styles.actionButtonIcon}>💳</Text>
          <Text style={styles.actionButtonText}>
            {isPaid ? 'Pagamento Realizado' : 'Pagar R$ 50,00'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Players Section */}
      <View style={styles.playersSection}>
        <Text style={styles.sectionTitle}>Jogadores Confirmados</Text>
        <FlatList
          data={players.filter((p) => p.confirmed)}
          renderItem={renderPlayerItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.playersList}
        />
      </View>

      {/* Pending Players Section */}
      <View style={styles.playersSection}>
        <Text style={styles.sectionTitle}>Aguardando Confirmação</Text>
        <FlatList
          data={players.filter((p) => !p.confirmed)}
          renderItem={renderPlayerItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.playersList}
        />
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
  matchInfoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  matchDetails: {
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  descriptionSection: {
    gap: 8,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  descriptionText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonConfirmed: {
    backgroundColor: '#10B981',
    opacity: 0.7,
  },
  paymentButton: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  playersSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  playersList: {
    gap: 12,
  },
  playerItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  playerPosition: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  playerStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  paidBadge: {
    backgroundColor: '#10B981',
  },
});
