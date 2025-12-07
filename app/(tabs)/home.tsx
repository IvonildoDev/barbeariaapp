import { useAuth } from '@/components/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { funcionario, logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: () => {
          logout();
          router.replace('/login');
        }},
      ]
    );
  };

  const menuItems = [
    // {
    //   title: 'Cadastro de Clientes',
    //   icon: 'user-plus',
    //   screen: 'index',
    //   color: colors.primary,
    // },
    {
      title: 'Cadastro de Funcionários',
      icon: 'users',
      screen: 'funcionarios',
      color: colors.secondary,
    },
    {
      title: 'Agendamento',
      icon: 'calendar',
      screen: 'agendamento',
      color: colors.success,
    },
    {
      title: 'Produtos e Serviços',
      icon: 'shopping-bag',
      screen: 'produtos',
      color: colors.primary,
    },
    {
      title: 'Vendas',
      icon: 'shopping-cart',
      screen: 'vendas',
      color: colors.warning,
    },
    {
      title: 'Caixa',
      icon: 'dollar',
      screen: 'caixa',
      color: colors.success,
    },
    {
      title: 'Relatórios',
      icon: 'bar-chart',
      screen: 'relatorio',
      color: colors.danger,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <FontAwesome name="cut" size={40} color={colors.primary} />
        <View style={styles.headerText}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>Bem-vindo à Barbearia</Text>
          {funcionario && (
            <Text style={[styles.userText, { color: colors.secondary }]}>
              {funcionario.nome} - Matrícula: {funcionario.matricula}
            </Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.menuContainer}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>Menu Principal</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={() => {
                  // @ts-ignore
                  router.push(`/(tabs)/${item.screen}`);
                }}
              >
                <FontAwesome name={item.icon as any} size={30} color={item.color} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.danger }]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color="white" />
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 20,
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
  headerText: {
    marginLeft: 15,
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userText: {
    fontSize: 14,
    marginTop: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  menuContainer: {
    padding: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  logoutContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});