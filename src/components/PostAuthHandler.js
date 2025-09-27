// src/components/PostAuthHandler.js
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserValidationService } from "../services/UserValidationService";

/**
 * Componente para ser usado em telas de login/cadastro
 * para redirecionar o usuário após autenticação bem-sucedida
 */
const PostAuthHandler = ({
  isAuthenticationComplete = false,
  onRedirectComplete = null,
}) => {
  const navigation = useNavigation();

  useEffect(() => {
    if (!isAuthenticationComplete) return;

    const handlePostAuth = async () => {
      try {
        console.log("📋 Iniciando processo pós-autenticação...");

        // 1. Força revalidação para limpar cache antigo
        await UserValidationService.forceRevalidation();

        // 2. Verifica se há um provider salvo para navegar
        const savedProvider = await AsyncStorage.getItem("@selected_provider");

        if (savedProvider) {
          try {
            const provider = JSON.parse(savedProvider);
            console.log("✅ Provider salvo encontrado:", provider.display_name);

            // Remove o provider salvo
            await AsyncStorage.removeItem("@selected_provider");

            // Navega para o perfil do profissional
            navigation.navigate("Profile", {
              provider,
              fromAuth: true,
            });

            if (onRedirectComplete) {
              onRedirectComplete({ success: true, navigatedTo: "Profile" });
            }

            return;
          } catch (parseError) {
            console.error("❌ Erro ao processar provider salvo:", parseError);
            await AsyncStorage.removeItem("@selected_provider");
          }
        }

        // 3. Se não houver provider salvo, verifica parâmetros de navegação
        const route = navigation.getState();
        const currentRoute = route.routes[route.index];
        const params = currentRoute?.params;

        if (params?.returnTo && params?.provider) {
          console.log("✅ Parâmetros de retorno encontrados:", params.returnTo);

          navigation.navigate(params.returnTo, {
            provider: params.provider,
            fromAuth: true,
          });

          if (onRedirectComplete) {
            onRedirectComplete({ success: true, navigatedTo: params.returnTo });
          }

          return;
        }

        // 4. Fallback: navega para tela principal
        console.log(
          "📱 Nenhum redirecionamento específico, indo para tela principal"
        );
        navigation.navigate("SearchScreen");

        if (onRedirectComplete) {
          onRedirectComplete({ success: true, navigatedTo: "SearchScreen" });
        }
      } catch (error) {
        console.error("❌ Erro no processo pós-autenticação:", error);

        if (onRedirectComplete) {
          onRedirectComplete({ success: false, error: error.message });
        }
      }
    };

    handlePostAuth();
  }, [isAuthenticationComplete, navigation, onRedirectComplete]);

  // Este componente não renderiza nada
  return null;
};

export default PostAuthHandler;
