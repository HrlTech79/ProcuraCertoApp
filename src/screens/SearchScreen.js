// src/screens/SearchScreen.js - CÓDIGO COMPLETO E AJUSTADO
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  db,
  appId,
  collection,
  query,
  where,
  getDocs,
  onAuthStateChanged,
  auth,
  doc,
  getDoc,
  signOut,
} from "../services/firebase";
import { StatusBar } from "expo-status-bar";
import CustomModal from "../components/CustomModal";
import DisplayCard from "../components/DisplayCard";

const SearchScreen = () => {
  const [searchText, setSearchText] = useState("");
  const [userCity, setUserCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [allProfessionals, setAllProfessionals] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setSearchText("");
      };
    }, [])
  );

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([fetchFeaturedProviders(), loadAllProfessionals()]);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        setLoadingData(false);
      }
    };
    loadInitialData();
  }, []);

  const fetchFeaturedProviders = async () => {
    try {
      const professionalsCollection = collection(db, "prestadores");
      const featuredQueries = [
        where("display", "==", "Sim"),
        where("carrocel", "==", "Sim"),
      ];

      const featuredMap = new Map();
      for (const q_where of featuredQueries) {
        const q = query(professionalsCollection, q_where);
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          if (!featuredMap.has(doc.id)) {
            featuredMap.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });
      }
      const providers = Array.from(featuredMap.values());
      setFeaturedProviders(providers.slice(0, 4));
    } catch (error) {
      console.error("Erro ao buscar prestadores em destaque:", error);
    }
  };

  const loadAllProfessionals = async () => {
    try {
      const professionalsCollection = collection(db, "prestadores");
      const allQuery = await getDocs(professionalsCollection);
      const professionals = allQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllProfessionals(professionals);
    } catch (error) {
      console.error("Erro ao carregar todos os profissionais:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMenuModalVisible(false);
      Alert.alert("Sucesso", "Você saiu da sua conta.");
    } catch (error) {
      console.error("Erro ao sair da conta: ", error.message);
      Alert.alert("Erro", "Ocorreu um erro ao sair. Tente novamente.");
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (user) {
          try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setUserCity(userDocSnap.data().regiao);
            }
          } catch (error) {
            console.error("Erro ao carregar dados do usuário: ", error);
          }
        } else {
          setUserCity("");
        }
      });
      return () => unsubscribe();
    }, [])
  );

  const handleSearch = async () => {
    if (searchText.trim() === "") {
      Alert.alert("Atenção", "Por favor, digite algo para buscar.");
      return;
    }

    setLoading(true);
    try {
      const searchTerm = searchText.trim().toLowerCase();
      if (allProfessionals.length > 0) {
        const filteredResults = allProfessionals.filter((item) => {
          const searchFields = [
            item.display_name,
            item.tipo_servico,
            item.descricao,
            item.regiao,
            item.cidade,
            item.estado,
            item.endereco,
            item.cnpj,
            item.telefone,
            item.email,
            item.especialidades,
            item.servicos,
            item.bairro,
            item.cep,
          ].filter(Boolean);
          return searchFields.some((field) =>
            field.toString().toLowerCase().includes(searchTerm)
          );
        });
        navigation.navigate("Results", {
          result: filteredResults,
          searchTerm: searchText.trim(),
        });
      } else {
        // Fallback
      }
    } catch (error) {
      console.error("Erro ao buscar prestadores:", error);
      Alert.alert("Erro", "Erro ao realizar a busca. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => setSearchText("");

  const CompactCard = ({ item, onPress }) => (
    <TouchableOpacity style={styles.compactCard} onPress={onPress}>
      <Image
        source={
          item.logo ? { uri: item.logo } : require("../../assets/icon.png")
        }
        style={styles.compactCardImage}
        resizeMode="cover"
      />
      <Text style={styles.compactCardName} numberOfLines={2}>
        {item.display_name || "Sem nome"}
      </Text>
    </TouchableOpacity>
  );

  // ### AJUSTE NO MENU ###
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

  const renderFeaturedRows = () => {
    if (loadingData) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#53C7BA" />
          <Text style={styles.emptyStateText}>Carregando prestadores...</Text>
        </View>
      );
    }

    if (featuredProviders.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Nenhum prestador em destaque no momento.
          </Text>
        </View>
      );
    }

    if (featuredProviders.length > 2) {
      const rows = [];
      for (let i = 0; i < featuredProviders.length; i += 2) {
        const rowItems = featuredProviders.slice(i, i + 2);
        rows.push(
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            {rowItems.map((item) => (
              <CompactCard
                key={item.id}
                item={item}
                onPress={() =>
                  navigation.navigate("Profile", { provider: item })
                }
              />
            ))}
            {rowItems.length === 1 && <View style={{ flex: 1, margin: 5 }} />}
          </View>
        );
      }
      return rows;
    } else {
      const rows = [];
      for (let i = 0; i < featuredProviders.length; i += 2) {
        const rowItems = featuredProviders.slice(i, i + 2);
        rows.push(
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            {rowItems.map((item) => (
              <DisplayCard
                key={item.id}
                item={item}
                onPress={() =>
                  navigation.navigate("Profile", { provider: item })
                }
              />
            ))}
            {rowItems.length === 1 && <View style={{ flex: 1, margin: 5 }} />}
          </View>
        );
      }
      return rows;
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      {/* ### AJUSTE DE RESPONSIVIDADE ### */}
      <View style={styles.pageWrapper}>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerLogoAndTitle}>
                <Image
                  source={require("../../assets/PROCURA_CERTO.png")}
                  style={styles.logo}
                />
                <Text style={styles.headerTitle}>Procura Certo</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                Visite nosso catálogo de prestadores, de Serviços de A a Z
              </Text>
            </View>
            <TouchableOpacity
              style={styles.menuIcon}
              onPress={() => setIsMenuModalVisible(true)}
            >
              <Text style={styles.menuText}>☰</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuredSection}>{renderFeaturedRows()}</View>

          <View style={styles.searchSection}>
            <Text style={styles.searchTitle}>
              Encontre o profissional ideal para seu projeto
            </Text>
            <Text style={styles.searchSubtitle}>
              Conectamos você aos melhores prestadores de serviços da sua região
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Nome, serviço, cidade, especialidade..."
                placeholderTextColor="#999"
                value={searchText}
                fontSize={14}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearSearch}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.searchButton,
                loading && styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.searchButtonText}>Buscando...</Text>
                </View>
              ) : (
                <Text style={styles.searchButtonText}>Buscar</Text>
              )}
            </TouchableOpacity>
            <View style={styles.locationContainer}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>
                {userCity
                  ? `Encontre profissionais perto de você em ${userCity}`
                  : `Encontre profissionais da sua cidade`}
              </Text>
            </View>
            {allProfessionals.length > 0 && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  {allProfessionals.length} profissionais cadastrados
                </Text>
              </View>
            )}
          </View>

          <View style={styles.howItWorksSection}>
            <Text style={styles.sectionTitle}>Como Funciona</Text>
            <Text style={styles.sectionText}>
              Processo simples em apenas 3 passos:
            </Text>
            <View style={styles.stepContainer}>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>
                  Busque o profissional que precisa.
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>
                  Encontre prestadores na sua região.
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>
                  Entre em contato e feche o serviço.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <CustomModal
        visible={isMenuModalVisible}
        onClose={() => setIsMenuModalVisible(false)}
        title="Menu"
        showConfirmButton={false}
        children={renderMenuOptions()}
      />
    </ScrollView>
  );
};

