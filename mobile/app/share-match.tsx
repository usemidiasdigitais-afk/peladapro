import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getMatchService } from '@/services/match-service';

interface ShareMatchParams {
  matchId: string;
  inviteLink: string;
  matchTitle: string;
}

export default function ShareMatchScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { matchId, inviteLink, matchTitle } = route.params as ShareMatchParams;

  const [copied, setCopied] = useState(false);

  const matchService = getMatchService();

  const handleCopyLink = async () => {
    await Clipboard.setString(inviteLink);
    setCopied(true);
    Alert.alert('Sucesso', 'Link copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const whatsappLink = matchService.generateWhatsAppLink(inviteLink, matchTitle);
    Linking.openURL(whatsappLink).catch(() => {
      Alert.alert('Erro', 'WhatsApp não está instalado');
    });
  };

  const handleShareSMS = () => {
    const smsLink = matchService.generateSMSLink(inviteLink, matchTitle);
    Linking.openURL(smsLink).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir SMS');
    });
  };

  const handleShareEmail = () => {
    const emailLink = matchService.generateEmailLink(inviteLink, matchTitle);
    Linking.openURL(emailLink).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir Email');
    });
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* Header */}
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Compartilhar Pelada
        </Text>
        <Text className="text-base text-gray-600 mb-6">
          Convide seus amigos para a pelada
        </Text>

        {/* Informações da Pelada */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <Text className="text-sm font-semibold text-blue-900 mb-2">
            🏆 {matchTitle}
          </Text>
          <Text className="text-xs text-blue-700">
            ID da Pelada: {matchId}
          </Text>
        </View>

        {/* Link de Convite */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-900 mb-3">
            🔗 Link de Convite
          </Text>
          <View className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-3">
            <Text className="text-xs text-gray-600 font-mono break-words">
              {inviteLink}
            </Text>
          </View>
          <TouchableOpacity
            className={`w-full p-3 rounded-lg ${
              copied ? 'bg-green-600' : 'bg-gray-600'
            }`}
            onPress={handleCopyLink}
          >
            <Text className="text-white text-center font-bold">
              {copied ? '✓ Link Copiado' : '📋 Copiar Link'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divisor */}
        <View className="h-px bg-gray-200 my-6" />

        {/* Opções de Compartilhamento */}
        <Text className="text-sm font-semibold text-gray-900 mb-4">
          📤 Compartilhar Via
        </Text>

        {/* WhatsApp */}
        <TouchableOpacity
          className="flex-row items-center bg-green-50 border border-green-200 rounded-lg p-4 mb-3"
          onPress={handleShareWhatsApp}
        >
          <Text className="text-2xl mr-3">💬</Text>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">WhatsApp</Text>
            <Text className="text-xs text-gray-600">Enviar para contatos</Text>
          </View>
          <Text className="text-gray-400">›</Text>
        </TouchableOpacity>

        {/* SMS */}
        <TouchableOpacity
          className="flex-row items-center bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3"
          onPress={handleShareSMS}
        >
          <Text className="text-2xl mr-3">📱</Text>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">SMS</Text>
            <Text className="text-xs text-gray-600">Enviar mensagem de texto</Text>
          </View>
          <Text className="text-gray-400">›</Text>
        </TouchableOpacity>

        {/* Email */}
        <TouchableOpacity
          className="flex-row items-center bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6"
          onPress={handleShareEmail}
        >
          <Text className="text-2xl mr-3">📧</Text>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">Email</Text>
            <Text className="text-xs text-gray-600">Enviar por email</Text>
          </View>
          <Text className="text-gray-400">›</Text>
        </TouchableOpacity>

        {/* Informações */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <Text className="text-sm font-semibold text-yellow-900 mb-2">
            ℹ️ Como Funciona
          </Text>
          <Text className="text-xs text-yellow-800 mb-1">
            • Cada link é único para esta pelada
          </Text>
          <Text className="text-xs text-yellow-800 mb-1">
            • Válido por 30 dias
          </Text>
          <Text className="text-xs text-yellow-800">
            • Jogadores confirmam presença clicando no link
          </Text>
        </View>

        {/* Botões de Ação */}
        <TouchableOpacity
          className="w-full p-4 rounded-lg bg-blue-600 mb-3"
          onPress={() => navigation.navigate('dashboard')}
        >
          <Text className="text-white text-center font-bold text-lg">
            ✓ Voltar ao Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full p-4 rounded-lg border-2 border-gray-300"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-gray-700 text-center font-bold">
            Voltar
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="mt-6 pt-6 border-t border-gray-200">
          <Text className="text-xs text-gray-500 text-center">
            Link mágico de convite{'\n'}
            Isolamento de dados garantido por grupo
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
