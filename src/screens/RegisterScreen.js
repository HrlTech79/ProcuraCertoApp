// src/screens/RegisterScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  db,
  collection,
  setDoc,
  doc,
  createUserWithEmailAndPassword,
  auth,
} from "../services/firebase";
import { StatusBar } from "expo-status-bar";
import CustomModal from "../components/CustomModal";

const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !city ||
      !state ||
      !neighborhood
    ) {
      setModalMessage("Por favor, preencha todos os campos.");
      setModalVisible(true);
      return;
    }
    if (!agreed) {
      setModalMessage("Você deve concordar com as regras de uso.");
      setModalVisible(true);
      return;
    }

    setLoading(true);

    try {
      // 1. Cria o usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. Salva os dados do usuário no Firestore usando o UID como ID do documento
      const userRef = doc(collection(db, "users"), user.uid);
      await setDoc(userRef, {
        name: name,
        email: email.toLowerCase(),
        phone: phone,
        city: city,
        state: state,
        neighborhood: neighborhood,
        createdAt: new Date(),
      });
      setModalMessage(
        "Cadastro realizado com sucesso! Você será redirecionado para a tela inicial."
      );
      setModalVisible(true);
      navigation.navigate("Search");
    } catch (error) {
      console.error("Erro ao registrar usuário: ", error.message);
      let errorMessage = "Erro ao registrar. Tente novamente.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este e-mail já está em uso. Tente fazer login.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      }
      setModalMessage(errorMessage);
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Cadastre-se para Continuar</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome Completo"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Bairro"
        value={neighborhood}
        onChangeText={setNeighborhood}
      />
      <TextInput
        style={styles.input}
        placeholder="Cidade"
        value={city}
        onChangeText={setCity}
      />
      <TextInput
        style={styles.input}
        placeholder="Estado"
        value={state}
        onChangeText={setState}
      />

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={[styles.checkbox, agreed && styles.checkboxSelected]}
          onPress={() => setAgreed(!agreed)}
        />
        <Text style={styles.label}>
          Eu concordo com as
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("Rules")}
          >
            {" "}
            Regras de Uso
          </Text>
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Cadastrar</Text>
        )}
      </TouchableOpacity>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Atenção"
        message={modalMessage}
        showConfirmButton={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#555",
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: "#007BFF",
    borderColor: "#007BFF",
  },
  label: {
    fontSize: 16,
    flexShrink: 1, // Permite que o texto quebre a linha
  },
  link: {
    color: "#007BFF",
    fontWeight: "bold",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#007BFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default RegisterScreen;
