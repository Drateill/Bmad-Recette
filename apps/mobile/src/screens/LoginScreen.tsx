import React, { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Text, TextInput, Button, Snackbar, HelperText, Divider } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@bmad/shared/schemas/authSchemas';
import { useAuthStore } from '@bmad/shared/stores/authStore';
import { loginWithGoogle, loginWithApple } from '../services/oauthService';
import * as SecureStorage from '../utils/secureStorage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AppNavigator';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((state) => state.login);
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.email, data.password);
    } catch {
      setSnackbarVisible(true);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setOauthLoading(true);
      const { user, accessToken, refreshToken } = await loginWithGoogle();
      await SecureStorage.setTokens(accessToken, refreshToken);
      setUser(user);
      setTokens(accessToken, refreshToken);
    } catch {
      setSnackbarVisible(true);
    } finally {
      setOauthLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setOauthLoading(true);
      const { user, accessToken, refreshToken } = await loginWithApple();
      await SecureStorage.setTokens(accessToken, refreshToken);
      setUser(user);
      setTokens(accessToken, refreshToken);
    } catch {
      setSnackbarVisible(true);
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome Back
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign in to BMad Recette
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={!!errors.email}
                  disabled={isLoading}
                  style={styles.input}
                />
                {errors.email && (
                  <HelperText type="error">{errors.email.message}</HelperText>
                )}
              </>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  mode="outlined"
                  secureTextEntry
                  error={!!errors.password}
                  disabled={isLoading}
                  style={styles.input}
                />
                {errors.password && (
                  <HelperText type="error">{errors.password.message}</HelperText>
                )}
              </>
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading || oauthLoading}
            style={styles.button}
          >
            Sign In
          </Button>

          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.dividerText}>
              OR
            </Text>
            <Divider style={styles.divider} />
          </View>

          <Button
            mode="outlined"
            onPress={handleGoogleLogin}
            loading={oauthLoading}
            disabled={isLoading || oauthLoading}
            style={styles.oauthButton}
          >
            Sign in with Google
          </Button>

          <Button
            mode="outlined"
            onPress={handleAppleLogin}
            loading={oauthLoading}
            disabled={isLoading || oauthLoading}
            style={styles.oauthButton}
          >
            Sign in with Apple
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            disabled={isLoading || oauthLoading}
            style={styles.linkButton}
          >
            Don't have an account? Sign up
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {error || 'Login failed'}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  oauthButton: {
    marginBottom: 12,
  },
  linkButton: {
    marginTop: 8,
  },
});
