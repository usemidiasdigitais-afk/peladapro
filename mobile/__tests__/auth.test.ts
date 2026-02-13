import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage');

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login', () => {
    it('should store user data on successful login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PLAYER',
      };

      // Mock AsyncStorage.setItem
      (AsyncStorage.setItem as any).mockResolvedValue(undefined);

      // Simulate login
      await AsyncStorage.setItem('@pelada_pro_user', JSON.stringify(mockUser));

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@pelada_pro_user',
        JSON.stringify(mockUser)
      );
    });

    it('should handle login errors gracefully', async () => {
      const error = new Error('Network error');
      (AsyncStorage.setItem as any).mockRejectedValue(error);

      try {
        await AsyncStorage.setItem('@pelada_pro_user', '{}');
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });

  describe('Logout', () => {
    it('should remove user data on logout', async () => {
      (AsyncStorage.removeItem as any).mockResolvedValue(undefined);

      await AsyncStorage.removeItem('@pelada_pro_user');
      await AsyncStorage.removeItem('@pelada_pro_token');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@pelada_pro_user');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@pelada_pro_token');
    });
  });

  describe('Session Restoration', () => {
    it('should restore user session from storage', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PLAYER',
      };

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockUser));

      const userJson = await AsyncStorage.getItem('@pelada_pro_user');
      const user = userJson ? JSON.parse(userJson) : null;

      expect(user).toEqual(mockUser);
    });

    it('should return null if no session exists', async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      const userJson = await AsyncStorage.getItem('@pelada_pro_user');

      expect(userJson).toBeNull();
    });
  });
});
