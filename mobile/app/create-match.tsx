import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMultiTenancy } from '@/contexts/MultiTenancyContext';
import { getMatchService } from '@/services/match-service';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

export default function CreateMatchScreen() {
  const navigation = useNavigation();
  const { getCurrentGroupId } = useMultiTenancy();
  const groupId = getCurrentGroupId();

  // Formulário
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('11');
  const [maxGoalkeepers, setMaxGoalkeepers] = useState('2');

  // Financeiro
  const [financialEnabled, setFinancialEnabled] = useState(false);
  const [amount, setAmount] = useState('');
  const [splitBarbecue, setSplitBarbecue] = useState(false);
  const [paymentRequired, setPaymentRequired] = useState(false);

  // UI
  const [loading, setLoading] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const handleCreateMatch = async () => {
    // Validações
    if (!title.trim()) {
      Alert.alert('Erro', 'Defina um título para a pelada');
      return;
    }

    if (!location) {
      Alert.alert('Erro', 'Selecione um local');
      return;
    }

    if (!dateTime) {
      Alert.alert('Erro', 'Selecione data e hora');
      return;
    }

    if (!groupId) {
      Alert.alert('Erro', 'Grupo não identificado');
      return;
    }

    setLoading(true);
    try {
      const matchService = getMatchService();

      const newMatch = await matchService.createMatch({
        groupId,
        title,
        location,
        dateTime,
        maxPlayers: parseInt(maxPlayers),
        maxGoalkeepers: parseInt(maxGoalkeepers),
        financialConfig: {
          enabled: financialEnabled,
          amount: financialEnabled ? parseInt(amount) * 100 : undefined, // Converter para centavos
          splitBarbecue,
          paymentRequired: financialEnabled && paymentRequired,
        },
      });

      // Gerar link de convite
      const inviteLink = await matchService.generateInviteLink(newMatch.id, groupId);

      Alert.alert('Sucesso!', 'Pelada criada com sucesso!', [
        {
          text: 'Compartilhar',
          onPress: () => {
            navigation.navigate('share-match', {
              matchId: newMatch.id,
              inviteLink: inviteLink.link,
              matchTitle: title,
            });
          },
        },
        {
          text: 'Voltar',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearch = async (text: string) => {
    setLocationInput(text);

    if (text.length < 3) {
      setShowLocationSuggestions(false);
      return;
    }

    // Aqui você integraria com Google Places API
    // Por enquanto, simulamos com sugestões locais
    setShowLocationSuggestions(true);
  };

  const handleSelectLocation = (address: string, lat: number, lng: number) => {
    setLocation({
      address,
      latitude: lat,
      longitude: lng,
      placeId: `place_${Date.now()}`,
    });
    setLocationInput(address);
    setShowLocationSuggestions(false);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* Header */}
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Organizar Nova Pelada
        </Text>
        <Text className="text-base text-gray-600 mb-6">
          Crie uma pelada e convide seus amigos
        </Text>

        {/* Título */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            Título da Pelada
          </Text>
          <TextInput
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
            placeholder="Ex: Pelada de Quinta à Noite"
            value={title}
            onChangeText={setTitle}
            editable={!loading}
          />
        </View>

        {/* Local */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            📍 Local da Quadra
          </Text>
          <TextInput
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 mb-2"
            placeholder="Digite o endereço da quadra"
            value={locationInput}
            onChangeText={handleLocationSearch}
            editable={!loading}
          />

          {showLocationSuggestions && (
            <View className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              {[
                { address: 'Quadra Central - Rua A, 123', lat: -23.5505, lng: -46.6333 },
                { address: 'Quadra do Parque - Av. B, 456', lat: -23.5510, lng: -46.6340 },
                { address: 'Quadra da Praia - Rua C, 789', lat: -23.5515, lng: -46.6345 },
              ].map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  className="p-3 border-b border-gray-200"
                  onPress={() => handleSelectLocation(suggestion.address, suggestion.lat, suggestion.lng)}
                >
                  <Text className="text-gray-800">{suggestion.address}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {location && (
            <View className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
              <Text className="text-green-800 font-semibold">✓ {location.address}</Text>
            </View>
          )}
        </View>

        {/* Data e Hora */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            📅 Data e Hora
          </Text>
          <TextInput
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
            placeholder="DD/MM/YYYY HH:MM"
            value={dateTime}
            onChangeText={setDateTime}
            editable={!loading}
          />
          <Text className="text-xs text-gray-500 mt-1">
            Clique para abrir seletor de data
          </Text>
        </View>

        {/* Vagas */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-900 mb-3">
            👥 Configuração de Vagas
          </Text>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-xs text-gray-600 mb-2">Jogadores</Text>
              <TextInput
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-center"
                placeholder="11"
                value={maxPlayers}
                onChangeText={setMaxPlayers}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-600 mb-2">Goleiros</Text>
              <TextInput
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-center"
                placeholder="2"
                value={maxGoalkeepers}
                onChangeText={setMaxGoalkeepers}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
          </View>
        </View>

        {/* Divisor */}
        <View className="h-px bg-gray-200 my-6" />

        {/* Financeiro */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-semibold text-gray-900">
              💰 Ativar Financeiro
            </Text>
            <Switch
              value={financialEnabled}
              onValueChange={setFinancialEnabled}
              disabled={loading}
            />
          </View>

          {financialEnabled && (
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              {/* Valor */}
              <View className="mb-4">
                <Text className="text-xs text-gray-600 mb-2">Valor da Pelada (R$)</Text>
                <TextInput
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
                  placeholder="50.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
              </View>

              {/* Rateio de Churrasco */}
              <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-blue-200">
                <Text className="text-xs text-gray-700">Rateio de Churrasco</Text>
                <Switch
                  value={splitBarbecue}
                  onValueChange={setSplitBarbecue}
                  disabled={loading}
                />
              </View>

              {/* Pagamento Obrigatório */}
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-700">Pagamento Obrigatório (Asaas)</Text>
                <Switch
                  value={paymentRequired}
                  onValueChange={setPaymentRequired}
                  disabled={loading}
                />
              </View>

              {paymentRequired && (
                <Text className="text-xs text-blue-600 mt-2">
                  ℹ️ Jogadores precisarão pagar via PIX para confirmar presença
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Botões */}
        <TouchableOpacity
          className={`w-full p-4 rounded-lg ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
          onPress={handleCreateMatch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Criar Pelada
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full p-4 rounded-lg border-2 border-gray-300 mt-3"
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text className="text-gray-700 text-center font-bold">Cancelar</Text>
        </TouchableOpacity>

        {/* Info */}
        <View className="mt-6 pt-6 border-t border-gray-200">
          <Text className="text-xs text-gray-500 text-center">
            Sua pelada será salva com segurança no seu grupo{'\n'}
            Isolamento de dados garantido
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
