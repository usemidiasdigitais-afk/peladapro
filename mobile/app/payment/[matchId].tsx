import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface PaymentData {
  id: string;
  matchId: string;
  amount: string;
  qrCode: string;
  pixKey: string;
  status: 'pending' | 'confirmed' | 'failed';
  expiresAt: string;
}

export default function PaymentScreen() {
  const router = useRouter();
  const { matchId, amount } = useLocalSearchParams();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Simular geração de QR Code
    setTimeout(() => {
      setPaymentData({
        id: 'payment-' + Date.now(),
        matchId: matchId as string,
        amount: amount as string,
        qrCode: 'https://via.placeholder.com/300x300?text=QR+Code+PIX',
        pixKey: '00020126580014br.gov.bcb.pix0136550e8400-e29b-41d4-a716-4466554400005204000053039865802BR5913PELADA PRO6009SAO PAULO62410503***63041D3D',
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleCopyPixKey = () => {
    if (paymentData?.pixKey) {
      Clipboard.setString(paymentData.pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert('Sucesso', 'Chave PIX copiada para a área de transferência!');
    }
  };

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    try {
      // TODO: Integrar com backend para confirmar pagamento
      // await confirmPayment(paymentData?.id);
      
      // Simular confirmação
      setTimeout(() => {
        Alert.alert('Sucesso', 'Pagamento confirmado!', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
      }, 2000);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao confirmar pagamento');
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={styles.loadingText}>Gerando QR Code...</Text>
      </View>
    );
  }

  if (!paymentData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro ao gerar dados de pagamento</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerBackButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagamento PIX</Text>
      </View>

      {/* Payment Info */}
      <View style={styles.paymentCard}>
        <Text style={styles.cardTitle}>Valor a Pagar</Text>
        <Text style={styles.amountText}>R$ {paymentData.amount}</Text>
        <Text style={styles.descriptionText}>Pelada do Domingo - 12 de Fevereiro</Text>
      </View>

      {/* QR Code Section */}
      <View style={styles.qrSection}>
        <Text style={styles.sectionTitle}>Escaneie o QR Code</Text>
        <View style={styles.qrContainer}>
          <Image
            source={{ uri: paymentData.qrCode }}
            style={styles.qrCode}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.qrHint}>Use o seu app bancário para escanear</Text>
      </View>

      {/* PIX Key Section */}
      <View style={styles.pixKeySection}>
        <Text style={styles.sectionTitle}>Ou copie a Chave PIX</Text>
        <View style={styles.pixKeyContainer}>
          <Text style={styles.pixKeyLabel}>Chave Aleatória</Text>
          <View style={styles.pixKeyBox}>
            <Text style={styles.pixKeyText} numberOfLines={2}>
              {paymentData.pixKey}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyPixKey}
            >
              <Text style={styles.copyButtonText}>
                {copied ? '✓ Copiado' : 'Copiar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>Como Pagar</Text>
        <View style={styles.instructionsList}>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>
              Abra o app do seu banco ou carteira digital
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>
              Selecione a opção PIX e escaneie o QR Code
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>
              Confirme o valor e complete o pagamento
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>4</Text>
            <Text style={styles.instructionText}>
              Clique em "Confirmar Pagamento" abaixo
            </Text>
          </View>
        </View>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[styles.confirmButton, isConfirming && styles.confirmButtonDisabled]}
        onPress={handleConfirmPayment}
        disabled={isConfirming}
      >
        {isConfirming ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.confirmButtonIcon}>✓</Text>
            <Text style={styles.confirmButtonText}>Confirmar Pagamento</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Expiration Info */}
      <View style={styles.expirationInfo}>
        <Text style={styles.expirationText}>
          ⏰ Este QR Code expira em 30 minutos
        </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 40,
  },
  headerBackButton: {
    fontSize: 16,
    color: '#F97316',
    fontWeight: '600',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#F97316',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  qrSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  qrCode: {
    width: 250,
    height: 250,
  },
  qrHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  pixKeySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pixKeyContainer: {
    gap: 8,
  },
  pixKeyLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  pixKeyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pixKeyText: {
    flex: 1,
    fontSize: 11,
    color: '#374151',
    fontFamily: 'monospace',
    marginRight: 8,
  },
  copyButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F97316',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  confirmButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonIcon: {
    fontSize: 18,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  expirationInfo: {
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderRadius: 4,
  },
  expirationText: {
    fontSize: 12,
    color: '#92400E',
  },
});
