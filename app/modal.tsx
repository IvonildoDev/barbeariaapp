import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ModalScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const abrirLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <FontAwesome name="info-circle" size={30} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Sobre o App</Text>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.appInfo}>
          <FontAwesome name="scissors" size={40} color={colors.primary} />
          <Text style={[styles.appName, { color: colors.text }]}>BarbeariaApp</Text>
          <Text style={[styles.appVersion, { color: colors.secondary }]}>Versão 1.0.0</Text>
        </View>
        <Text style={[styles.appDescription, { color: colors.text }]}>
          Sistema completo de gestão para barbearias, desenvolvido para facilitar o controle de clientes,
          agendamentos, caixa e relatórios de forma simples e eficiente.
        </Text>
      </View>

      <View style={[styles.featuresCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <FontAwesome name="star" size={20} color={colors.primary} /> Funcionalidades
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <FontAwesome name="user-plus" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Cadastro de Clientes</Text>
              <Text style={[styles.featureDesc, { color: colors.secondary }]}>Gerencie o cadastro completo dos seus clientes</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <FontAwesome name="calendar" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Agendamento de Serviços</Text>
              <Text style={[styles.featureDesc, { color: colors.secondary }]}>Agende cortes, barba e outros serviços</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <FontAwesome name="dollar" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Controle de Caixa</Text>
              <Text style={[styles.featureDesc, { color: colors.secondary }]}>Acompanhe entradas e saídas do caixa</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <FontAwesome name="bar-chart" size={24} color={colors.primary} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Relatórios Detalhados</Text>
              <Text style={[styles.featureDesc, { color: colors.secondary }]}>Visualize métricas e relatórios do negócio</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.devCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <FontAwesome name="code" size={20} color={colors.primary} /> Desenvolvido por
        </Text>

        <View style={styles.devInfo}>
          <FontAwesome name="user" size={30} color={colors.primary} />
          <View style={styles.devText}>
            <Text style={[styles.devName, { color: colors.text }]}>Equipe de Desenvolvimento</Text>
            <Text style={[styles.devRole, { color: colors.secondary }]}>React Native & TypeScript</Text>
          </View>
        </View>

        <Text style={[styles.devDescription, { color: colors.text }]}>
          Aplicativo desenvolvido com as melhores práticas de desenvolvimento mobile,
          utilizando React Native, Expo e TypeScript para uma experiência nativa e performática.
        </Text>
      </View>

      <View style={[styles.contactCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <FontAwesome name="envelope" size={20} color={colors.primary} /> Contato & Suporte
        </Text>

        <TouchableOpacity
          style={[styles.contactButton, { borderColor: colors.primary }]}
          onPress={() => abrirLink('mailto:suporte@barbeariaapp.com')}
        >
          <FontAwesome name="envelope" size={20} color={colors.primary} />
          <Text style={[styles.contactText, { color: colors.primary }]}>suporte@barbeariaapp.com</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactButton, { borderColor: colors.primary }]}
          onPress={() => abrirLink('tel:+5511999999999')}
        >
          <FontAwesome name="phone" size={20} color={colors.primary} />
          <Text style={[styles.contactText, { color: colors.primary }]}>(11) 99999-9999</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.footerCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.secondary }]}>
          © 2024 BarbeariaApp. Todos os direitos reservados.
        </Text>
        <Text style={[styles.footerVersion, { color: colors.tabIconDefault }]}>
          Versão 1.0.0 - Outubro 2024
        </Text>
      </View>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ScrollView>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  infoCard: {
    margin: 20,
    padding: 20,
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
  appInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  appVersion: {
    fontSize: 16,
  },
  appDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  featuresCard: {
    margin: 20,
    padding: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  featureList: {
    gap: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 14,
  },
  devCard: {
    margin: 20,
    padding: 20,
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
  devInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  devText: {
    marginLeft: 15,
  },
  devName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  devRole: {
    fontSize: 14,
  },
  devDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  contactCard: {
    margin: 20,
    padding: 20,
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
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '600',
  },
  footerCard: {
    margin: 20,
    padding: 20,
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
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  footerVersion: {
    fontSize: 12,
    textAlign: 'center',
  },
});
