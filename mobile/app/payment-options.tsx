import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  advantages: string[];
}

export default function PaymentOptionsScreen() {
  const router = useRouter();
  const { matchId, amount } = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showBoletoModal, setShowBoletoModal] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [boletoData, setBoletoData] = useState<any>(null);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'pix',
      name: 'PIX',
      description: 'Transferência instantânea',
      icon: '⚡',
      advantages: ['Instantâneo', 'Sem taxa', 'Seguro'],
    },
    {
      id: 'boleto',
      name: 'Boleto',
      description: 'Até 3 dias úteis',
      icon: '📄',
      advantages: ['Sem conta bancária', 'Parcelável', 'Seguro'],
    },
  ];

  const handlePixPayment = async () => {
    setIsLoading(true);
    try {
      // TODO: Integrar com backend para gerar cobrança PIX
      // const response = await apiClient.generatePixCharge({
      //   matchId,
      //   amount: parseFloat(amount as string),
      // });

      // Mock PIX data
      const mockPixData = {
        chargeId: 'charge-123',
        qrCode: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        copiaeCola:
          '00020126580014br.gov.bcb.pix0136550e8400-e29b-41d4-a716-446655440000520400005303986540510.005802BR5913PELADA PRO6009SAO PAULO62410503***63041D3D',
        expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      };

      setPixData(mockPixData);
      setShowPixModal(true);
      Alert.alert('Sucesso', 'QR Code PIX gerado!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao gerar QR Code PIX');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoletoPayment = async () => {
    setIsLoading(true);
    try {
      // TODO: Integrar com backend para gerar boleto
      // const response = await apiClient.generateBoletoCharge({
      //   matchId,
      //   amount: parseFloat(amount as string),
      // });

      // Mock Boleto data
      const mockBoletoData = {
        chargeId: 'charge-456',
        barCode: '12345.67890 12345.678901 12345.678901 1 12345678901234',
        digitableLine: '12345.67890 12345.678901 12345.678901 1 12345678901234',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60000).toLocaleDateString('pt-BR'),
        invoiceUrl: 'https://example.com/boleto.pdf',
      };

      setBoletoData(mockBoletoData);
      setShowBoletoModal(true);
      Alert.alert('Sucesso', 'Boleto gerado!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao gerar boleto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPixKey = () => {
    if (pixData?.copiaeCola) {
      // TODO: Implementar cópia para clipboard
      Alert.alert('Sucesso', 'Chave PIX copiada para a área de transferência!');
    }
  };

  const handleCopyBoletoCode = () => {
    if (boletoData?.barCode) {
      // TODO: Implementar cópia para clipboard
      Alert.alert('Sucesso', 'Código de barras copiado para a área de transferência!');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Escolher Forma de Pagamento</Text>
      </View>

      {/* Amount Card */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Valor a Pagar</Text>
        <Text style={styles.amountValue}>R$ {amount}</Text>
      </View>

      {/* Payment Methods */}
      <View style={styles.methodsContainer}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              selectedMethod === method.id && styles.methodCardSelected,
            ]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <View style={styles.methodHeader}>
              <Text style={styles.methodIcon}>{method.icon}</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </View>
              {selectedMethod === method.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </View>

            {selectedMethod === method.id && (
              <View style={styles.advantagesContainer}>
                {method.advantages.map((advantage, index) => (
                  <View key={index} style={styles.advantageItem}>
                    <Text style={styles.advantageIcon}>✓</Text>
                    <Text style={styles.advantageText}>{advantage}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={[styles.ctaButton, !selectedMethod && styles.ctaButtonDisabled]}
        onPress={() => {
          if (selectedMethod === 'pix') {
            handlePixPayment();
          } else if (selectedMethod === 'boleto') {
            handleBoletoPayment();
          }
        }}
        disabled={!selectedMethod || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.ctaButtonIcon}>
              {selectedMethod === 'pix' ? '⚡' : '📄'}
            </Text>
            <Text style={styles.ctaButtonText}>
              {selectedMethod === 'pix' ? 'Gerar QR Code PIX' : 'Gerar Boleto'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ Informações</Text>
        <Text style={styles.infoText}>
          Após gerar o pagamento, você terá até 15 minutos para confirmar a transferência PIX ou
          até a data de vencimento do boleto.
        </Text>
      </View>

      {/* PIX Modal */}
      <Modal
        visible={showPixModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPixModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pagamento PIX</Text>
              <TouchableOpacity onPress={() => setShowPixModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {pixData && (
              <>
                {/* QR Code */}
                <View style={styles.qrCodeContainer}>
                  <Text style={styles.qrCodeLabel}>Escaneie o QR Code</Text>
                  <View style={styles.qrCodePlaceholder}>
                    <Text style={styles.qrCodePlaceholderText}>QR Code</Text>
                  </View>
                </View>

                {/* Copia e Cola */}
                <View style={styles.copiaEColaContainer}>
                  <Text style={styles.copiaEColaLabel}>Ou copie a chave PIX</Text>
                  <View style={styles.copiaEColaBox}>
                    <TextInput
                      style={styles.copiaEColaInput}
                      value={pixData.copiaeCola}
                      editable={false}
                      multiline
                    />
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={handleCopyPixKey}
                    >
                      <Text style={styles.copyButtonText}>Copiar</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsTitle}>Como pagar:</Text>
                  <View style={styles.instructionStep}>
                    <Text style={styles.stepNumber}>1</Text>
                    <Text style={styles.stepText}>Abra seu app de banco</Text>
                  </View>
                  <View style={styles.instructionStep}>
                    <Text style={styles.stepNumber}>2</Text>
                    <Text style={styles.stepText}>Escaneie o QR Code ou cole a chave PIX</Text>
                  </View>
                  <View style={styles.instructionStep}>
                    <Text style={styles.stepNumber}>3</Text>
                    <Text style={styles.stepText}>Confirme a transferência</Text>
                  </View>
                  <View style={styles.instructionStep}>
                    <Text style={styles.stepNumber}>4</Text>
                    <Text style={styles.stepText}>Pronto! Pagamento confirmado</Text>
                  </View>
                </View>

                {/* Expiration */}
                <View style={styles.expirationContainer}>
                  <Text style={styles.expirationText}>
                    ⏰ Válido por 15 minutos
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowPixModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Boleto Modal */}
      <Modal
        visible={showBoletoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBoletoModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pagamento por Boleto</Text>
              <TouchableOpacity onPress={() => setShowBoletoModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {boletoData && (
              <>
                {/* Due Date */}
                <View style={styles.dueDateContainer}>
                  <Text style={styles.dueDateLabel}>Vencimento</Text>
                  <Text style={styles.dueDateValue}>{boletoData.dueDate}</Text>
                </View>

                {/* Barcode */}
                <View style={styles.barcodeContainer}>
                  <Text style={styles.barcodeLabel}>Código de Barras</Text>
                  <View style={styles.barcodeBox}>
                    <TextInput
                      style={styles.barcodeInput}
                      value={boletoData.barCode}
                      editable={false}
                      multiline
                    />
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={handleCopyBoletoCode}
                    >
                      <Text style={styles.copyButtonText}>Copiar</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsTitle}>Como pagar:</Text>
                  <View style={styles.instructionStep}>
                    <Text style={styles.stepNumber}>1</Text>
                    <Text style={styles.stepText}>Copie o código de barras</Text>
                  </View>
                  <View style={styles.instructionStep}>
                    <Text style={styles.stepNumber}>2</Text>
                    <Text style={styles.stepText}>Acesse seu app de banco</Text>
                  </View>
                  <View style={styles.instructionStep}>
                    <Text style={styles.stepNumber}>3</Text>
                    <Text style={styles.stepText}>Cole o código e confirme</Text>
                  </View>
                  <View style={styles.instructionStep}>
                    <Text style={styles.stepNumber}>4</Text>
                    <Text style={styles.stepText}>Aguarde a compensação</Text>
                  </View>
                </View>

                {/* Download Button */}
                <TouchableOpacity style={styles.downloadButton}>
                  <Text style={styles.downloadButtonIcon}>📥</Text>
                  <Text style={styles.downloadButtonText}>Baixar Boleto em PDF</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowBoletoModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  amountCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F97316',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F97316',
  },
  methodsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  methodCardSelected: {
    borderColor: '#F97316',
    backgroundColor: '#FFF8F0',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIcon: {
    fontSize: 28,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  methodDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  advantagesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  advantageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advantageIcon: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  advantageText: {
    fontSize: 12,
    color: '#6B7280',
  },
  ctaButton: {
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
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaButtonIcon: {
    fontSize: 18,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    marginHorizontal: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCodeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  qrCodePlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  copiaEColaContainer: {
    marginBottom: 20,
  },
  copiaEColaLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  copiaEColaBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
  },
  copiaEColaInput: {
    flex: 1,
    fontSize: 11,
    color: '#1F2937',
    maxHeight: 60,
  },
  copyButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionsContainer: {
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  instructionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F97316',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  expirationContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  expirationText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    textAlign: 'center',
  },
  dueDateContainer: {
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  dueDateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dueDateValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  barcodeContainer: {
    marginBottom: 20,
  },
  barcodeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  barcodeBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
    fontSize: 11,
    color: '#1F2937',
    maxHeight: 60,
  },
  downloadButton: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  downloadButtonIcon: {
    fontSize: 18,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  closeModalButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
