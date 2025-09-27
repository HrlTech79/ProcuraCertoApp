// src/components/QuickRegistrationPopup.js
import React, { useState } from "react";
import {
  Modal,
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
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserValidationService } from "../services/UserValidationService";

const { width, height } = Dimensions.get("window");

const QuickRegistrationPopup = ({
  visible,
  onClose,
  onRegistrationComplete,
  selectedProvider = null,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Função para validar formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nome deve ter pelo menos 2 caracteres";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    } else if (formData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Telefone deve ter pelo menos 10 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para formatar telefone
  const formatPhone = (phone) => {
    const numbers = phone.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
  };

  // Função para salvar dados do usuário
  const handleSaveUser = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      console.log("💾 Salvando dados do usuário...");

      // Gera um ID único simples (pode usar uuid se disponível)
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const userData = {
        id: userId,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, ""), // Salva apenas números
        createdAt: new Date().toISOString(),
        isQuickRegistration: true,
      };

      // Salva no AsyncStorage (cache local)
      await AsyncStorage.setItem(
        UserValidationService.USER_DATA_KEY,
        JSON.stringify(userData)
      );
      await AsyncStorage.setItem(
        UserValidationService.USER_VALIDATED_KEY,
        "true"
      );
      await AsyncStorage.setItem(
        UserValidationService.CURRENT_USER_UID_KEY,
        userId
      );

      console.log("✅ Dados salvos com sucesso:", {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
      });

      Alert.alert(
        "Cadastro Realizado!",
        "Seus dados foram salvos com sucesso.",
        [
          {
            text: "OK",
            onPress: () => {
              // Limpa o formulário
              setFormData({ name: "", email: "", phone: "" });
              setErrors({});

              // Chama callback de sucesso
              if (onRegistrationComplete) {
                onRegistrationComplete({
                  success: true,
                  userData,
                  selectedProvider,
                });
              }

              // Fecha o popup
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error("❌ Erro ao salvar usuário:", error);
      Alert.alert(
        "Erro",
        "Não foi possível salvar seus dados. Tente novamente.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Função para lidar com mudanças nos campos
  const handleInputChange = (field, value) => {
    let processedValue = value;

    if (field === "phone") {
      processedValue = formatPhone(value);
    } else if (field === "email") {
      processedValue = value.toLowerCase();
    }

    setFormData((prev) => ({
      ...prev,
      [field]: processedValue,
    }));

    // Remove erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Função para fechar popup
  const handleClose = () => {
    if (isLoading) return;

    setFormData({ name: "", email: "", phone: "" });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.popup}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Cadastro Rápido</Text>
                <Text style={styles.subtitle}>
                  Preencha seus dados para visualizar o perfil do profissional
                </Text>
                {selectedProvider && (
                  <Text style={styles.providerInfo}>
                    📋 {selectedProvider.display_name}
                  </Text>
                )}
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Nome */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nome Completo *</Text>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Digite seu nome completo"
                    value={formData.name}
                    onChangeText={(value) => handleInputChange("name", value)}
                    editable={!isLoading}
                    autoCapitalize="words"
                  />
                  {errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email *</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Digite seu email"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange("email", value)}
                    editable={!isLoading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                {/* Telefone */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Telefone *</Text>
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange("phone", value)}
                    editable={!isLoading}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                  {errors.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.primaryButton,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleSaveUser}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Salvar e Continuar
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={handleClose}
                  disabled={isLoading}
                >
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  * Campos obrigatórios{"\n"}
                  Seus dados são salvos localmente e mantidos seguros.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  popup: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  providerInfo: {
    fontSize: 16,
    color: "#6a5acd",
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center",
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  inputError: {
    borderColor: "#e74c3c",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 12,
    marginTop: 5,
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#6a5acd",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#f0f0f0",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  footer: {
    marginTop: 15,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 16,
  },
});

export default QuickRegistrationPopup;
