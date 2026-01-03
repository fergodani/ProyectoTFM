import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, useColorScheme } from "react-native";
import { useState, useLayoutEffect } from "react";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { PostService } from "@/services/postService";
import { useAuth } from "@/hooks/useAuthContext";
import { Post } from "@/models/Post";

const PostForm = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colorScheme = useColorScheme() ?? "light";
  const params = useLocalSearchParams();
  const { plant_id, plantName } = params;
  const navigation = useNavigation();
  const { getUserId, accessToken, refreshToken } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: plantName
        ? String(plantName).charAt(0).toUpperCase() + String(plantName).slice(1)
        : "Detalles de la planta",
      headerStyle: {
        backgroundColor: Colors[colorScheme].background,
      },
    });
  }, [navigation, colorScheme]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Creating post:", { title, content, plant_id });
      const post: Post = {
        title: title,
        content: content,
        plant_id: Number(plant_id),
        author: getUserId()!,
      };
      const response = await PostService.createPost(post, accessToken!)
      
      console.log("Post created successfully:", response);
      
      Alert.alert(
        "Success", 
        "Post created successfully!", 
        [
          { 
            text: "OK", 
            onPress: () => {
              // Volver a la pantalla anterior
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to create post. Please try again.");
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.form}>
          {/* Input para el título */}
          <View style={styles.inputGroup}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
                  color: colorScheme === 'dark' ? '#fff' : '#000'
                }
              ]}
              placeholder="Title..."
              placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Input para el contenido */}
          <View style={styles.inputGroup}>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
                  color: colorScheme === 'dark' ? '#fff' : '#000'
                }
              ]}
              placeholder="Write your post content here..."
              placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <ThemedText style={styles.charCounter}>
              {content.length}/1000 characters
            </ThemedText>
          </View>

          {/* Botones de acción */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
              disabled={isSubmitting}
            >
              <Ionicons name="close" size={20} color="#666" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                isSubmitting && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !title.trim() || !content.trim()}
            >
              <Ionicons
                name={isSubmitting ? "hourglass" : "checkmark"}
                size={20}
                color="#333"
              />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Creating..." : "Create Post"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  plantInfo: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
    opacity: 0.7,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  charCounter: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
  },
  submitButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Estilos antiguos mantenidos por compatibilidad
  text: {
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12
  },
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 16,
  },
});

export default PostForm;