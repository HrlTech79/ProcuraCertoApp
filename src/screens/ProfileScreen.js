// src/screens/ProfileScreen.js - Versão com sistema de cadastro integrado
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// Serviço para gerenciar dados do usuário
const UserStorageService = {
  USER_DATA_KEY: "@user_registration_data",

  // Salva os dados do usuário
  async saveUserData(userData) {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error("Erro ao salvar dados do usuário:", error);
      return false;
    }
  },

  // Recupera os dados do usuário
  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Erro ao recuperar dados do usuário:", error);
      return null;
    }
  },

  // Remove os dados do usuário
  async clearUserData() {
    try {
      await AsyncStorage.removeItem(this.USER_DATA_KEY);
      return true;
    } catch (error) {
      console.error("Erro ao limpar dados do usuário:", error);
      return false;
    }
  },

  // Verifica se o usuário está cadastrado
  async isUserRegistered() {
    const userData = await this.getUserData();
    return userData && userData.name && userData.email && userData.phone;
  },
};

// Componente do formulário de cadastro
const RegistrationModal = ({ visible, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validações
    if (!formData.name.trim()) {
      Alert.alert("Erro", "Por favor, informe seu nome");
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert("Erro", "Por favor, informe seu email");
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert("Erro", "Por favor, informe seu telefone");
      return;
    }

    // Validação simples de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Erro", "Por favor, informe um email válido");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await UserStorageService.saveUserData(formData);
      if (success) {
        onSubmit(formData);
        setFormData({ name: "", email: "", phone: "" });
      } else {
        Alert.alert(
          "Erro",
          "Não foi possível salvar seus dados. Tente novamente."
        );
      }
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Cadastro Necessário</Text>
          <Text style={styles.modalSubtitle}>
            Para visualizar os contatos dos profissionais, precisamos de algumas
            informações:
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Seu nome completo"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            editable={!isSubmitting}
          />

          <TextInput
            style={styles.input}
            placeholder="Seu email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isSubmitting}
          />

          <TextInput
            style={styles.input}
            placeholder="Seu telefone"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            editable={!isSubmitting}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // Debug: Log dos parâmetros recebidos
  console.log("🔍 ProfileScreen - Parâmetros recebidos:", route.params);

  // Dados passados pela navegação com verificação de segurança
  const routeParams = route.params || {};
  const { provider, userData, fromRegistration = false } = routeParams;

  // Debug: Log específico do provider
  console.log("👤 ProfileScreen - Provider data:", provider);

  const [currentUserData, setCurrentUserData] = useState(null);
  const [isContactBlurred, setIsContactBlurred] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  // Função para gerar o ranking de estrelas
  const renderStars = (ranking) => {
    const totalStars = 5;
    const filledStars = Math.min(Math.max(ranking, 0), totalStars);
    const starIcons = [];
    for (let i = 0; i < filledStars; i++) {
      starIcons.push(
        <Text key={`star_filled_${i}`} style={styles.starIcon}>
          ⭐
        </Text>
      );
    }
    for (let i = filledStars; i < totalStars; i++) {
      starIcons.push(
        <Text key={`star_empty_${i}`} style={styles.starIcon}>
          ☆
        </Text>
      );
    }
    return starIcons;
  };

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const isRegistered = await UserStorageService.isUserRegistered();

        if (isRegistered) {
          const userData = await UserStorageService.getUserData();
          setCurrentUserData(userData);
          setIsContactBlurred(false);
        } else {
          setCurrentUserData(null);
          setIsContactBlurred(true);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        setIsContactBlurred(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();

    if (fromRegistration && currentUserData) {
      setTimeout(() => {
        Alert.alert(
          "Bem-vindo!",
          `Olá ${currentUserData.name}! Seu cadastro foi realizado com sucesso. Agora você pode visualizar os perfis dos profissionais.`,
          [{ text: "OK" }]
        );
      }, 500);
    }
  }, [fromRegistration]);

  // Função para lidar com o registro do usuário
  const handleUserRegistration = (userData) => {
    setCurrentUserData(userData);
    setIsContactBlurred(false);
    setShowRegistrationModal(false);

    Alert.alert(
      "Cadastro Realizado!",
      `Olá ${userData.name}! Agora você pode visualizar todos os contatos dos profissionais.`,
      [{ text: "OK" }]
    );
  };

  // Função para lidar com o desbloqueio do contato
  const handleUnlockContact = () => {
    setShowRegistrationModal(true);
  };

  const createContactHandler = (type, value) => {
    if (isContactBlurred) {
      return handleUnlockContact;
    }

    switch (type) {
      case "call":
        return () => {
          if (value) {
            const phoneNumber = `tel:${value}`;
            Linking.openURL(phoneNumber).catch(() => {
              Alert.alert("Erro", "Não foi possível fazer a ligação");
            });
          } else {
            Alert.alert("Aviso", "Telefone não disponível");
          }
        };
      case "email":
        return () => {
          if (value) {
            const emailUrl = `mailto:${value}`;
            Linking.openURL(emailUrl).catch(() => {
              Alert.alert("Erro", "Não foi possível abrir o email");
            });
          } else {
            Alert.alert("Aviso", "Email não disponível");
          }
        };
      case "whatsapp":
        return () => {
          if (value) {
            const message = "Encontrei seu anúncio no Procura Certo";
            const whatsappUrl = `whatsapp://send?phone=${value}&text=${encodeURIComponent(message)}`;
            Linking.openURL(whatsappUrl).catch(() => {
              Alert.alert(
                "Erro",
                "Não foi possível abrir o WhatsApp. Certifique-se de que o aplicativo está instalado."
              );
            });
          } else {
            Alert.alert("Aviso", "WhatsApp não disponível");
          }
        };
      case "site":
        return () => {
          if (value) {
            const siteUrl = value.startsWith("http")
              ? value
              : `https://${value}`;
            Linking.openURL(siteUrl).catch(() => {
              Alert.alert("Erro", "Não foi possível abrir o site");
            });
          } else {
            Alert.alert("Aviso", "Site não disponível");
          }
        };
      case "maps":
        return () => {
          const address = provider?.endereco || provider?.regiao;
          if (address) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
            Linking.openURL(url).catch(() => {
              Alert.alert(
                "Erro",
                "Não foi possível abrir o aplicativo de mapas."
              );
            });
          } else {
            Alert.alert("Aviso", "Endereço ou região não disponíveis.");
          }
        };
      default:
        return () => {};
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Verificação de segurança para dados do provider
  if (!provider || typeof provider !== "object") {
    console.error("❌ ProfileScreen - Provider inválido:", provider);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erro ao carregar perfil</Text>
        <Text style={styles.errorMessage}>
          Os dados do profissional não foram encontrados ou são inválidos.
        </Text>
        <Text style={styles.errorDetails}>
          Dados recebidos: {JSON.stringify(routeParams, null, 2)}
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        onPress: async () => {
          await UserStorageService.clearUserData();
          setCurrentUserData(null);
          setIsContactBlurred(true);
          Alert.alert("Sucesso", "Você foi deslogado com sucesso.");
        },
      },
    ]);
  };

  // Verificação de segurança para dados do provider
  if (!provider || typeof provider !== "object") {
    console.error("❌ ProfileScreen - Provider inválido:", provider);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erro ao carregar perfil</Text>
        <Text style={styles.errorMessage}>
          Os dados do profissional não foram encontrados ou são inválidos.
        </Text>
        <Text style={styles.errorDetails}>
          Dados recebidos: {JSON.stringify(routeParams, null, 2)}
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6a5acd" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  // Segunda verificação após loading para garantir que provider ainda existe
  if (!provider || typeof provider !== "object") {
    console.error(
      "❌ ProfileScreen - Provider perdido após loading:",
      provider
    );
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erro ao carregar perfil</Text>
        <Text style={styles.errorMessage}>
          Os dados do profissional foram perdidos durante o carregamento.
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Segunda verificação após loading para garantir que provider ainda existe
  if (!provider || typeof provider !== "object") {
    console.error(
      "❌ ProfileScreen - Provider perdido após loading:",
      provider
    );
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erro ao carregar perfil</Text>
        <Text style={styles.errorMessage}>
          Os dados do profissional foram perdidos durante o carregamento.
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header do usuário logado */}
        {currentUserData && (
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>
                Olá, {currentUserData.name}! 👋
              </Text>
              <Text style={styles.userEmail}>{currentUserData.email}</Text>
            </View>
          </View>
        )}

        {/* Header do profissional */}
        <View style={styles.providerHeader}>
          <View style={styles.providerImageContainer}>
            {provider?.photo_url ? (
              <Image
                source={{ uri: provider.photo_url }}
                style={styles.providerImage}
              />
            ) : (
              <View style={styles.providerImagePlaceholder}>
                <Text style={styles.providerImagePlaceholderText}>
                  {provider?.display_name?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>
              {provider?.display_name || "Nome não informado"}
            </Text>
            <Text style={styles.providerService}>
              {provider?.tipo_servico || "Serviço não informado"}
            </Text>
            {/* Mostra o ranking de estrelas */}
            <View style={styles.ratingContainer}>
              {renderStars(provider?.ranking || 0)}
            </View>
          </View>
        </View>

        {/* Informações de Contato */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informações de Contato</Text>

          {/* Telefone */}
          <TouchableOpacity
            style={styles.contactItem}
            onPress={createContactHandler("call", provider?.telefone)}
          >
            <Text style={styles.contactIcon}>📞</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Telefone</Text>
              <Text
                style={[
                  styles.contactValue,
                  isContactBlurred && styles.blurredText,
                ]}
              >
                {isContactBlurred
                  ? "••• ••• ••••"
                  : provider?.telefone || "Contato não registrado"}
              </Text>
            </View>
            {provider?.telefone && (
              <Text style={styles.contactAction}>Ligar</Text>
            )}
            {isContactBlurred && <View style={styles.blurOverlay} />}
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={styles.contactItem}
            onPress={createContactHandler("email", provider?.email)}
          >
            <Text style={styles.contactIcon}>📧</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text
                style={[
                  styles.contactValue,
                  isContactBlurred && styles.blurredText,
                ]}
              >
                {isContactBlurred
                  ? "••••••@••••••.com"
                  : provider?.email || "Contato não registrado"}
              </Text>
            </View>
            {provider?.email && <Text style={styles.contactAction}>Email</Text>}
            {isContactBlurred && <View style={styles.blurOverlay} />}
          </TouchableOpacity>

          {/* WhatsApp */}
          <TouchableOpacity
            style={styles.contactItem}
            onPress={createContactHandler("whatsapp", provider?.whatsapp)}
          >
            <FontAwesome
              name="whatsapp"
              size={25}
              color="#25D366"
              style={styles.contactIcon}
            />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text
                style={[
                  styles.contactValue,
                  isContactBlurred && styles.blurredText,
                ]}
              >
                {isContactBlurred
                  ? "••• ••• ••••"
                  : provider?.whatsapp || "Contato não registrado"}
              </Text>
            </View>
            {provider?.whatsapp && (
              <Text style={styles.contactAction}>Enviar Mensagem</Text>
            )}
            {isContactBlurred && <View style={styles.blurOverlay} />}
          </TouchableOpacity>

          {/* Site */}
          <TouchableOpacity
            style={styles.contactItem}
            onPress={createContactHandler("site", provider?.site)}
          >
            <Text style={styles.contactIcon}>🌐</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Site</Text>
              <Text
                style={[
                  styles.contactValue,
                  isContactBlurred && styles.blurredText,
                ]}
              >
                {isContactBlurred
                  ? "www.••••••.com"
                  : provider?.site || "Contato não registrado"}
              </Text>
            </View>
            {provider?.site && (
              <Text style={styles.contactAction}>Visitar</Text>
            )}
            {isContactBlurred && <View style={styles.blurOverlay} />}
          </TouchableOpacity>

          {/* Endereço */}
          <TouchableOpacity
            style={styles.contactItem}
            onPress={createContactHandler("maps", provider?.endereco)}
          >
            <FontAwesome
              name="map-marker"
              size={25}
              color="#e74c3c"
              style={styles.contactIcon}
            />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Endereço</Text>
              <Text
                style={[
                  styles.contactValue,
                  isContactBlurred && styles.blurredText,
                ]}
              >
                {isContactBlurred
                  ? "•••••••••••••••••"
                  : provider?.endereco || "Contato não registrado"}
              </Text>
            </View>
            {provider?.endereco && (
              <Text style={styles.contactAction}>Ver Rota</Text>
            )}
            {isContactBlurred && <View style={styles.blurOverlay} />}
          </TouchableOpacity>
        </View>

        {/* Descrição */}
        {provider?.descricao && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Sobre o Profissional</Text>
            <Text style={styles.description}>{provider.descricao}</Text>
          </View>
        )}

        {/* Botão de voltar */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoBack}
          >
            <Text style={styles.secondaryButtonText}>Voltar à Busca</Text>
          </TouchableOpacity>
        </View>

        {/* Footer com info do usuário */}
        {currentUserData && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Logado como: {currentUserData.name} • {currentUserData.phone}
            </Text>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modal de Registro */}
        <RegistrationModal
          visible={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          onSubmit={handleUserRegistration}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    color: "#6a5acd",
    fontSize: 16,
  },
  userHeader: {
    backgroundColor: "#6a5acd",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userEmail: {
    color: "#e0e0e0",
    fontSize: 14,
    marginTop: 2,
  },
  editButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  providerHeader: {
    backgroundColor: "#fff",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerImageContainer: {
    marginRight: 15,
  },
  providerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  providerImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6a5acd",
    justifyContent: "center",
    alignItems: "center",
  },
  providerImagePlaceholderText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  providerService: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignSelf: "flex-start",
  },
  starIcon: {
    fontSize: 16,
    color: "#ffc107",
  },
  infoSection: {
    backgroundColor: "#fff",
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    position: "relative",
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
  },
  whatsappIcon: {
    width: 20,
    height: 20,
    marginRight: 15,
    tintColor: "#25D366",
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    color: "#333",
  },
  blurredText: {
    color: "#999",
  },
  contactAction: {
    color: "#6a5acd",
    fontWeight: "600",
    fontSize: 14,
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    zIndex: 1,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  actionSection: {
    backgroundColor: "#fff",
    marginTop: 10,
    padding: 20,
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    backgroundColor: "#fff",
    marginTop: 10,
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 10,
  },
  logoutText: {
    color: "#e74c3c",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  // Estilos para tela de erro
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 10,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  errorButton: {
    backgroundColor: "#6a5acd",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorDetails: {
    fontSize: 12,
    color: "#999",
    textAlign: "left",
    marginBottom: 20,
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
    fontFamily: "monospace",
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#6a5acd",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileScreen;
