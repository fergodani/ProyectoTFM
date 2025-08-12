import { TouchableOpacity, StyleSheet, Text } from "react-native";
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/Colors";



type ButtonProps = {
  text: string;
  onPress?: (event: any) => void;
  disabled?: boolean;
};

export default function Button({ text, onPress, disabled = false }: Readonly<ButtonProps>) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && { opacity: 0.5 }
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 16, // Espaciado superior
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
  text: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  }
});
