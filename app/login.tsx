import { useAuth } from '@/components/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const [nome, setNome] = useState('');
  const [matricula, setMatricula] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogin = () => {
    if (!nome || !matricula) {
      Alert.alert('Erro', 'Preencha nome e matrícula');
      return;
    }
    login(nome, matricula);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.logoContainer}>
        <FontAwesome name="cut" size={80} color={colors.primary} />
        <Text style={[styles.appTitle, { color: colors.text }]}>Barbearia</Text>
        <Text style={[styles.appSubtitle, { color: colors.secondary }]}>Sistema de Gestão</Text>
      </View>

      <View style={[styles.formContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Login do Funcionário</Text>

        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Nome completo"
            placeholderTextColor={colors.tabIconDefault}
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome name="id-card" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Matrícula"
            placeholderTextColor={colors.tabIconDefault}
            value={matricula}
            onChangeText={setMatricula}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Entrar"
            onPress={handleLogin}
            color={colors.primary}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
  },
  appSubtitle: {
    fontSize: 16,
    marginTop: 5,
  },
  formContainer: {
    padding: 30,
    borderRadius: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  input: {
    flex: 1,
    padding: 15,
    paddingLeft: 50,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
});