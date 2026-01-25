import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, useColorScheme } from "react-native";
import { useState, useLayoutEffect, useEffect } from "react";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { PostService } from "@/services/postService";
import { useAuth } from "@/hooks/useAuthContext";
import { Post, Comment } from "@/models/Post";

const CommentForm = () => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colorScheme = useColorScheme() ?? "light";
  const params = useLocalSearchParams();
  const { postId, commentId, edit } = params;
  const navigation = useNavigation();
  const { getUserId, accessToken, refreshToken } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: Colors[colorScheme].background,
      },
    });
  }, [navigation, colorScheme]);

  useEffect(() => {
    const loadForEdit = async () => {
      if (!edit || !commentId || !accessToken) return;
      try {
        const existing = await PostService.getCommentById(Number(commentId), accessToken);
        if (existing) {
          setContent(existing.content || "");
        }
      } catch (e) {
        console.error('Error loading comment for edit', e);
      }
    };
    loadForEdit();
  }, [edit, commentId, accessToken]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Por favor, completa el contenido");
      return;
    }

    setIsSubmitting(true);
    try {
      if (edit && commentId) {
        const updated = await PostService.updateComment(Number(commentId), { content }, accessToken!);
        if (updated) {
          Alert.alert("Éxito", "Comentario actualizado", [{ text: "Aceptar", onPress: () => router.replace({ pathname: "/post-details", params: { id: postId } }) }]);
        } else {
          Alert.alert("Error", "No se pudo actualizar el comentario. Intenta de nuevo.");
        }
      } else {
        const comment: Comment = {
          content: content,
          post_id: Number(postId),
          author: getUserId()!,
        };
        const response = await PostService.createComment(comment, accessToken!)
        
        Alert.alert(
          "Éxito",
          "¡Comentario creado correctamente!",
          [
            {
              text: "Aceptar",
              onPress: () => {
                // Reemplazar la pantalla actual por PostDetails para forzar recarga
                router.replace({ pathname: "/post-details", params: { id: postId } });
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo crear el comentario. Intenta de nuevo.");
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.form}>
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
              placeholder="Escribe tu comentario..."
              placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <ThemedText style={styles.charCounter}>
              {content.length}/1000 caracteres
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
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                isSubmitting && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !content.trim()}
            >
              <Ionicons
                name={isSubmitting ? "hourglass" : "checkmark"}
                size={20}
                color="#333"
              />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Creando..." : (edit ? "Actualizar" : "Crear")}
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
export default CommentForm;
