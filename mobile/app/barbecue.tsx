import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';

interface BarbecueItem {
  id: string;
  name: string;
  amount: number;
  paidBy: string;
  date: string;
}

interface PlayerShare {
  id: string;
  name: string;
  owes: number;
  paid: number;
}

export default function BarbecueScreen() {
  const router = useRouter();
  const [items, setItems] = useState<BarbecueItem[]>([
    {
      id: '1',
      name: 'Carne (5kg)',
      amount: 150.00,
      paidBy: 'João Silva',
      date: '12 de Fevereiro',
    },
    {
      id: '2',
      name: 'Refrigerante',
      amount: 60.00,
      paidBy: 'Pedro Santos',
      date: '12 de Fevereiro',
    },
    {
      id: '3',
      name: 'Pão',
      amount: 30.00,
      paidBy: 'Carlos Costa',
      date: '12 de Fevereiro',
    },
  ]);
  const [playerShares, setPlayerShares] = useState<PlayerShare[]>([
    { id: '1', name: 'João Silva', owes: 0, paid: 150.00 },
    { id: '2', name: 'Pedro Santos', owes: 0, paid: 60.00 },
    { id: '3', name: 'Carlos Costa', owes: 0, paid: 30.00 },
    { id: '4', name: 'Lucas Oliveira', owes: 80.00, paid: 0 },
    { id: '5', name: 'Felipe Gomes', owes: 80.00, paid: 0 },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', amount: '' });

  const totalExpense = items.reduce((sum, item) => sum + item.amount, 0);
  const totalPlayers = playerShares.length;
  const perPersonCost = totalExpense / totalPlayers;

  const handleAddItem = () => {
    if (!newItem.name || !newItem.amount) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const newBarbecueItem: BarbecueItem = {
      id: String(items.length + 1),
      name: newItem.name,
      amount: parseFloat(newItem.amount),
      paidBy: 'João Silva', // TODO: Get from user
      date: new Date().toLocaleDateString('pt-BR'),
    };

    setItems([...items, newBarbecueItem]);
    setNewItem({ name: '', amount: '' });
    setShowAddModal(false);
    Alert.alert('Sucesso', 'Item adicionado!');
  };

  const renderItem = ({ item }: { item: BarbecueItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>
          Pago por {item.paidBy} • {item.date}
        </Text>
      </View>
      <Text style={styles.itemAmount}>R$ {item.amount.toFixed(2)}</Text>
    </View>
  );

  const renderPlayerShare = ({ item }: { item: PlayerShare }) => (
    <View style={styles.playerShareCard}>
      <View style={styles.playerShareInfo}>
        <Text style={styles.playerShareName}>{item.name}</Text>
        <View style={styles.playerShareStatus}>
          {item.owes > 0 && (
            <Text style={styles.playerShareOwes}>
              Deve: R$ {item.owes.toFixed(2)}
            </Text>
          )}
          {item.paid > 0 && (
            <Text style={styles.playerSharePaid}>
              Pagou: R$ {item.paid.toFixed(2)}
            </Text>
          )}
        </View>
      </View>
      {item.owes > 0 && (
        <TouchableOpacity style={styles.payButton}>
          <Text style={styles.payButtonText}>Pagar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Churrasco</Text>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Gasto</Text>
          <Text style={styles.summaryValue}>R$ {totalExpense.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Por Pessoa</Text>
          <Text style={styles.summaryValue}>R$ {perPersonCost.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Participantes</Text>
          <Text style={styles.summaryValue}>{totalPlayers}</Text>
        </View>
      </View>

      {/* Add Item Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonIcon}>+</Text>
        <Text style={styles.addButtonText}>Adicionar Item</Text>
      </TouchableOpacity>

      {/* Items Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Despesas</Text>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.itemsList}
        />
      </View>

      {/* Player Shares Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Divisão de Custos</Text>
        <FlatList
          data={playerShares}
          renderItem={renderPlayerShare}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.playerSharesList}
        />
      </View>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Item</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome do item (ex: Carne)"
              value={newItem.name}
              onChangeText={(text) => setNewItem({ ...newItem, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Valor (ex: 150.00)"
              value={newItem.amount}
              onChangeText={(text) => setNewItem({ ...newItem, amount: text })}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddItem}
              >
                <Text style={styles.confirmButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F97316',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  addButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
  },
  playerSharesList: {
    gap: 12,
  },
  playerShareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  playerShareInfo: {
    flex: 1,
  },
  playerShareName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  playerShareStatus: {
    marginTop: 4,
  },
  playerShareOwes: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  playerSharePaid: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  payButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
