import { Colors } from '@/constants/Colors';
import { PlantService } from '@/services/plantsService';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';

export default function CameraScreen() {

    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const router = useRouter();

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    async function takePhoto() {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync();
            setPhotoUri(photo.uri);
        }
    }

    async function sendPhoto() {
        if (photoUri) {
            const data = await PlantService.sendPhoto(photoUri);
            if (data.plant_id) {
                router.push({
                    pathname: "/plant-info-details",
                    params: { id: data.plant_id }
                });
            } else {
                alert("No se pudo identificar la planta. Inténtalo de nuevo.");
            }
        }
    }

    return (
        <View style={styles.container}>
            {photoUri ? (
                <Image
                    source={{ uri: photoUri }}
                    style={{ flex: 2, borderRadius: 8, width: '100%', height: '100%' }}
                    resizeMode="cover"
                />
            ) : (
                <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
            )}
            {photoUri ? (
                <View style={styles.buttonContainer}>
                    {photoUri && (
                        <TouchableOpacity style={{ padding: 16 }} onPress={setPhotoUri.bind(null, null)}>
                            <Ionicons name="close-outline" size={60} color="#fff" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.button} onPress={takePhoto}>
                        <View style={{ borderRadius: 200, backgroundColor: 'white', width: 50, height: 50 }}></View>
                    </TouchableOpacity>

                    {photoUri && (
                        <TouchableOpacity style={{ padding: 16 }} onPress={sendPhoto}>
                            <Ionicons name="checkmark-outline" size={60} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <View style={{ paddingHorizontal: 32, paddingVertical: 90, justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.button} onPress={takePhoto}>
                        <View style={{ borderRadius: 200, backgroundColor: 'white', width: 50, height: 50 }}></View>
                    </TouchableOpacity>
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        gap: 8,
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    camera: {
        flex: 2,
        borderRadius: 8,
        overflow: 'hidden',
        margin: 8
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'row',
        paddingHorizontal: 32,
        paddingVertical: 90,
        alignContent: 'center',
        justifyContent: 'space-between',
        gap: 8
    },
    button: {
        width: 100,
        height: 100,
        borderRadius: 200,
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
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
});