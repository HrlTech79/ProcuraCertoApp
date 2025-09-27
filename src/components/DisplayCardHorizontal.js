// src/components/DisplayCardHorizontal.js

// Importa o React da biblioteca 'react'
import React, { useState } from "react";
// Importa os componentes de interface do 'react-native'
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

const DisplayCardHorizontal = ({ item, onPress }) => {
  const [imageError, setImageError] = useState(false);

  // Log para debug
  console.log("DisplayCardHorizontal renderizando item:", {
    id: item?.id,
    display_name: item?.display_name,
    tipo_servico: item?.tipo_servico,
    logo: item?.logo,
  });

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Image
        // Verifica se o item.logo existe e não houve erro de carregamento
        source={
          item?.logo && !imageError
            ? { uri: item.logo }
            : require("../../assets/PROCURA_CERTO.png")
        }
        style={styles.logo}
        onError={() => {
          console.log("Erro ao carregar imagem:", item?.logo);
          setImageError(true);
        }}
        onLoad={() => {
          console.log("Imagem carregada com sucesso:", item?.logo);
        }}
      />
      <View style={styles.textContainer}>
        <Text style={styles.displayName} numberOfLines={2}>
          {item?.display_name || "Nome não disponível"}
        </Text>
        <Text style={styles.serviceType} numberOfLines={1}>
          {item?.tipo_servico || "Serviço não especificado"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 180, // Largura fixa para o cálculo do scroll
    height: 100,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginRight: 15, // Margin fixa
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: "#f0f0f0", // Background para quando a imagem não carrega
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  displayName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    flexWrap: "wrap",
  },
  serviceType: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});

export default DisplayCardHorizontal;
