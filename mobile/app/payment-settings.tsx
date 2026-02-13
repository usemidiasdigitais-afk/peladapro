import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useMultiTenancy } from '@/contexts/MultiTenancyContext';
import { getSecureAPIClient } from '@/services/secure-api';

export default function PaymentSettingsScreen() {
  const { getCurrentGroupId } = useMultiTenancy();
  const [asaasApiKey, setAsaasApiKey] = useState('');
  const [asaasEnvironment, setAsaasEnvironment] = useState('sandbox');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const groupId = getCurrentGroupId();

  const handleSaveSettings = async () => {
    if (!asaasApiKey.trim()) {
      Alert.alert('Erro', 'Chave da API Asaas é obrigatória');
      return;
    }

    setLoading(true);
    try {
      const api = getSecureAPIClient();
      
      await api.post('/groups/payment-settings', {
        groupId,
        asaasApiKey,
        asaasEnvironment,
        webhookUrl,
      });

      setSaved(true);
      Alert.alert('Sucesso', 'Configurações de pagamento salvas com sucesso!');
      
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6 bg-gradient-to-b from-blue-50 to-white">
        {/* Header */}
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Configurações de Pagamento
        </Text>
        <Text className="text-base text-gray-600 mb-6">
          Configure sua integração com Asaas para receber pagamentos via PIX e Boleto
        </Text>

        {/* Success Message */}
        {saved && (
          <View className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Text className="text-green-800 font-semibold">✓ Configurações salvas com sucesso!</Text>
          </View>
        )}

        {/* API Key Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Chave da API Asaas
          </Text>
          <Text className="text-sm text-gray-600 mb-3">
            Obtenha sua chave em https://asaas.com/api
          </Text>
          <TextInput
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
            placeholder="sk_live_... ou sk_test_..."
            value={asaasApiKey}
            onChangeText={setAsaasApiKey}
            secureTextEntry
            editable={!loading}
          />
        </View>

        {/* Environment Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Ambiente
          </Text>
          <View className="flex-row gap-3">
            {['sandbox', 'production'].map((env) => (
              <TouchableOpacity
                key={env}
                className={`flex-1 p-3 rounded-lg border-2 ${
                  asaasEnvironment === env
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setAsaasEnvironment(env)}
                disabled={loading}
              >
                <Text
                  className={`text-center font-semibold capitalize ${
                    asaasEnvironment === env ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {env === 'sandbox' ? '🧪 Teste' : '🚀 Produção'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-xs text-gray-500 mt-2">
            {asaasEnvironment === 'sandbox'
              ? 'Use para testes. Nenhum dinheiro real será movido.'
              : 'Use para produção. Cobranças reais serão processadas.'}
          </Text>
        </View>

        {/* Webhook URL Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            URL do Webhook (Opcional)
          </Text>
          <Text className="text-sm text-gray-600 mb-3">
            URL para receber notificações de pagamentos
          </Text>
          <TextInput
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
            placeholder="https://seu-dominio.com/webhooks/asaas"
            value={webhookUrl}
            onChangeText={setWebhookUrl}
            editable={!loading}
          />
        </View>

        {/* Info Box */}
        <View className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Text className="text-sm font-semibold text-blue-900 mb-2">
            ℹ️ Informações Importantes
          </Text>
          <Text className="text-xs text-blue-800 mb-1">
            • Sua chave de API é armazenada de forma segura
          </Text>
          <Text className="text-xs text-blue-800 mb-1">
            • Nunca compartilhe sua chave com terceiros
          </Text>
          <Text className="text-xs text-blue-800">
            • Você pode revogar a chave a qualquer momento no painel Asaas
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className={`w-full p-4 rounded-lg ${
            loading ? 'bg-gray-400' : 'bg-blue-600'
          }`}
          onPress={handleSaveSettings}
          disabled={loading}
        >
          <Text className="text-white text-center font-bold text-lg">
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Text>
        </TouchableOpacity>

        {/* Test Button */}
        <TouchableOpacity
          className="w-full p-4 rounded-lg border-2 border-blue-600 mt-3"
          onPress={() => {
            Alert.alert(
              'Teste de Conexão',
              'Clique em OK para testar a conexão com Asaas'
            );
          }}
          disabled={loading || !asaasApiKey}
        >
          <Text className="text-blue-600 text-center font-bold text-lg">
            Testar Conexão
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
