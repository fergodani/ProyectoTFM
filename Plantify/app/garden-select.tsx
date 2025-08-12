import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Gardens from '@/components/Gardens';
import Button from '@/components/Button';
import { View } from 'react-native';
import { useAuth } from '@/hooks/useAuthContext';
import { PlantService } from '@/services/plantsService';

const GardenSelector = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { getUserId, accessToken, refreshToken, setTokens } = useAuth();

    const handleSkip = async () => {
        try {
            const userPlant = {
                plant_id: id,
                owner: getUserId()!
            }
            console.log(userPlant)
            await PlantService.createPlant(userPlant, accessToken!);
            router.replace("/(tabs)/profile");
        } catch (error) {
            console.error("Error adding plant:", error);
        }
    };

    return (
        <>
            <View style={{ padding: 16 }}>
                <Button text='Saltar' onPress={handleSkip} />
            </View>
            <Gardens plantId={Number(id)} />
        </>
    );
}

export default GardenSelector;