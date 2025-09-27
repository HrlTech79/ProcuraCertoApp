// src/services/UserValidationService.js
import AsyncStorage from "@react-native-async-storage/async-storage";

export class UserValidationService {
  static USER_DATA_KEY = "@user_data";
  static USER_VALIDATED_KEY = "@user_validated";
  static CURRENT_USER_UID_KEY = "@current_user_uid";

  /**
   * Valida se o usuário tem dados cadastrados (sem Firebase Auth)
   * @returns {Promise<{isValid: boolean, userData: object|null, requiresRegistration: boolean}>}
   */
  static async validateUser() {
    try {
      console.log("🔍 Iniciando validação do usuário...");

      // Verifica cache local primeiro
      const cachedValidation = await AsyncStorage.getItem(
        this.USER_VALIDATED_KEY
      );
      const cachedUserData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      const cachedUid = await AsyncStorage.getItem(this.CURRENT_USER_UID_KEY);

      if (cachedValidation === "true" && cachedUserData && cachedUid) {
        console.log("✅ Validação em cache encontrada");

        const userData = JSON.parse(cachedUserData);

        // Valida campos obrigatórios
        const requiredFields = ["name", "email", "phone"];
        const missingFields = requiredFields.filter(
          (field) =>
            !userData[field] || userData[field].toString().trim() === ""
        );

        if (missingFields.length === 0) {
          console.log("✅ Usuário validado via cache:", {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
          });

          return {
            isValid: true,
            userData,
            requiresRegistration: false,
            reason: "CACHED_VALIDATION",
          };
        } else {
          console.log("❌ Dados em cache incompletos:", missingFields);
          // Limpa cache inválido
          await this.clearValidationCache();
        }
      }

      // Se chegou até aqui, não tem dados válidos
      console.log("❌ Usuário não possui cadastro válido");
      return {
        isValid: false,
        userData: null,
        requiresRegistration: true,
        reason: "NO_REGISTRATION",
      };
    } catch (error) {
      console.error("❌ Erro durante validação:", error);
      return {
        isValid: false,
        userData: null,
        requiresRegistration: true,
        reason: "VALIDATION_ERROR",
        error: error.message,
      };
    }
  }

  /**
   * Salva dados do usuário no cache local
   * @param {Object} userData - Dados do usuário
   */
  static async saveUserData(userData) {
    try {
      const userId =
        userData.id ||
        `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const userDataToSave = {
        ...userData,
        id: userId,
        updatedAt: new Date().toISOString(),
      };

      await Promise.all([
        AsyncStorage.setItem(
          this.USER_DATA_KEY,
          JSON.stringify(userDataToSave)
        ),
        AsyncStorage.setItem(this.USER_VALIDATED_KEY, "true"),
        AsyncStorage.setItem(this.CURRENT_USER_UID_KEY, userId),
      ]);

      console.log("✅ Dados do usuário salvos com sucesso");
      return { success: true, userData: userDataToSave };
    } catch (error) {
      console.error("❌ Erro ao salvar dados:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpa cache de validação
   */
  static async clearValidationCache() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.USER_VALIDATED_KEY),
        AsyncStorage.removeItem(this.CURRENT_USER_UID_KEY),
        AsyncStorage.removeItem(this.USER_DATA_KEY),
      ]);
      console.log("🗑️ Cache de validação limpo");
    } catch (error) {
      console.error("❌ Erro ao limpar cache:", error);
    }
  }

  /**
   * Força revalidação removendo cache
   */
  static async forceRevalidation() {
    await this.clearValidationCache();
    return await this.validateUser();
  }

  /**
   * Obtém dados do usuário atual
   */
  static async getCurrentUserData() {
    try {
      const cachedUserData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      if (cachedUserData) {
        return JSON.parse(cachedUserData);
      }
      return null;
    } catch (error) {
      console.error("❌ Erro ao obter dados do usuário:", error);
      return null;
    }
  }

  /**
   * Atualiza dados específicos do usuário
   */
  static async updateUserData(updates) {
    try {
      const currentData = await this.getCurrentUserData();
      if (!currentData) {
        throw new Error("Nenhum usuário encontrado para atualizar");
      }

      const updatedData = {
        ...currentData,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        this.USER_DATA_KEY,
        JSON.stringify(updatedData)
      );
      console.log("✅ Dados do usuário atualizados");
      return { success: true, userData: updatedData };
    } catch (error) {
      console.error("❌ Erro ao atualizar dados:", error);
      return { success: false, error: error.message };
    }
  }
}
