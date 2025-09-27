// src/screens/SplashScreen.js
import React, { useEffect } from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Navega para a tela de Pesquisa após 3 segundos
    const timer = setTimeout(() => {
      navigation.replace("Search");
    }, 3000); // 3 segundos

    return () => clearTimeout(timer); // Limpa o timer
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/PROCURA_CERTO.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>PROCURA CERTO</Text>
        <Text style={styles.taglineText}>Sua busca, simplificada.</Text>
      </View>
      <View style={styles.bottomArc}>
        <Text style={styles.bottomText}>GET STARTED</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -50, // Ajuste para centralizar visualmente
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    letterSpacing: 1,
  },
  taglineText: {
    fontSize: 16,
    color: "#666",
  },
  bottomArc: {
    width: "120%",
    height: 200,
    backgroundColor: "#3b82f6",
    borderTopLeftRadius: 300,
    borderTopRightRadius: 300,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: -100, // Move para baixo para exibir apenas a parte superior
    paddingTop: 100, // Ajusta o texto para a área visível
  },
  bottomText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SplashScreen;
