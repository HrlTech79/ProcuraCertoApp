// src/components/DisplayCard.js/
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";

/**
 * Componente para exibir um card de destaque de prestador de serviço.
 * @param {object} props - Propriedades do componente.
 * @param {object} props.item - Objeto do prestador com dados como nome, serviço, cidade, etc.
 * @param {function} props.onPress - Função para ser executada ao pressionar o card.
 */
const DisplayCard = ({ item, onPress }) => {
  // Define uma imagem de perfil padrão caso não haja uma URL fornecida.
  const profileImage = item.photo_url
    ? { uri: item.photo_url }
    : { uri: "../../assets/icon.png" }; // Placeholder para "Procura Certo"

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={profileImage} style={styles.profileImage} />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.display_name}</Text>
        <Text style={styles.service}>{item.tipo_servico}</Text>
        <Text style={styles.city}>{item.regiao}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 130,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 0,
    marginTop: 5,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#53C7BA",
  },
  infoContainer: {
    alignItems: "center",
  },
  name: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  service: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginTop: 2,
  },
  city: {
    fontSize: 9,
    color: "#999",
    textAlign: "center",
    marginTop: 2,
  },
});

export default DisplayCard;
