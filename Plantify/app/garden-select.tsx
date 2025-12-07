import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Gardens from '@/components/Gardens';
import Button from '@/components/Button';
import { View } from 'react-native';
import { useAuth } from '@/hooks/useAuthContext';
import { PlantService } from '@/services/plantsService';

const GardenSelector = () => {
    const router = useRouter();
    const { id, watering_period, image_url, common_name } = useLocalSearchParams();
    const { getUserId, accessToken, refreshToken, setTokens } = useAuth();

    const handleSkip = async () => {
        try {
            console.log(image_url)
            const userPlant = {
                plant_id: id,
                owner: getUserId()!,
                watering_period: watering_period ? JSON.parse(watering_period as string) : null,
                image: image_url || null,
                common_name: common_name || null,
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
            <Gardens 
                plantId={Number(id)} 
                imageUrl={image_url as string}
                wateringPeriod={watering_period as string}
                common_name={common_name as string}
            />
        </>
    );
}

export default GardenSelector;