// ### AJUSTE DE RESPONSIVIDADE ###
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  pageWrapper: {
    flex: 1,
    alignItems: "center", // Centraliza o conteúdo na web
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 1200, // Largura máxima para todo o conteúdo
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    marginRight: 10,
  },
  headerLogoAndTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#666",
  },
  menuIcon: {
    padding: 5,
  },
  menuText: {
    fontSize: 24,
    color: "#333",
  },
  featuredSection: {
    paddingVertical: 5,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 20,
    minHeight: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  compactCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    margin: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  compactCardImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  compactCardName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    lineHeight: 16,
  },
  searchSection: {
    backgroundColor: "#53C7BA",
    padding: 20,
    alignItems: "center",
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  searchSubtitle: {
    fontSize: 16,
    color: "#f0f0f0",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    fontSize: 20,
    color: "#999",
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
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
    width: "100%",
    height: 50,
    backgroundColor: "#f6b93b",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchButtonDisabled: {
    backgroundColor: "#d4a574",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  locationIcon: {
    fontSize: 20,
    color: "#fff",
    marginRight: 5,
  },
  locationText: {
    fontSize: 14,
    color: "#fff",
  },
  statsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
  },
  statsText: {
    fontSize: 12,
    color: "#f0f0f0",
    textAlign: "center",
    fontStyle: "italic",
  },
  howItWorksSection: {
    padding: 20,
    marginTop: 20,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  sectionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    flexWrap: "wrap", // Permite quebra de linha em telas menores
  },
  step: {
    alignItems: "center",
    flex: 1,
    minWidth: 150, // Garante um tamanho mínimo para cada passo
    marginHorizontal: 5,
    marginBottom: 15,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3b82f6",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e3f2fd",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 5,
  },
  stepText: {
    fontSize: 14,
    textAlign: "center",
    color: "#444",
  },
  modalContent: {
    width: "100%",
    padding: 10,
    backgroundColor: "transparent",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    marginBottom: 5,
    borderRadius: 8,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 15,
    color: "#3b82f6",
    width: 25,
    textAlign: "center",
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
  },
});

export default SearchScreen;
