import * as React from 'react';
import { View, useWindowDimensions, Text, StyleSheet, Image, TouchableOpacity, Modal, TextInput, useColorScheme } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuthContext';
import { useNavigation, useRouter } from 'expo-router';
import Plants from '@/components/Plants';
import Gardens from '@/components/Gardens';
import { LinearGradient } from 'expo-linear-gradient';
import { globalStyles } from '@/styles/global-styles';
import Button from '@/components/Button';


const renderScene = SceneMap({
  plants: () => <Plants gardenId={null} />,
  gardens: Gardens,
});

const routes = [
  { key: 'plants', title: 'Plantas' },
  { key: 'gardens', title: 'Lugares' },
];

export default function TabTwoScreen() {
  const router = useRouter();
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [locationValue, setLocationValue] = React.useState('');
  const { isAuthenticated, logout, getUserId } = useAuth();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, right: 0 });
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
  /*
  const navigation = useNavigation();

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  */

  const handleLogin = () => {
    setMenuVisible(false);
    router.push(
      {
        pathname: '/login',
        params: { from: '/(tabs)/profile' }
      }
    );
  };
  const handleSignup = () => {
    setMenuVisible(false);
    router.push('/signup');
  };

  const handleLogout = () => {
    logout();
  };

  const handleAdd = () => {
    if (index === 0) {
      router.push({
        pathname: "/plant-search",
        params: { isCreating: "true" }
      });
    } else if (index === 1) {
      router.push('/garden-form');
    }
  };

  const handleMenuOptions = (event: any) => {
    event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setMenuPosition({
        top: pageY + height,
        right: 16
      });
      setMenuVisible(true);
    });
  }

  return (
    !isAuthenticated ? (
      <LinearGradient
        colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
        style={[styles.container, { paddingVertical: 16 }]}
      >
        <View style={styles.titleContainer}>
          <ThemedText type="title">No estás autenticado</ThemedText>
          <ThemedText type="default">Por favor, inicia sesión para ver tus plantas y jardines.</ThemedText>
          <Button text="Iniciar sesión" onPress={handleLogin} />
          <View style={{ marginTop: 16 }}>
            <ThemedText type="default">¿No tienes cuenta?</ThemedText>
            <Button text="Crea una" onPress={handleSignup} />
          </View>

        </View>
      </LinearGradient>
    ) : (

      <LinearGradient
        colors={['rgba(213, 240, 219, 0.19)', backgroundColor]} // Cambia estos colores a los que quieras
        style={[styles.container, { paddingVertical: 16 }]}
      >
        <View style={styles.titleContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center', gap: 8 }}>
            <ThemedText type="title">Mis plantas</ThemedText>
            <TouchableOpacity
              testID='settings'
              style={{ paddingVertical: 8 }}
              onPress={(event) => {
                router.push({
                  pathname: "/settings"
                });

              }}>
              <Ionicons name="settings" size={30} color={colorScheme === "dark" ? Colors.dark.text : Colors.light.text} />
            </TouchableOpacity>
          </View>
          <ThemedText type="default">Añade todas tus plantas para cuidarlas fácilmente</ThemedText>
        </View>

        <TabView
          style={{ marginTop: 16 }}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={props => <TabBar
            {...props}
            style={styles.tab}
            activeColor={Colors.light.text}
            inactiveColor={Colors.light.text}
            indicatorStyle={{ backgroundColor: 'white', height: '100%', borderRadius: 8 }}
          />}
        />
        <TouchableOpacity style={styles.fab} onPress={handleAdd}>
          <Ionicons name="add" size={30} color="#333" />
        </TouchableOpacity>
        {/* Menú modal */}
        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}>
            <View style={[styles.menuContent, {
              position: 'absolute',
              top: menuPosition.top,
              right: menuPosition.right
            }]}>
              <TouchableOpacity style={styles.menuButton} onPress={() => { setMenuVisible(false); /* acción 1 */ }}>
                <Text style={styles.menuText}>Editar perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuButton} onPress={() => { handleLogout(); /* acción 2 */ }}>
                <Text style={styles.menuText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </LinearGradient>
    ));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tab: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  titleContainer: {
    gap: 8,
    marginTop: 64,
    paddingHorizontal: 16,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  text: {
    fontSize: 14,
    marginTop: 4,
    paddingHorizontal: 16,
  },
  button: {
    marginTop: 32, // Espaciado superior
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minWidth: 160,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuButton: {
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 16,
  },
});
