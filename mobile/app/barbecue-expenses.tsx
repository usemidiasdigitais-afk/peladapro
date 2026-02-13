import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  FlatList,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { initBarbecueService, BarbecueExpense } from '@/services/barbecue-service';

export default function BarbecueExpensesScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams();
  const service = initBarbecueService();

  const [expenses, setExpenses] = useState<BarbecueExpense[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const [newExpense, setNewExpense] = useState({
    category: 'MEAT',
    description: '',
    amount: '',
    paidBy: 'user-1',
    paidByName: 'Você',
    splitAmong: ['user-1'] as string[],
  });

  const categories = service.getCategories();

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const expense: BarbecueExpense = {
      id: `expense-${Date.now()}`,
      matchId: matchId as string,
      category: newExpense.category as any,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      paidBy: newExpense.paidBy,
      paidByName: newExpense.paidByName,
      splitAmong: newExpense.splitAmong,
      date: new Date().toISOString(),
    };

    service.addExpense(expense);
    setExpenses([...expenses, expense]);

    setNewExpense({
      category: 'MEAT',
      description: '',
      amount: '',
      paidBy: 'user-1',
      paidByName: 'Você',
      splitAmong: ['user-1'],
    });

    setShowAddModal(false);
    Alert.alert('Sucesso', 'Despesa adicionada!');
  };

  const handleRemoveExpense = (expenseId: string) => {
    service.removeExpense(matchId as string, expenseId);
    setExpenses(expenses.filter((e) => e.id !== expenseId));
  };

  const getCategoryIcon = (category: string) => {
    return categories.find((c) => c.id === category)?.icon || '📦';
  };

  const getCategoryName = (category: string) => {
    return categories.find((c) => c.id === category)?.name || category;
  };

  const summary = service.generateSummary(matchId as string);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const renderExpense = ({ item }: { item: BarbecueExpense }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseCategory}>
            {getCategoryIcon(item.category)} {getCategoryName(item.category)}
          </Text>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expensePaidBy}>Pagou: {item.paidByName}</Text>
        </View>
        <View style={styles.expenseAmount}>
          <Text style={styles.expenseAmountValue}>
            {service.formatCurrency(item.amount)}
          </Text>
          <TouchableOpacity
            onPress={() => handleRemoveExpense(item.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.expenseFooter}>
        <Text style={styles.splitText}>
          Dividido entre {item.splitAmong.length} pessoa(s)
        </Text>
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
        <Text style={styles.title}>Despesas do Churrasco</Text>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Gasto</Text>
          <Text style={styles.summaryValue}>
            {service.formatCurrency(totalExpenses)}
          </Text>
        </View>
        <View style={styles.summarySeparator} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={styles.summaryValue}>{expenses.length}</Text>
        </View>
        <View style={styles.summarySeparator} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Média</Text>
          <Text style={styles.summaryValue}>
            {service.formatCurrency(
              expenses.length > 0 ? totalExpenses / expenses.length : 0
            )}
          </Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Despesas por Categoria</Text>
        {categories.map((cat) => {
          const categoryTotal = expenses
            .filter((e) => e.category === cat.id)
            .reduce((sum, e) => sum + e.amount, 0);

          if (categoryTotal === 0) return null;

          return (
            <View key={cat.id} style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>
                {cat.icon} {cat.name}
              </Text>
              <Text style={styles.breakdownValue}>
                {service.formatCurrency(categoryTotal)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Expenses List */}
      <View style={styles.expensesContainer}>
        <View style={styles.expensesHeader}>
          <Text style={styles.expensesTitle}>Histórico de Despesas</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        {expenses.length > 0 ? (
          <FlatList
            data={expenses}
            renderItem={renderExpense}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.expensesList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🍖</Text>
            <Text style={styles.emptyStateTitle}>Nenhuma despesa ainda</Text>
            <Text style={styles.emptyStateText}>
              Adicione despesas do churrasco para começar
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {expenses.length > 0 && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.summaryButton}
            onPress={() => setShowSummaryModal(true)}
          >
            <Text style={styles.summaryButtonIcon}>📊</Text>
            <Text style={styles.summaryButtonText}>Ver Resumo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Despesa</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Category Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Categoria</Text>
                <View style={styles.categoryGrid}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryButton,
                        newExpense.category === cat.id &&
                          styles.categoryButtonSelected,
                      ]}
                      onPress={() => setNewExpense({ ...newExpense, category: cat.id })}
                    >
                      <Text style={styles.categoryButtonIcon}>{cat.icon}</Text>
                      <Text style={styles.categoryButtonText}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Descrição</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Carne vermelha"
                  value={newExpense.description}
                  onChangeText={(text) =>
                    setNewExpense({ ...newExpense, description: text })
                  }
                />
              </View>

              {/* Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Valor (R$)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={newExpense.amount}
                  onChangeText={(text) =>
                    setNewExpense({ ...newExpense, amount: text })
                  }
                />
              </View>

              {/* Paid By */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Quem Pagou?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  value={newExpense.paidByName}
                  onChangeText={(text) =>
                    setNewExpense({ ...newExpense, paidByName: text })
                  }
                />
              </View>

              {/* Split Among */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Dividir Entre</Text>
                <Text style={styles.formHint}>
                  {newExpense.splitAmong.length} pessoa(s)
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAddExpense}
                >
                  <Text style={styles.saveButtonText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Summary Modal */}
      <Modal
        visible={showSummaryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resumo de Despesas</Text>
              <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.summaryContent}>
              {/* Total */}
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>💰 Totais</Text>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLineLabel}>Total Gasto:</Text>
                  <Text style={styles.summaryLineValue}>
                    {service.formatCurrency(totalExpenses)}
                  </Text>
                </View>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLineLabel}>Número de Despesas:</Text>
                  <Text style={styles.summaryLineValue}>{expenses.length}</Text>
                </View>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLineLabel}>Média por Pessoa:</Text>
                  <Text style={styles.summaryLineValue}>
                    {service.formatCurrency(
                      expenses.length > 0 ? totalExpenses / expenses.length : 0
                    )}
                  </Text>
                </View>
              </View>

              {/* Participants */}
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>👥 Balanço por Participante</Text>
                {summary.participants.map((participant) => (
                  <View key={participant.id} style={styles.participantCard}>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{participant.name}</Text>
                      <Text style={styles.participantStats}>
                        Pagou: {service.formatCurrency(participant.paid)}
                      </Text>
                      <Text style={styles.participantStats}>
                        Deve: {service.formatCurrency(participant.owes)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.participantBalance,
                        {
                          backgroundColor:
                            participant.balance > 0 ? '#D1FAE5' : '#FEE2E2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.participantBalanceValue,
                          {
                            color:
                              participant.balance > 0 ? '#065F46' : '#7F1D1D',
                          },
                        ]}
                      >
                        {service.formatCurrency(participant.balance)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Debts */}
              {summary.debts.length > 0 && (
                <View style={styles.summarySection}>
                  <Text style={styles.summaryTitle}>💳 Débitos a Pagar</Text>
                  {summary.debts.map((debt, index) => (
                    <View key={index} style={styles.debtCard}>
                      <Text style={styles.debtText}>
                        {debt.fromName} deve {service.formatCurrency(debt.amount)} a{' '}
                        {debt.toName}
                      </Text>
                      <TouchableOpacity style={styles.debtCheckButton}>
                        <Text style={styles.debtCheckText}>✓ Pago</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowSummaryModal(false)}
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
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F97316',
  },
  summarySeparator: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  breakdownCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  expensesContainer: {
    paddingHorizontal: 20,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expensesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  expensesList: {
    gap: 12,
  },
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  expenseDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  expensePaidBy: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  expenseAmountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
    marginBottom: 4,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  expenseFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  splitText: {
    fontSize: 11,
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
  actionButtons: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  summaryButton: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryButtonIcon: {
    fontSize: 18,
  },
  summaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  modalForm: {
    paddingBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  formHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  categoryButtonSelected: {
    backgroundColor: '#FFF8F0',
    borderColor: '#F97316',
  },
  categoryButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryButtonText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContent: {
    paddingBottom: 20,
  },
  summarySection: {
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLineLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryLineValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  participantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  participantStats: {
    fontSize: 11,
    color: '#6B7280',
  },
  participantBalance: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  participantBalanceValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  debtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  debtCheckButton: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  debtCheckText: {
    color: '#065F46',
    fontSize: 11,
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
