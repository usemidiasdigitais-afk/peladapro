import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Clipboard } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useMultiTenancy } from '@/contexts/MultiTenancyContext';
import { getAsaasService, initializeAsaas } from '@/services/asaas-payment-service';

interface PixPaymentScreenProps {
  matchId: string;
  amount: number;
  playerName: string;
}

export default function PixPaymentScreen() {
  const route = useRoute();
  const { matchId, amount, playerName } = route.params as PixPaymentScreenProps;
  const { getCurrentGroupId } = useMultiTenancy();

  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiaeCola, setCopiaeCola] = useState<string | null>(null);
  const [chargeId, setChargeId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(900); // 15 minutos

  const groupId = getCurrentGroupId();

  useEffect(() => {
    generatePixCharge();
  }, []);

  // Countdown para expiração do PIX
  useEffect(() => {
    if (status === 'pending' && expiresIn > 0) {
      const timer = setTimeout(() => setExpiresIn(expiresIn - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [expiresIn, status]);

  const generatePixCharge = async () => {
    if (!groupId) {
      setError('Grupo não identificado');
      return;
    }

    setLoading(true);
    try {
      // Inicializar Asaas com configurações do grupo
      await initializeAsaas(groupId);
      const asaas = getAsaasService();

      // Criar cobrança PIX
      const charge = await asaas.createPixCharge({
        groupId,
        customer: {
          name: playerName,
          email: `player-${Date.now()}@peladapro.local`,
        },
        amount,
        description: `Pagamento de participação - Partida ${matchId}`,
        dueDate: new Date(Date.now() + 15 * 60 * 1000).toISOString().split('T')[0],
      });

      setChargeId(charge.id);
      setQrCode(charge.pixQrCode || '');
      setCopiaeCola(charge.pixCopiaeCola || '');
      setStatus('pending');
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setString(text);
    Alert.alert('Sucesso', 'Chave PIX copiada para a área de transferência!');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Gerando QR Code PIX...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white p-6 justify-center">
        <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <Text className="text-red-900 font-bold mb-2">Erro ao Gerar PIX</Text>
          <Text className="text-red-800">{error}</Text>
        </View>
        <TouchableOpacity
          className="bg-blue-600 p-4 rounded-lg"
          onPress={generatePixCharge}
        >
          <Text className="text-white text-center font-bold">Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* Header */}
        <Text className="text-3xl font-bold text-gray-900 mb-2">Pagamento PIX</Text>
        <Text className="text-base text-gray-600 mb-6">
          Escaneie o QR Code ou copie a chave PIX para pagar
        </Text>

        {/* Valor */}
        <View className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <Text className="text-sm text-blue-600 font-semibold mb-2">VALOR A PAGAR</Text>
          <Text className="text-4xl font-bold text-blue-900">
            R$ {(amount / 100).toFixed(2)}
          </Text>
          <Text className="text-sm text-blue-600 mt-2">Partida: {matchId}</Text>
        </View>

        {/* Expiração */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <Text className="text-sm text-yellow-800 font-semibold">
            ⏱️ PIX expira em {formatTime(expiresIn)}
          </Text>
          <Text className="text-xs text-yellow-700 mt-1">
            Após expirar, você precisará gerar um novo QR Code
          </Text>
        </View>

        {/* QR Code */}
        {qrCode && (
          <View className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 items-center">
            <Text className="text-sm font-semibold text-gray-900 mb-4">
              ESCANEIE COM SEU CELULAR
            </Text>
            {/* Aqui você colocaria um componente de QR Code real */}
            <View className="w-64 h-64 bg-white border-2 border-gray-300 rounded-lg items-center justify-center">
              <Text className="text-gray-500 text-center">
                📱 QR Code PIX{'\n'}(Renderizar com react-native-qrcode-svg)
              </Text>
            </View>
            <Text className="text-xs text-gray-500 mt-4">
              ID da Cobrança: {chargeId}
            </Text>
          </View>
        )}

        {/* Chave PIX */}
        {copiaeCola && (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-900 mb-3">
              OU COPIE A CHAVE PIX
            </Text>
            <View className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-3">
              <Text className="text-xs text-gray-600 font-mono break-words">
                {copiaeCola}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-blue-600 p-4 rounded-lg"
              onPress={() => copyToClipboard(copiaeCola)}
            >
              <Text className="text-white text-center font-bold">
                📋 Copiar Chave PIX
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instruções */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <Text className="text-sm font-semibold text-blue-900 mb-3">
            📝 Como Pagar
          </Text>
          <Text className="text-xs text-blue-800 mb-2">
            1️⃣ Abra o app do seu banco
          </Text>
          <Text className="text-xs text-blue-800 mb-2">
            2️⃣ Selecione "Pagar com PIX"
          </Text>
          <Text className="text-xs text-blue-800 mb-2">
            3️⃣ Escaneie o QR Code ou copie a chave
          </Text>
          <Text className="text-xs text-blue-800">
            4️⃣ Confirme o pagamento
          </Text>
        </View>

        {/* Status */}
        <View className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            Status do Pagamento
          </Text>
          <View className="flex-row items-center">
            <View
              className={`w-3 h-3 rounded-full mr-2 ${
                status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            />
            <Text className="text-sm text-gray-700 capitalize">
              {status === 'pending' ? 'Aguardando Pagamento' : 'Pagamento Confirmado'}
            </Text>
          </View>
        </View>

        {/* Botões de Ação */}
        <TouchableOpacity
          className="bg-gray-600 p-4 rounded-lg mb-3"
          onPress={generatePixCharge}
        >
          <Text className="text-white text-center font-bold">
            🔄 Gerar Novo QR Code
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-200 p-4 rounded-lg"
          onPress={() => Alert.alert('Voltar', 'Você será redirecionado para a partida')}
        >
          <Text className="text-gray-800 text-center font-bold">
            ← Voltar
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="mt-6 pt-6 border-t border-gray-200">
          <Text className="text-xs text-gray-500 text-center">
            Pagamentos processados com segurança via Asaas{'\n'}
            Isolamento de dados garantido por grupo
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
