// src/screens/RulesScreen.js
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";

const RulesScreen = () => {
  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Text style={styles.title}>
          Regras de Uso do Aplicativo "Procura Certo"
        </Text>
        <Text style={styles.subtitle}>
          Baseadas na Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018
        </Text>

        <Text style={styles.sectionTitle}>1. Coleta de Dados</Text>
        <Text style={styles.text}>
          Coletamos as seguintes informações pessoais para fins de identificação
          e comunicação: Nome completo, e-mail, telefone, bairro, cidade e
          estado de residência. Esses dados são essenciais para que possamos
          fornecer os serviços do aplicativo.
        </Text>

        <Text style={styles.sectionTitle}>2. Finalidade do Tratamento</Text>
        <Text style={styles.text}>
          Os dados coletados têm como finalidade principal a identificação do
          usuário para permitir o acesso aos dados de contato dos prestadores de
          serviço e, também, para fins de comunicação interna, como envio de
          notificações e avisos importantes.
        </Text>

        <Text style={styles.sectionTitle}>3. Consentimento</Text>
        <Text style={styles.text}>
          Ao utilizar o aplicativo e preencher o formulário de cadastro, você
          concorda explicitamente com a coleta e o tratamento dos seus dados
          pessoais para os fins descritos neste documento.
        </Text>

        <Text style={styles.sectionTitle}>4. Compartilhamento de Dados</Text>
        <Text style={styles.text}>
          Seus dados de contato, como nome, e-mail e telefone, não serão
          compartilhados com terceiros sem sua autorização prévia e expressa. As
          informações de localização (bairro, cidade e estado) podem ser
          utilizadas de forma anonimizada para análises estatísticas e melhoria
          do serviço.
        </Text>

        <Text style={styles.sectionTitle}>5. Direitos do Titular de Dados</Text>
        <Text style={styles.text}>
          De acordo com a LGPD, você tem o direito de solicitar a qualquer
          momento:
          {"\n\n"}
          a) A confirmação da existência de tratamento dos seus dados;
          {"\n"}
          b) O acesso aos seus dados;
          {"\n"}
          c) A correção de dados incompletos, inexatos ou desatualizados;
          {"\n"}
          d) A anonimização, bloqueio ou eliminação de dados desnecessários ou
          excessivos;
          {"\n"}
          e) A revogação do consentimento, mediante manifestação expressa.
        </Text>

        <Text style={styles.sectionTitle}>6. Segurança</Text>
        <Text style={styles.text}>
          Empregamos medidas técnicas e organizacionais para proteger seus dados
          pessoais contra acessos não autorizados, perda, destruição ou
          alteração. No entanto, é importante lembrar que nenhuma transmissão de
          dados pela internet é 100% segura.
        </Text>

        <Text style={styles.lastUpdate}>
          Última atualização: 20 de agosto de 2025
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
    textAlign: "justify",
  },
  lastUpdate: {
    fontSize: 12,
    color: "#888",
    marginTop: 20,
    textAlign: "center",
  },
});

export default RulesScreen;
