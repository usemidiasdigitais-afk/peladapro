import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';

interface Team {
  id: string;
  name: string;
  players: Player[];
  totalRating: number;
}

interface Player {
  id: string;
  name: string;
  position: string;
  rating: number;
}

export default function SorterScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [matchId, setMatchId] = useState('match-123');

  const handleGenerateTeams = async () => {
    setIsLoading(true);
    try {
      // TODO: Integrar com backend IA
      // const response = await apiClient.generateTeams(matchId);

      // Mock teams geradas por IA
      const mockTeams: Team[] = [
        {
          id: 'team-1',
          name: 'Time A',
          players: [
            { id: '1', name: 'João Silva', position: 'Goleiro', rating: 4.8 },
            { id: '2', name: 'Pedro Santos', position: 'Zagueiro', rating: 4.5 },
            { id: '3', name: 'Carlos Costa', position: 'Lateral', rating: 4.3 },
            { id: '4', name: 'Lucas Oliveira', position: 'Meia', rating: 4.6 },
            { id: '5', name: 'Felipe Gomes', position: 'Atacante', rating: 4.7 },
          ],
          totalRating: 22.9,
        },
        {
          id: 'team-2',
          name: 'Time B',
          players: [
            { id: '6', name: 'Rafael Martins', position: 'Goleiro', rating: 4.6 },
            { id: '7', name: 'Gustavo Ferreira', position: 'Zagueiro', rating: 4.4 },
            { id: '8', name: 'Bruno Alves', position: 'Lateral', rating: 4.5 },
            { id: '9', name: 'André Pereira', position: 'Meia', rating: 4.4 },
            { id: '10', name: 'Thiago Rocha', position: 'Atacante', rating: 4.6 },
          ],
          totalRating: 22.5,
        },
      ];

      setTeams(mockTeams);
      Alert.alert('Sucesso', 'Times gerados com inteligência artificial!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao gerar times');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTeams = async () => {
    try {
      // TODO: Integrar com backend
      // await apiClient.confirmTeams(matchId, teams);
      Alert.alert('Sucesso', 'Times confirmados!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao confirmar times');
    }
  };

  const renderTeam = ({ item }: { item: Team }) => (
    <View style={styles.teamCard}>
      <View style={styles.teamHeader}>
        <Text style={styles.teamName}>{item.name}</Text>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{item.totalRating.toFixed(1)}</Text>
        </View>
      </View>

      <FlatList
        data={item.players}
        renderItem={({ item: player }) => (
          <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerPosition}>{player.position}</Text>
            </View>
            <View style={styles.playerRating}>
              <Text style={styles.playerRatingText}>⭐ {player.rating}</Text>
            </View>
          </View>
        )}
        keyExtractor={(player) => player.id}
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sorteio Preditivo IA</Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🤖 Sorteio Inteligente</Text>
        <Text style={styles.infoText}>
          A inteligência artificial analisa o histórico de desempenho, posição preferida e nível de
          habilidade de cada jogador para criar times equilibrados.
        </Text>
      </View>

      {/* Generate Button */}
      {!teams && (
        <TouchableOpacity
          style={[styles.generateButton, isLoading && styles.buttonDisabled]}
          onPress={handleGenerateTeams}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.generateButtonIcon}>🎲</Text>
              <Text style={styles.generateButtonText}>Gerar Times com IA</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Teams Display */}
      {teams && (
        <>
          <View style={styles.teamsContainer}>
            <FlatList
              data={teams}
              renderItem={renderTeam}
              keyExtractor={(team) => team.id}
              scrollEnabled={false}
              contentContainerStyle={styles.teamsList}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmTeams}
            >
              <Text style={styles.confirmButtonIcon}>✓</Text>
              <Text style={styles.confirmButtonText}>Confirmar Times</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={handleGenerateTeams}
            >
              <Text style={styles.regenerateButtonIcon}>🔄</Text>
              <Text style={styles.regenerateButtonText}>Gerar Novamente</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Info */}
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceTitle}>📊 Equilíbrio dos Times</Text>
            <Text style={styles.balanceText}>
              Diferença de força: {Math.abs(teams[0].totalRating - teams[1].totalRating).toFixed(1)} pontos
            </Text>
            <View style={styles.balanceBar}>
              <View
                style={[
                  styles.balanceBarFill,
                  {
                    width: `${(teams[0].totalRating / (teams[0].totalRating + teams[1].totalRating)) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        </>
      )}
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
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  generateButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  generateButtonIcon: {
    fontSize: 20,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  teamsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  teamsList: {
    gap: 16,
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  ratingBadge: {
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  playerInfo: {
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
  playerRating: {
    marginLeft: 8,
  },
  playerRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F97316',
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonIcon: {
    fontSize: 18,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  regenerateButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  regenerateButtonIcon: {
    fontSize: 18,
  },
  regenerateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceInfo: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  balanceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  balanceBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  balanceBarFill: {
    height: '100%',
    backgroundColor: '#F97316',
  },
});
