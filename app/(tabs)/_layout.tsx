import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '@/components/AuthContext';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { initDatabase } from '@/services/database';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

function HeaderTitle() {
  const colorScheme = useColorScheme();
  const { funcionario } = useAuth();
  const colors = Colors[colorScheme ?? 'light'];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!funcionario) {
    return (
      <Text style={{ fontSize: 16, color: colors.text }}>
        Barbearia
      </Text>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
      }}>
        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
          {getInitials(funcionario.nome)}
        </Text>
      </View>
      <View>
        <Text style={{ fontSize: 12, color: colors.secondary, marginBottom: 2 }}>
          {getGreeting()}!
        </Text>
        <Text style={{ fontSize: 14, color: colors.text, fontWeight: '600' }}>
          {funcionario.nome}
        </Text>
        <Text style={{ fontSize: 10, color: colors.tabIconDefault }}>
          Matrícula: {funcionario.matricula}
        </Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { funcionario } = useAuth();

  useEffect(() => {
    initDatabase().catch(error => {
      console.error('Erro ao inicializar banco de dados:', error);
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        headerTitle: () => <HeaderTitle />,
        headerRight: () => (
          <Link href="/modal" asChild>
            <Pressable>
              {({ pressed }) => (
                <FontAwesome
                  name="info-circle"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>
        ),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cadastro',
          tabBarIcon: ({ color }) => <TabBarIcon name="user-plus" color={color} />,
        }}
      />
      <Tabs.Screen
        name="agendamento"
        options={{
          title: 'Agendamento',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="produtos"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="vendas"
        options={{
          title: 'Vendas',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-bag" color={color} />,
        }}
      />
      <Tabs.Screen
        name="caixa"
        options={{
          title: 'Caixa',
          tabBarIcon: ({ color }) => <TabBarIcon name="dollar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="relatorio"
        options={{
          title: 'Relatório',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="funcionarios"
        options={{
          title: 'Funcionários',
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
        }}
      />
    </Tabs>
  );
}
