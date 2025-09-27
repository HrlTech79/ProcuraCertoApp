// src/screens/ResultScreen.js - CORRIGIDO
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import DisplayCard from "../components/DisplayCard";
import CustomModal from "../components/CustomModal";
import DisplayCardHorizontal from "../components/DisplayCardHorizontal";
import QuickRegistrationPopup from "../components/QuickRegistrationPopup";
import { useUserValidation } from "../hooks/useUserValidation";
import { Alert } from "react-native";
// Importa as funções e variáveis necessárias do Firebase
import {
  db,
  appId,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "../services/firebase";

const ResultScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // CORREÇÃO: Usar 'result' e garantir que seja um array
  const { result = [], searchTerm = "" } = route.params || {};

  console.log("📊 ResultsScreen recebeu:", {
    resultLength: result?.length || 0,
    searchTerm: searchTerm,
    sampleData: result?.slice(0, 2).map((item) => ({
      nome: item?.display_name,
      servico: item?.tipo_servico,
    })),
  });

  // Hook customizado para validação (removido da lógica de navegação direta)
  const {
    isValidating,
    showRegistrationPopup,
    pendingProvider,
    validateAndNavigate,
    handleRegistrationComplete,
    handleCloseRegistrationPopup,
  } = useUserValidation(navigation);

  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredProfessionals, setFeaturedProfessionals] = useState([]);

  // CORREÇÃO: Inicializar com 'result'
  const [filteredResults, setFilteredResults] = useState(result);

  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [allProfessionals, setAllProfessionals] = useState([]);

  // Refs e estados para o carrossel automático
  const carouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoScrollInterval = useRef(null);

  // Função clearSearch que estava faltando
  const clearSearch = () => {
    setSearchQuery("");
    setFilteredResults(result); // Volta aos resultados originais
  };

  // Função para lidar com o clique em um card de profissional
  const handleProfessionalPress = async (provider) => {
    console.log("🎯 Clique no profissional:", provider.display_name);

    // Nova lógica: navega diretamente para a tela de perfil
    navigation.navigate("Profile", { provider: provider });
  };

  // Efeito para buscar os profissionais em destaque (carrossel)
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        console.log("🔍 Iniciando busca de profissionais em destaque...");
        console.log("📱 App ID:", appId);

        const possiblePaths = [
          `prestadores`,
          `/artifacts/${appId}/public/data/prestadores`,
          `artifacts/${appId}/public/data/prestadores`,
          `public/data/prestadores`,
        ];

        let professionalsCollection;
        let collectionPath;
        let successPath = null;

        for (const path of possiblePaths) {
          try {
            console.log(`🧪 Testando caminho: ${path}`);
            professionalsCollection = collection(db, path);

            const testQuery = await getDocs(professionalsCollection);
            console.log(
              `✅ Caminho ${path} funcionou! Documentos encontrados: ${testQuery.size}`
            );

            collectionPath = path;
            successPath = path;
            break;
          } catch (testError) {
            console.log(`❌ Caminho ${path} falhou:`, testError.message);
            continue;
          }
        }

        if (!successPath) {
          throw new Error("Nenhum caminho de coleção válido encontrado");
        }

        console.log("📂 Usando caminho da coleção:", collectionPath);

        const generalQuery = await getDocs(professionalsCollection);
        console.log("📊 Total de documentos na coleção:", generalQuery.size);

        if (!generalQuery.empty) {
          console.log("📋 Analisando todos os documentos:");
          generalQuery.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`Documento ${index + 1} (${doc.id}):`, {
              carrocel: data.carrocel,
              carrocel_type: typeof data.carrocel,
              display_name: data.display_name,
              tipo_servico: data.tipo_servico,
            });
          });
        }

        const queryVariations = [
          { field: "carrocel", operator: "==", value: "Sim" },
          { field: "carrocel", operator: "==", value: "sim" },
          { field: "carrocel", operator: "==", value: true },
          { field: "carrocel", operator: "==", value: "true" },
        ];

        let featured = [];

        for (const variation of queryVariations) {
          try {
            console.log(
              `🔎 Testando query: ${variation.field} ${variation.operator} ${variation.value} (${typeof variation.value})`
            );
            const q = query(
              professionalsCollection,
              where(variation.field, variation.operator, variation.value)
            );

            const querySnapshot = await getDocs(q);
            console.log(
              `📊 Documentos encontrados com esta variação: ${querySnapshot.size}`
            );

            if (querySnapshot.size > 0) {
              featured = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                console.log("✅ Profissional em destaque encontrado:", {
                  id: doc.id,
                  display_name: data.display_name,
                  tipo_servico: data.tipo_servico,
                  carrocel: data.carrocel,
                });

                return {
                  id: doc.id,
                  ...data,
                };
              });
              break;
            }
          } catch (queryError) {
            console.log(`❌ Erro na variação de query:`, queryError.message);
          }
        }

        console.log("🎯 Total de profissionais em destaque:", featured.length);
        setFeaturedProfessionals(featured);

        const allProfessionalsQuery = await getDocs(professionalsCollection);
        const allProfs = allProfessionalsQuery.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("📊 Total de profissionais carregados:", allProfs.length);
        setAllProfessionals(allProfs);

        if (featured.length === 0) {
          setErrorMessage(
            "Nenhum profissional em destaque encontrado com as queries testadas"
          );
        }
      } catch (error) {
        console.error("❌ Erro ao buscar profissionais em destaque:", error);
        console.error("📋 Detalhes do erro:", {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        setErrorMessage(`Erro: ${error.message}`);
      } finally {
        setLoadingFeatured(false);
        console.log("✅ Busca finalizada");
      }
    };

    fetchFeatured();
  }, []);

  // CORREÇÃO: Atualizar filteredResults quando result mudar
  useEffect(() => {
    console.log("🔄 Atualizando filteredResults com:", result.length, "itens");
    setFilteredResults(result);
  }, [result]);

  // Efeito para controlar o scroll automático do carrossel
  useEffect(() => {
    if (featuredProfessionals.length > 1 && !loadingFeatured) {
      autoScrollInterval.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % featuredProfessionals.length;

          if (carouselRef.current) {
            carouselRef.current.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          }

          return nextIndex;
        });
      }, 3000);
    }

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [featuredProfessionals, loadingFeatured]);

  // Limpa o interval quando o usuário interage manualmente com o carrossel
  const handleManualScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);

      setTimeout(() => {
        if (featuredProfessionals.length > 1) {
          autoScrollInterval.current = setInterval(() => {
            setCurrentIndex((prevIndex) => {
              const nextIndex = (prevIndex + 1) % featuredProfessionals.length;

              if (carouselRef.current) {
                carouselRef.current.scrollToIndex({
                  index: nextIndex,
                  animated: true,
                });
              }

              return nextIndex;
            });
          }, 3000);
        }
      }, 5000);
    }
  };

  // Função para lidar com o scroll manual e atualizar o índice atual
  const onCarouselScroll = (event) => {
    const slideSize = 195;
    const currentSlideIndex = Math.round(
      event.nativeEvent.contentOffset.x / slideSize
    );

    if (
      currentSlideIndex !== currentIndex &&
      currentSlideIndex < featuredProfessionals.length
    ) {
      setCurrentIndex(currentSlideIndex);
    }
  };

  // CORREÇÃO: Efeito para filtrar os resultados quando a query de busca muda
  useEffect(() => {
    if (searchQuery.trim() === "") {
      console.log("🔄 Resetando para resultados originais:", result.length);
      setFilteredResults(result);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      console.log("🔍 Filtrando com query:", lowercasedQuery);

      const newFilteredResults = result.filter((item) => {
        const searchFields = [
          item.display_name || "",
          item.tipo_servico || "",
          item.descricao || "",
          item.regiao || "",
          item.cidade || "",
          item.estado || "",
          item.endereco || "",
          item.especialidades || "",
          item.servicos || "",
        ];

        return searchFields.some((field) =>
          field.toString().toLowerCase().includes(lowercasedQuery)
        );
      });

      console.log("📊 Resultados após filtro:", newFilteredResults.length);
      setFilteredResults(newFilteredResults);
    }
  }, [searchQuery, result]);

  // Função para lidar com a busca local
  const handleLocalSearch = () => {
    console.log("🔍 Busca local ativada com a query:", searchQuery);
    // A busca acontece automaticamente no useEffect acima
  };

  // Renderiza um componente quando a lista de resultados está vazia
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery.trim()
          ? `Nenhum resultado para "${searchQuery}"`
          : result.length === 0
            ? "Nenhum profissional encontrado."
            : "Use a busca acima para filtrar"}
      </Text>
      <Text style={styles.emptySubText}>
        {searchQuery.trim()
          ? "Tente usar palavras-chave diferentes ou menos específicas."
          : result.length === 0
            ? "Tente ajustar sua pesquisa ou explore nossos destaques."
            : "Digite um termo para filtrar os resultados"}
      </Text>
      {searchQuery.trim() && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={clearSearch}
        >
          <Text style={styles.clearSearchButtonText}>Limpar busca</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Resto do código continua igual...
  const renderHeader = () => (
    <View style={styles.fullHeader}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/PROCURA_CERTO.png")}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Procura Certo</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.menuIcon}
            onPress={() => setIsMenuModalVisible(true)}
          >
            <Text style={styles.menuText}>&#9776;</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.carouselContainer}>
        <Text style={styles.carouselTitle}>Profissionais em Destaque</Text>
        {loadingFeatured ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6a5acd" />
            <Text style={styles.loadingText}>Carregando destaques...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoadingFeatured(true);
                setErrorMessage("");
                setTimeout(() => {
                  setLoadingFeatured(false);
                }, 1000);
              }}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : featuredProfessionals.length === 0 ? (
          <View style={styles.noFeaturedContainer}>
            <Text style={styles.noFeaturedText}>
              Nenhum profissional em destaque disponível no momento.
            </Text>
          </View>
        ) : (
          <React.Fragment>
            <FlatList
              ref={carouselRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featuredProfessionals}
              renderItem={({ item }) => (
                <DisplayCardHorizontal
                  item={item}
                  onPress={() => handleProfessionalPress(item)}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.carouselList}
              onScroll={onCarouselScroll}
              onScrollBeginDrag={handleManualScroll}
              scrollEventThrottle={16}
              getItemLayout={(data, index) => ({
                length: 195,
                offset: 195 * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                const wait = new Promise((resolve) => setTimeout(resolve, 500));
                wait.then(() => {
                  if (carouselRef.current) {
                    carouselRef.current.scrollToIndex({
                      index: info.index,
                      animated: true,
                    });
                  }
                });
              }}
            />

            {featuredProfessionals.length > 1 && (
              <View style={styles.pageIndicatorContainer}>
                {featuredProfessionals.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.pageIndicator,
                      index === currentIndex && styles.activePageIndicator,
                    ]}
                    onPress={() => {
                      if (carouselRef.current) {
                        carouselRef.current.scrollToIndex({
                          index: index,
                          animated: true,
                        });
                        setCurrentIndex(index);
                        handleManualScroll();
                      }
                    }}
                  />
                ))}
              </View>
            )}
          </React.Fragment>
        )}
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Image
            source={require("../../assets/PROCURA_CERTO.png")}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Filtrar por nome, serviço, cidade..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleLocalSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.searchButton,
            isSearching && styles.searchButtonDisabled,
          ]}
          onPress={handleLocalSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Filtrar</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {searchQuery.trim()
            ? `Filtrados: "${searchQuery}"`
            : searchTerm
              ? `Resultados para: "${searchTerm}"`
              : "Profissionais Disponíveis"}
        </Text>
        <Text style={styles.resultsCount}>
          {filteredResults.length} profissional
          {filteredResults.length !== 1 ? "ais" : ""}
          {searchQuery.trim() ? " (filtrado" : " encontrado"}
          {filteredResults.length !== 1 ? "s" : ""})
        </Text>
        {searchQuery.trim() && (
          <TouchableOpacity style={styles.showAllButton} onPress={clearSearch}>
            <Text style={styles.showAllButtonText}>
              Ver todos os resultados ({result.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Overlay de validação usando o estado do hook (mantido para outros casos) */}
      {isValidating && (
        <View style={styles.validationOverlay}>
          <View style={styles.validationContainer}>
            <ActivityIndicator size="large" color="#6a5acd" />
            <Text style={styles.validationText}>Verificando cadastro...</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderMenuOptions = () => (
    <View style={styles.modalContent}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setIsMenuModalVisible(false);
          navigation.navigate("Search");
        }}
      >
        <Text style={styles.menuItemIcon}>&#x2302;</Text>
        <Text style={styles.menuItemText}>Início</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setIsMenuModalVisible(false);
          navigation.navigate("Results", { result: allProfessionals });
        }}
      >
        <Text style={styles.menuItemIcon}>&#x1F50D;</Text>
        <Text style={styles.menuItemText}>Ver Todos</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setIsMenuModalVisible(false);
          navigation.navigate("Login"); // Navega para a tela de Login
        }}
      >
        <Text style={styles.menuItemIcon}>&#x1F464;</Text>
        <Text style={styles.menuItemText}>Representante</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <FlatList
        data={filteredResults}
        renderItem={({ item }) => (
          <DisplayCard
            item={item}
            onPress={() => handleProfessionalPress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
      />
      <CustomModal
        visible={isMenuModalVisible}
        onClose={() => setIsMenuModalVisible(false)}
        title="Menu"
        showConfirmButton={false}
        children={renderMenuOptions()}
      />

      {/* Popup de Cadastro Rápido */}
      <QuickRegistrationPopup
        visible={showRegistrationPopup}
        onClose={handleCloseRegistrationPopup}
        onRegistrationComplete={handleRegistrationComplete}
        selectedProvider={pendingProvider}
      />
    </View>
  );
};

// Estilos mantidos iguais...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  fullHeader: {
    backgroundColor: "#f5f5f5",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  menuIcon: {
    padding: 5,
  },
  menuText: {
    fontSize: 24,
    color: "#333",
  },
  carouselContainer: {
    paddingVertical: 15,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  carouselList: {
    paddingHorizontal: 10,
  },
  loadingContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  errorContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#6a5acd",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  noFeaturedContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  noFeaturedText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  pageIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 5,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activePageIndicator: {
    backgroundColor: "#6a5acd",
    width: 12,
    height: 8,
    borderRadius: 4,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 10,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
    marginLeft: 5,
  },
  clearButtonText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "bold",
  },
  searchButton: {
    backgroundColor: "#6a5acd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonDisabled: {
    backgroundColor: "#ccc",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  resultsCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  showAllButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  showAllButtonText: {
    color: "#6a5acd",
    fontSize: 14,
    fontWeight: "500",
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 5,
    paddingHorizontal: 20,
  },
  clearSearchButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#6a5acd",
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContent: {
    width: 250,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 15,
    color: "#3b82f6",
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: "500",
  },
  validationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  validationContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  validationText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
});

export default ResultScreen;
