// src/screens/LoginScreen.js - Exemplo de implementação
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { auth, db, doc, setDoc, getDoc } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import PostAuthHandler from "../components/PostAuthHandler";
import { UserValidationService } from "../services/UserValidationService";

const LoginScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Estados do formulário
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Estados de controle
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthComplete, setIsAuthComplete] = useState(false);
  const [needsCompleteProfile, setNeedsCompleteProfile] = useState(false);

  // Verifica se o usuário já está logado ao abrir a tela
  useEffect(() => {
    const checkCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        console.log("👤 Usuário já logado:", user.email);
        const validation = await UserValidationService.validateUser();

        if (validation.isValid) {
          // Usuário válido, pode ser redirecionado imediatamente
          setIsAuthComplete(true);
        } else if (validation.reason === "MISSING_REQUIRED_FIELDS") {
          // Precisa completar o perfil
          setNeedsCompleteProfile(true);
          const userData = validation.userData || {};
          setName(userData.name || "");
          setPhone(userData.phone || "");
          setEmail(user.email || "");
        }
      }
    };

    checkCurrentUser();
  }, []);

  // Função para login
  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔑 Tentando fazer login...");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      console.log("✅ Login bem-sucedido:", userCredential.user.email);

      // Valida se o usuário tem todos os dados necessários
      const validation = await UserValidationService.validateUser();

      if (validation.isValid) {
        // Usuário completo, pode prosseguir
        setIsAuthComplete(true);
      } else if (validation.reason === "MISSING_REQUIRED_FIELDS") {
        // Precisa completar o perfil
        Alert.alert(
          "Perfil Incompleto",
          "Por favor, complete seu perfil para continuar.",
          [{ text: "OK", onPress: () => setNeedsCompleteProfile(true) }]
        );
      } else {
        throw new Error("Dados do usuário incompletos");
      }
    } catch (error) {
      console.error("❌ Erro no login:", error);

      let errorMessage = "Erro ao fazer login. Tente novamente.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Muitas tentativas. Tente novamente mais tarde.";
      }

      Alert.alert("Erro", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para cadastro
  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !name.trim() || !phone.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setIsLoading(true);
      console.log("📝 Criando nova conta...");

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      console.log("✅ Conta criada:", user.email);

      // Salva dados do usuário no Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        createdAt: new Date(),
        uid: user.uid,
      });

      console.log("✅ Dados do usuário salvos no Firestore");

      // Limpa o cache de validação para forçar nova validação
      await UserValidationService.clearValidationCache();

      Alert.alert("Sucesso!", "Conta criada com sucesso!", [
        { text: "OK", onPress: () => setIsAuthComplete(true) },
      ]);
    } catch (error) {
      console.error("❌ Erro no cadastro:", error);

      let errorMessage = "Erro ao criar conta. Tente novamente.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      }

      Alert.alert("Erro", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para completar perfil de usuário já logado
  const handleCompleteProfile = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Erro", "Por favor, preencha nome e telefone.");
      return;
    }

    try {
      setIsLoading(true);
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      console.log("📝 Completando perfil do usuário...");

      // Atualiza dados no Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: name.trim(),
          email: user.email,
          phone: phone.trim(),
          updatedAt: new Date(),
          uid: user.uid,
        },
        { merge: true }
      );

      console.log("✅ Perfil completado com sucesso");

      // Limpa cache para forçar nova validação
      await UserValidationService.clearValidationCache();

      Alert.alert("Sucesso!", "Perfil completado com sucesso!", [
        {
          text: "OK",
          onPress: () => {
            setNeedsCompleteProfile(false);
            setIsAuthComplete(true);
          },
        },
      ]);
    } catch (error) {
      console.error("❌ Erro ao completar perfil:", error);
      Alert.alert("Erro", "Erro ao completar perfil. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para redirecionamento pós-autenticação
  const handleRedirectComplete = (result) => {
    if (result.success) {
      console.log("✅ Redirecionamento completo para:", result.navigatedTo);
    } else {
      console.error("❌ Erro no redirecionamento:", result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {needsCompleteProfile
              ? "Complete seu Perfil"
              : isSignUp
                ? "Criar Conta"
                : "Fazer Login"}
          </Text>

          {(isSignUp || needsCompleteProfile) && (
            <TextInput
              style={styles.input}
              placeholder="Nome completo *"
              value={name}
              onChangeText={setName}
              editable={!isLoading}
            />
          )}

          {!needsCompleteProfile && (
            <TextInput
              style={styles.input}
              placeholder="Email *"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
          )}

          {(isSignUp || needsCompleteProfile) && (
            <TextInput
              style={styles.input}
              placeholder="Telefone *"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              editable={!isLoading}
            />
          )}

          {!needsCompleteProfile && (
            <TextInput
              style={styles.input}
              placeholder="Senha *"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
          )}

          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Confirmar senha *"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLoading}
            />
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={
              needsCompleteProfile
                ? handleCompleteProfile
                : isSignUp
                  ? handleSignUp
                  : handleSignIn
            }
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {needsCompleteProfile
                  ? "Completar Perfil"
                  : isSignUp
                    ? "Criar Conta"
                    : "Entrar"}
              </Text>
            )}
          </TouchableOpacity>

          {!needsCompleteProfile && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>
                {isSignUp
                  ? "Já tem conta? Fazer login"
                  : "Não tem conta? Criar conta"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Componente para gerenciar redirecionamento pós-autenticação */}
      <PostAuthHandler
        isAuthenticationComplete={isAuthComplete}
        onRedirectComplete={handleRedirectComplete}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#6a5acd",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    padding: 10,
    alignItems: "center",
  },
  linkText: {
    color: "#6a5acd",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
