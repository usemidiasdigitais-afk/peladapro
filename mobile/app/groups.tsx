import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

interface Group {
  id: string;
  name: string;
  members: number;
  admin: string;
  createdAt: string;
  role: 'ADMIN' | 'MEMBER';
}

export default function GroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: 'Pelada do Domingo',
      members: 12,
      admin: 'João Silva',
      createdAt: 'Jan 2024',
      role: 'ADMIN',
    },
    {
      id: '2',
      name: 'Campeonato Amigos',
      members: 24,
      admin: 'Pedro Santos',
      createdAt: 'Dez 2023',
      role: 'MEMBER',
    },
    {
      id: '3',
      name: 'Pelada Clássica',
      members: 18,
      admin: 'Carlos Costa',
      createdAt: 'Nov 2023',
      role: 'MEMBER',
    },
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert('Erro', 'Nome do grupo é obrigatório');
      return;
    }

    const newGroup: Group = {
      id: String(groups.length + 1),
      name: newGroupName,
      members: 1,
      admin: 'Você',
      createdAt: new Date().toLocaleDateString('pt-BR'),
      role: 'ADMIN',
    };

    setGroups([...groups, newGroup]);
    setNewGroupName('');
    setShowCreateModal(false);
    Alert.alert('Sucesso', 'Grupo criado com sucesso!');
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => router.push(`/group/${item.id}`)}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupMeta}>
            {item.members} membros • Criado em {item.createdAt}
          </Text>
        </View>
        <View
          style={[
            styles.roleBadge,
            item.role === 'ADMIN' ? styles.adminBadge : styles.memberBadge,
          ]}
        >
          <Text style={styles.roleBadgeText}>{item.role === 'ADMIN' ? 'Admin' : 'Membro'}</Text>
        </View>
      </View>

      <View style={styles.groupFooter}>
        <Text style={styles.adminText}>Admin: {item.admin}</Text>
        <Text style={styles.actionText}>Toque para ver detalhes →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Meus Grupos</Text>
      </View>

      {/* Create Group Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.createButtonIcon}>+</Text>
        <Text style={styles.createButtonText}>Criar Novo Grupo</Text>
      </TouchableOpacity>

      {/* Groups List */}
      <View style={styles.groupsContainer}>
        {groups.length > 0 ? (
          <FlatList
            data={groups}
            renderItem={renderGroup}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.groupsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👥</Text>
            <Text style={styles.emptyStateTitle}>Nenhum grupo ainda</Text>
            <Text style={styles.emptyStateText}>
              Crie um novo grupo ou peça para ser adicionado a um existente
            </Text>
          </View>
        )}
      </View>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Novo Grupo</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome do grupo"
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleCreateGroup}
              >
                <Text style={styles.confirmButtonText}>Criar</Text>
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
  createButton: {
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
  createButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  groupsContainer: {
    paddingHorizontal: 20,
  },
  groupsList: {
    gap: 12,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  adminBadge: {
    backgroundColor: '#F97316',
  },
  memberBadge: {
    backgroundColor: '#E5E7EB',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  groupFooter: {
    paddingTopWidth: 1,
    paddingTopColor: '#E5E7EB',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  adminText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '600',
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
    maxWidth: 250,
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
    marginBottom: 16,
    fontSize: 14,
    color: '#1F2937',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
