import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

const ROLES: { label: string; value: UserRole; description: string }[] = [
  {
    label: 'Jogador',
    value: 'PLAYER',
    description: 'Participe de partidas e gerencie seus pagamentos',
  },
  {
    label: 'Admin',
    value: 'ADMIN',
    description: 'Crie e gerencie grupos e partidas',
  },
  {
    label: 'Super Admin',
    value: 'SUPER_ADMIN',
    description: 'Acesso total ao sistema',
  },
];

export default function SignupScreen() {
  const router = useRouter();
  const { signup, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('PLAYER');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    // Validations
    if (!email || !password || !confirmPassword || !name) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não correspondem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      await signup(email, password, name, selectedRole);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Erro de Cadastro', 'Falha ao criar conta. Tente novamente.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Criar Conta</Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={styles.input}
            placeholder="João Silva"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            editable={!isLoading}
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirmar Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isLoading}
            secureTextEntry={!showPassword}
          />
        </View>

        {/* Role Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de Conta</Text>
          <View style={styles.rolesContainer}>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.roleCard,
                  selectedRole === role.value && styles.roleCardSelected,
                ]}
                onPress={() => setSelectedRole(role.value)}
                disabled={isLoading}
              >
                <View style={styles.roleContent}>
                  <Text style={styles.roleLabel}>{role.label}</Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                </View>
                <View
                  style={[
                    styles.roleCheckbox,
                    selectedRole === role.value && styles.roleCheckboxSelected,
                  ]}
                >
                  {selectedRole === role.value && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Signup Button */}
        <TouchableOpacity
          style={[styles.signupButton, isLoading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signupButtonText}>Criar Conta</Text>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.termsText}>
          Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade.
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 30,
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
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  rolesContainer: {
    gap: 12,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleCardSelected: {
    borderColor: '#F97316',
    backgroundColor: '#FEF3C7',
  },
  roleContent: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  roleCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleCheckboxSelected: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  signupButton: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
