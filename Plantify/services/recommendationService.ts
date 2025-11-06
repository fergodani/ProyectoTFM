const url = "http://192.168.1.143:8000"

export const RecommendationService = {
    getWeather: async (lat: number, lon: number): Promise<any> => {
        try {
            const response = await fetch(`${url}/api/weather/?lat=${lat}&lon=${lon}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching weather data:", error);
            throw error;
        }
    }
}