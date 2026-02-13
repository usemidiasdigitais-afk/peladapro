import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';

interface PlayerProfile {
  name: string;
  email: string;
  phone: string;
  position: string;
  preferredFoot: string;
  height: string;
  weight: string;
  birthDate: string;
  bio: string;
  rating: number;
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile>({
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '(11) 99999-9999',
    position: 'Atacante',
    preferredFoot: 'Direito',
    height: '1.80m',
    weight: '75kg',
    birthDate: '15/05/1995',
    bio: 'Apaixonado por futebol desde criança',
    rating: 4.8,
    totalMatches: 24,
    totalGoals: 18,
    totalAssists: 8,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  const handleSaveProfile = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
  };

  const handleLogout = () => {
    Alert.alert('Confirmar', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', onPress: () => {} },
      {
        text: 'Sair',
        onPress: () => {
          localStorage.removeItem('user');
          router.push('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Meu Perfil</Text>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JS</Text>
        </View>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileEmail}>{profile.email}</Text>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avaliação</Text>
          <Text style={styles.statValue}>⭐ {profile.rating}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Partidas</Text>
          <Text style={styles.statValue}>{profile.totalMatches}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Gols</Text>
          <Text style={styles.statValue}>{profile.totalGoals}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Assistências</Text>
          <Text style={styles.statValue}>{profile.totalAssists}</Text>
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editButton}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <>
            {/* Edit Mode */}
            <View style={styles.editForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nome</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.name}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, name: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.email}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, email: text })
                  }
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.phone}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, phone: text })
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Posição</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.position}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, position: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pé Preferido</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.preferredFoot}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, preferredFoot: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Altura</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.height}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, height: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Peso</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.weight}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, weight: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editedProfile.bio}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, bio: text })
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    setEditedProfile(profile);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* View Mode */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Posição</Text>
                <Text style={styles.infoValue}>{profile.position}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Pé Preferido</Text>
                <Text style={styles.infoValue}>{profile.preferredFoot}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Altura</Text>
                <Text style={styles.infoValue}>{profile.height}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Peso</Text>
                <Text style={styles.infoValue}>{profile.weight}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Data de Nascimento</Text>
                <Text style={styles.infoValue}>{profile.birthDate}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>{profile.phone}</Text>
              </View>
            </View>

            {profile.bio && (
              <View style={styles.bioSection}>
                <Text style={styles.bioLabel}>Bio</Text>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Sair da Conta</Text>
      </TouchableOpacity>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsCard: {
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
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  editButton: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '600',
  },
  editForm: {
    gap: 12,
  },
  formGroup: {
    marginBottom: 4,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  bioInput: {
    textAlignVertical: 'top',
  },
  editButtons: {
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
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  bioSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bioLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  bioText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 20,
  },
  logoutButton: {
    marginHorizontal: 20,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
