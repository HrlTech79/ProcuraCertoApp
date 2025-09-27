// src/hooks/useUserValidation.js
import { useState, useCallback } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserValidationService } from "../services/UserValidationService";

export const useUserValidation = (navigation) => {
  const [isValidating, setIsValidating] = useState(false);
  const [showRegistrationPopup, setShowRegistrationPopup] = useState(false);
  const [pendingProvider, setPendingProvider] = useState(null);

  /**
   * Executa validação e navega baseado no resultado
   * @param {Object} targetProvider - Dados do profissional selecionado
   * @param {Object} options - Opções de configuração
   */
  const validateAndNavigate = useCallback(
    async (
      targetProvider,
      options = {
        targetScreen: "Profile",
        showPopupIfNeeded: true,
        showAlert: true,
        saveProviderForLater: true,
        fallbackScreen: "LoginScreen",
      }
    ) => {
      try {
        setIsValidating(true);
        console.log(
          "🎯 Iniciando validação para navegação:",
          targetProvider?.display_name
        );

        const validation = await UserValidationService.validateUser();

        if (validation.isValid) {
          // Usuário válido - navega diretamente
          console.log("✅ Navegando para tela alvo:", options.targetScreen);
          navigation.navigate(options.targetScreen, {
            provider: targetProvider,
            userData: validation.userData,
          });

          return {
            success: true,
            navigated: true,
            reason: validation.reason,
          };
        } else {
          // Usuário inválido - decide entre popup ou alert baseado na opção
          if (options.showPopupIfNeeded && !options.showAlert) {
            // Modo popup (versão original)
            console.log("📋 Abrindo popup de cadastro rápido");
            setPendingProvider(targetProvider);
            setShowRegistrationPopup(true);
          } else if (options.showAlert) {
            // Modo alert (nova versão)
            const alertTitle =
              validation.reason === "NOT_AUTHENTICATED"
                ? "Login Necessário"
                : "Cadastro Incompleto";

            const alertMessage =
              validation.reason === "NOT_AUTHENTICATED"
                ? "Para visualizar o perfil dos profissionais, você precisa fazer login."
                : validation.reason === "MISSING_REQUIRED_FIELDS"
                  ? `Para continuar, complete seu cadastro com: ${validation.missingFields?.join(", ")}`
                  : "Para visualizar o perfil dos profissionais, você precisa completar seu cadastro com nome, email e telefone.";

            Alert.alert(alertTitle, alertMessage, [
              {
                text: "Cancelar",
                style: "cancel",
              },
              {
                text:
                  validation.reason === "NOT_AUTHENTICATED"
                    ? "Fazer Login"
                    : "Completar Cadastro",
                onPress: async () => {
                  // Salva provider para usar após login/cadastro
                  if (options.saveProviderForLater && targetProvider) {
                    await AsyncStorage.setItem(
                      "@selected_provider",
                      JSON.stringify(targetProvider)
                    );
                  }

                  navigation.navigate(options.fallbackScreen, {
                    returnTo: options.targetScreen,
                    provider: targetProvider,
                  });
                },
              },
            ]);
          }

          return {
            success: false,
            navigated: false,
            reason: validation.reason,
            missingFields: validation.missingFields,
          };
        }
      } catch (error) {
        console.error("❌ Erro durante validação:", error);

        if (options.showAlert) {
          Alert.alert("Erro", "Ocorreu um erro. Tente novamente.");
        }

        return {
          success: false,
          navigated: false,
          error: error.message,
        };
      } finally {
        setIsValidating(false);
      }
    },
    [navigation]
  );

  /**
   * Callback para quando o cadastro é completado
   */
  const handleRegistrationComplete = useCallback(
    async (result) => {
      if (result.success) {
        console.log("✅ Cadastro completado com sucesso");

        // Navega para o perfil do profissional
        if (result.selectedProvider) {
          navigation.navigate("Profile", {
            provider: result.selectedProvider,
            userData: result.userData,
            fromRegistration: true,
          });
        }

        // Limpa estado
        setPendingProvider(null);
      } else {
        console.error("❌ Erro no cadastro:", result.error);
      }
    },
    [navigation]
  );

  /**
   * Fecha popup de cadastro
   */
  const handleCloseRegistrationPopup = useCallback(() => {
    setShowRegistrationPopup(false);
    setPendingProvider(null);
  }, []);

  /**
   * Valida usuário sem navegar (apenas retorna resultado)
   */
  const validateUserOnly = useCallback(async () => {
    try {
      setIsValidating(true);
      return await UserValidationService.validateUser();
    } catch (error) {
      console.error("❌ Erro na validação:", error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Força revalidação do usuário
   */
  const forceRevalidation = useCallback(async () => {
    try {
      setIsValidating(true);
      return await UserValidationService.forceRevalidation();
    } catch (error) {
      console.error("❌ Erro na revalidação:", error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Limpa cache de validação
   */
  const clearValidation = useCallback(async () => {
    try {
      await UserValidationService.clearValidationCache();
      console.log("✅ Cache de validação limpo");
    } catch (error) {
      console.error("❌ Erro ao limpar cache:", error);
    }
  }, []);

  return {
    isValidating,
    showRegistrationPopup,
    pendingProvider,
    validateAndNavigate,
    validateUserOnly,
    forceRevalidation,
    clearValidation,
    handleRegistrationComplete,
    handleCloseRegistrationPopup,
  };
};
