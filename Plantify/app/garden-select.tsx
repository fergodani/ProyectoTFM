import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Gardens from '@/components/Gardens';
import Button from '@/components/Button';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/hooks/useAuthContext';
import { PlantService } from '@/services/plantsService';

const GardenSelector = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = React.useState(false);
    const { getUserId, accessToken, refreshToken, setTokens } = useAuth();

    const handleSkip = async () => {
        try {
            const userPlant = {
                plant_id: id,
                owner: getUserId()!
            }
            setLoading(true);
            await PlantService.createPlant(userPlant, accessToken!);
            setLoading(false);
            router.replace("/(tabs)/profile");
        } catch (error) {
            //console.error("Error adding plant:", error);
            alert("Error al agregar la planta.");
            setLoading(false);
            router.replace("/(tabs)/profile");
        }
    };

    return (
        <>
            
            <View style={{ padding: 16 }}>
                <Button text='Saltar' onPress={handleSkip} />
            </View>
            {loading && <ActivityIndicator size="large" style={{ marginTop: 32 }} />}
            <Gardens
                plantId={Number(id)}
            />
        </>
    );
}

export default GardenSelector;