from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
import requests
from django.http import JsonResponse
from .models import Garden, UserPlant, PlantInfo
from .serializers import GardenSimpleSerializer, UserRegisterSerializer, GardenSerializer, UserPlantSerializer, PlantInfoSerializer, CustomTokenObtainPairSerializer
from bs4 import BeautifulSoup
from django.utils import timezone
from django.db.models import Q
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import json
import os

TREFLE_API_URL = "https://trefle.io/api/v1/plants"
TREFLE_TOKEN = "qD5bYaqpif9la_ZYT6zOPTe5icGrGiJAOlDacDK0Fic" 

# CRUD para Garden
class GardenListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    """Obtener todos los jardines o crear uno nuevo"""
    def get(self, request):
        gardens = Garden.objects.filter(owner=request.user)
        serializer = GardenSerializer(gardens, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = GardenSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Get gardens (only id and name)
class GardenListNameView(APIView):
    permission_classes = [IsAuthenticated]
    """Obtener todos los jardines del usuario"""
    def get(self, request):
        gardens = Garden.objects.filter(owner=request.user)
        serializer = GardenSimpleSerializer(gardens, many=True)
        return Response(serializer.data)


class GardenDetailView(APIView):
    """Obtener, actualizar o eliminar un jardín específico"""
    def get_object(self, pk):
        try:
            return Garden.objects.get(pk=pk)
        except Garden.DoesNotExist:
            return None

    def get(self, request, pk):
        garden = self.get_object(pk)
        if not garden:
            return Response({"error": "Garden not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = GardenSerializer(garden)
        return Response(serializer.data)

    def put(self, request, pk):
        garden = self.get_object(pk)
        if not garden:
            return Response({"error": "Garden not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = GardenSerializer(garden, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        garden = self.get_object(pk)
        if not garden:
            return Response({"error": "Garden not found"}, status=status.HTTP_404_NOT_FOUND)
        garden.delete()
        return Response({"message": "Garden deleted"}, status=status.HTTP_204_NO_CONTENT)

class GardenSuitabilityView(APIView):
    permission_classes = [IsAuthenticated]
    """
    Recibe el id de una planta y devuelve todos los jardines del usuario con un texto explicativo de si es óptimo o no para esa planta.
    """
    def get(self, request):
        plant_id = request.GET.get('plant_id')
        if not plant_id:
            return Response({"error": "plant_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Obtiene la planta y su tipo
        try:
            plant = PlantInfo.objects.get(pk=plant_id)
        except PlantInfo.DoesNotExist:
            return Response({"error": "Plant not found"}, status=status.HTTP_404_NOT_FOUND)
        plant_type = plant.type.lower() if plant.type else None
        if not plant_type:
            return Response({"error": "Plant type not found"}, status=status.HTTP_400_BAD_REQUEST)
        print(f"Evaluating suitability for plant type: {plant_type}")
        # Carga las preferencias del tipo de planta
        plant_types_path = os.path.join(os.path.dirname(__file__), "../plant_types.json")
        with open(plant_types_path, "r", encoding="utf-8") as f:
            plant_types = json.load(f)

        type_info = next((pt for pt in plant_types if pt.get("type", "").lower() == plant_type), None)
        if not type_info:
            return Response({"error": "No info for plant type"}, status=status.HTTP_400_BAD_REQUEST)

        gardens = Garden.objects.filter(owner=request.user)
        results = []
        for garden in gardens:
            reasons = []
            is_optimal = True
        
            # Humedad
            if hasattr(garden, "humidity") and "humidity" in type_info:
                garden_humidity = getattr(garden, "humidity", None)
                plant_humidity = type_info["humidity"]
                if garden_humidity and plant_humidity:
                   if garden_humidity != plant_humidity:
                        is_optimal = False
                        reasons.append(f"La humedad no es adecuada (jardín: {garden_humidity}%, planta: {plant_humidity}%)")

            # Luz
            if hasattr(garden, "sunlight_exposure") and "light" in type_info:
                garden_light = getattr(garden, "sunlight_exposure", None)
                plant_light = type_info["light"]
                if garden_light and plant_light:
                    if garden_light not in plant_light:
                        is_optimal = False
                        reasons.append(f"La luz no es adecuada")
        
            # Ubicación
            if hasattr(garden, "location") and "preferred_location" in type_info:
                garden_location = getattr(garden, "location", None)
                preferred_location = type_info["preferred_location"]
                if preferred_location != "any":
                    if preferred_location == "indoor" and garden_location == "outdoor":
                        is_optimal = False
                        reasons.append("La planta prefiere interior, pero el jardín es exterior.")
                    elif preferred_location == "outdoor" and garden_location == "indoor":
                        is_optimal = False
                        reasons.append("La planta prefiere exterior, pero el jardín es interior.")
            if hasattr(garden, "air") and "air_tolerance" in type_info:
                garden_air = getattr(garden, "air", None)
                plant_air_tolerance = type_info["air_tolerance"]
                if plant_air_tolerance == "low" and garden_air:
                    is_optimal = False
                    reasons.append("La planta no tolera mucho aire, pero el jardín tiene mucha ventilación.")
                elif plant_air_tolerance == "high" and not garden_air:
                    is_optimal = False
                    reasons.append("La planta necesita mucha ventilación, pero el jardín tiene poco aire.")
            # Explicación final
            if is_optimal:
                texto = "Este jardín es óptimo para la planta según sus necesidades de humedad, luz y ubicación."
            else:
                texto = "Este jardín NO es óptimo para la planta: " + " ".join(reasons)
        
            results.append({
                "garden": GardenSimpleSerializer(garden).data,
                "is_optimal": is_optimal,
                "reasons": reasons,
            })

        return Response(results)

# CRUD para Plant
class UserPlantListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    """Obtener todas las plantas o crear una nueva"""
    def get(self, request):
        user = request.user
        garden_id = request.GET.get('gardenId')
        if garden_id:
            user_plants = UserPlant.objects.filter(owner=user, garden_id=garden_id)
        else:
            user_plants = UserPlant.objects.filter(owner=user)
        serializer = UserPlantSerializer(user_plants.select_related('plant'), many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserPlantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserPlantDetailView(APIView):
    permission_classes = [IsAuthenticated]
    """Obtener, actualizar o eliminar una planta específica"""
    def get_object(self, pk):
        try:
            return UserPlant.objects.get(pk=pk)
        except UserPlant.DoesNotExist:
            return None

    def get(self, request, pk):
        plant = self.get_object(pk)
        if not plant:
            return Response({"error": "Plant not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserPlantSerializer(plant)
        return Response(serializer.data)

    def put(self, request, pk):
        plant = self.get_object(pk)
        if not plant:
            return Response({"error": "Plant not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserPlantSerializer(plant, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        plant = self.get_object(pk)
        if not plant:
            return Response({"error": "Plant not found"}, status=status.HTTP_404_NOT_FOUND)
        plant.delete()
        return Response({"message": "Plant deleted"}, status=status.HTTP_204_NO_CONTENT)
    
class TrefflePlantDetail(APIView):
    """Obtener información de plantas desde Treffle API por id o por nombre"""
    def get(self, request):
        plant_id = request.GET.get('id')
        url = f"https://trefle.io/api/v1/plants/{plant_id}"
        params = {
            'token': TREFLE_TOKEN
        }
        response = requests.get(url, params=params)
        data = response.json()
        
        # Scrapeo información adicional de perenual
        plant_name = data.get('data', {}).get('common_name') or data.get('data', {}).get('scientific_name')
        if plant_name:
            search_url = f"https://perenual.com/plant-database-search-guide?search={plant_name}"
            search_resp = requests.get(search_url)
            soup = BeautifulSoup(search_resp.text, "html.parser")
            # Encuentra el primer enlace de ficha de planta
            main_tag = soup.find("main")
            plant_link = main_tag.find("a") if main_tag else None
            if plant_link and plant_link['href']:
                ficha_url = plant_link['href']
                ficha_resp = requests.get(ficha_url)
                ficha_soup = BeautifulSoup(ficha_resp.text, "html.parser")
                watering_section = ficha_soup.find("h3", string="watering")
                watering_info = None
                if watering_section:
                    parent_div = watering_section.find_parent("div", class_="rounded-md shadow p-3")
                    if parent_div:
                        watering_p = parent_div.find("p")
                        if watering_p:
                            watering_info = watering_p.get_text(strip=True)
                sunlight_info = None
                sunlight_section = ficha_soup.find("h3", string="sunlight")
                if sunlight_section:
                    parent_div = sunlight_section.find_parent("div", class_="rounded-md shadow p-3")
                    if parent_div:
                        sunlight_p = parent_div.find("p")
                        if sunlight_p:
                            sunlight_info = sunlight_p.get_text(strip=True)

                pruning_info = None
                pruning_section = ficha_soup.find("h3", string="pruning")
                if pruning_section:
                    parent_div = pruning_section.find_parent("div", class_="rounded-md shadow p-3")
                    if parent_div:
                        pruning_p = parent_div.find("p")
                        if pruning_p:
                            pruning_info = pruning_p.get_text(strip=True)

                data['sunlight_info'] = sunlight_info
                data['pruning_info'] = pruning_info
                data['watering_info'] = watering_info
        
        # Elimina campos no deseados del diccionario 'data'
        campos_a_eliminar = ['main_species', 'species', 'sources']  # Ejemplo de campos a quitar
        if 'data' in data and isinstance(data['data'], dict):
            for campo in campos_a_eliminar:
                data['data'].pop(campo, None)
            
        return JsonResponse(data)
    
class TrefflePlantList(APIView):
    """Obtener una lista de plantas desde Treffle API"""
    def get(self, request):
        page = request.GET.get('page', 1)
        plant_id = request.GET.get('id')
        common_name = request.GET.get('common_name')
        scientific_name = request.GET.get('scientific_name')

        if plant_id:
            return self.get_by_id(plant_id, page)
        elif common_name:
            return self.get_by_common_name(common_name, page)
        elif scientific_name:
            return self.get_by_scientific_name(scientific_name, page)
        else:
            url = "https://trefle.io/api/v1/plants"
            params = {
                'token': TREFLE_TOKEN,
                'page': page
            }
            response = requests.get(url, params=params)
            data = response.json()
            return JsonResponse(data)

    def get_by_id(self, plant_id, page):
        url = f"https://trefle.io/api/v1/plants/{plant_id}"
        params = {
            'token': TREFLE_TOKEN,
            'page': page
        }
        response = requests.get(url, params=params)
        data = response.json()
        return JsonResponse(data)

    def get_by_common_name(self, name, page):
        url = "https://trefle.io/api/v1/plants"
        params = {
            'token': TREFLE_TOKEN,
            'filter[common_name]': name,
            'page': page
        }
        response = requests.get(url, params=params)
        data = response.json()
        return JsonResponse(data)

    def get_by_scientific_name(self, name, page):
        url = "https://trefle.io/api/v1/plants"
        params = {
            'token': TREFLE_TOKEN,
            'filter[scientific_name]': name,
            'page': page
        }
        response = requests.get(url, params=params)
        data = response.json()
        return JsonResponse(data)
    
class PlantInfoListView(generics.ListAPIView):
    queryset = PlantInfo.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        name = self.request.GET.get('name')
        plant_type = self.request.GET.get('type')
        if name:
            queryset = queryset.filter(
                Q(common_name__icontains=name) | Q(scientific_name__icontains=name)
            )
        if plant_type:
            queryset = queryset.filter(type__iexact=plant_type)
        try:
            page = int(self.request.GET.get('page', 1))
        except (TypeError, ValueError):
            page = 1
        page_size = 20
        start = (page - 1) * page_size
        end = start + page_size
        return queryset[start:end]
    
    serializer_class = PlantInfoSerializer
    
    
class PlantInfoDetailView(APIView):
    """Obtener información de PlantInfo por id"""
    def get(self, request, pk):
        try:
            plant_info = PlantInfo.objects.get(pk=pk)
        except PlantInfo.DoesNotExist:
            return Response({"error": "PlantInfo not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = PlantInfoSerializer(plant_info)
        return Response(serializer.data)
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
class UserRegisterView(APIView):
    """Endpoint para registrar nuevos usuarios"""
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            #serializer.save()
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Usuario creado correctamente",
                "refresh": str(refresh),
                "access": str(refresh.access_token)
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        user_plants = UserPlant.objects.filter(owner=request.user)
        today_tasks = []
        next_tasks = []
        previous_tasks = []
        
        for plant in user_plants:
            serializer = UserPlantSerializer(plant)
            plant_data = serializer.data

            # Riego
            next_watering_date = serializer.get_next_watering_date(plant)
            if next_watering_date:
                date = next_watering_date.date() if hasattr(next_watering_date, "date") else next_watering_date
                task = {"type": "watering", "next_date": date, "user_plant": plant_data}
                if date == today:
                    today_tasks.append(task)
                elif date > today:
                    next_tasks.append(task)
                elif date < today:
                    previous_tasks.append(task)

            # Poda
            next_pruning_date = serializer.get_next_pruning_date(plant) if hasattr(serializer, "get_next_pruning_date") else None
            if next_pruning_date:
                date = next_pruning_date.date() if hasattr(next_pruning_date, "date") else next_pruning_date
                task = {"type": "pruning", "next_date": date, "user_plant": plant_data}
                if date == today:
                    today_tasks.append(task)
                elif date > today:
                    next_tasks.append(task)
                elif date < today:
                    previous_tasks.append(task)

            # Pulverización
            next_spraying_date = serializer.get_next_spraying_date(plant) if hasattr(serializer, "get_next_spraying_date") else None
            if next_spraying_date:
                date = next_spraying_date.date() if hasattr(next_spraying_date, "date") else next_spraying_date
                task = {"type": "spraying", "next_date": date, "user_plant": plant_data}
                if date == today:
                    today_tasks.append(task)
                elif date > today:
                    next_tasks.append(task)
                elif date < today:
                    previous_tasks.append(task)

            # Rotación
            next_rotating_date = serializer.get_next_rotating_date(plant) if hasattr(serializer, "get_next_rotating_date") else None
            if next_rotating_date:
                date = next_rotating_date.date() if hasattr(next_rotating_date, "date") else next_rotating_date
                task = {"type": "rotating", "next_date": date, "user_plant": plant_data}
                if date == today:
                    today_tasks.append(task)
                elif date > today:
                    next_tasks.append(task)
                elif date < today:
                    previous_tasks.append(task)

            # Fertilización
            next_fertilizing_date = serializer.get_next_fertilizing_date(plant) if hasattr(serializer, "get_next_fertilizing_date") else None
            if next_fertilizing_date:
                date = next_fertilizing_date.date() if hasattr(next_fertilizing_date, "date") else next_fertilizing_date
                task = {"type": "fertilizing", "next_date": date, "user_plant": plant_data}
                if date == today:
                    today_tasks.append(task)
                elif date > today:
                    next_tasks.append(task)
                elif date < today:
                    previous_tasks.append(task)

        return Response({
            "today_tasks": today_tasks,
            "next_tasks": next_tasks,
            "previous_tasks": previous_tasks
        })
        
model = load_model('./models/plant_model.h5')
#model = load_model('./models/plant_identify.h5')
#model = load_model('./models/model169_4.h5')

class PredictImageView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        image_file = request.FILES['image']
        #img = Image.open(image_file).resize((180, 180))  # ajusta tamaño según tu modelo
        #img_array = np.expand_dims(img, axis=0)
        
        # Plantnet
        img = Image.open(image_file).resize((180, 180))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0  # Normalizing the image
        
        prediction = model.predict(img_array)
        score = tf.nn.softmax(prediction[0])
        with open('plantnet_classes.json', 'r') as f:
            class_names = json.load(f)
         # Obtener los índices de las 10 clases con mayor confianza
        top_indices = np.argsort(score)[-10:][::-1]
        top_classes = [class_names[i] for i in top_indices]
        top_confidences = [100 * score[i].numpy() for i in top_indices]
        # Obtener los nombres científicos de las 10 clases
        with open('plantnet300K_species_names.json', 'r') as f:
            species_names = json.load(f)
        top_scientific_names = [species_names.get(cls, cls).replace('_', ' ') for cls in top_classes]
        print("Top 10 clases: ", top_classes)
        print("Confianzas: ", top_confidences)
        print("Nombres científicos: ", top_scientific_names)
        #class_names = ['aloevera', 'banana', 'bilimbi', 'cantaloupe', 'cassava', 'coconut', 'corn', 'cucumber', 'curcuma', 'eggplant', 'galangal', 'ginger', 'guava', 'kale', 'longbeans', 'mango', 'melon', 'orange', 'paddy', 'papaya', 'peperchili', 'pineapple', 'pomelo', 'shallot', 'soybeans', 'spinach', 'sweetpotatoes', 'tobacco', 'waterapple', 'watermelon']
        
        predicted_class = class_names[np.argmax(score)]
        confidence = 100 * np.max(score)
        print("Clase predecida: ", predicted_class, " Confidence: ", confidence)
        with open('plantnet300K_species_names.json', 'r') as f:
            species_names = json.load(f)
        predicted_scientific_name = species_names.get(predicted_class, predicted_class)
        predicted_scientific_name = predicted_scientific_name.replace('_', ' ')
        print("Nombre científico predicho: ", predicted_scientific_name)
        # Busca la planta en la base de datos
        plant_info = PlantInfo.objects.filter(scientific_name__icontains=predicted_scientific_name).first()
        plant_id = plant_info.id if plant_info else None
        print("ID de planta predicho: ", plant_id, " Nombre: ", plant_info.scientific_name if plant_info else "No encontrado")
        return Response({
            'class': predicted_class,
            'confidence': confidence,
            'probabilities': score.numpy().tolist(),
            'plant_id': plant_id
        })
        
class WeatherRecommendationView(APIView):
    """
    Recibe la localización (lat, lon) y devuelve el tiempo actual y una recomendación según weather_conditions.json
    """
    def get(self, request):
        lat = request.GET.get('lat')
        lon = request.GET.get('lon')
        if not lat or not lon:
            return Response({"error": "lat and lon are required"}, status=status.HTTP_400_BAD_REQUEST)

        OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY") or "065567f9c5b59e914f4353d5869c52ce"
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric&lang=es"
        response = requests.get(url)
        if response.status_code != 200:
            return Response({"error": "Error fetching weather"}, status=status.HTTP_502_BAD_GATEWAY)
        weather_data = response.json()

        # Determina la condición principal
        main_condition = weather_data.get("weather", [{}])[0].get("main", "").lower()
        temp = weather_data.get("main", {}).get("temp")
        # Puedes añadir lógica extra para hot/cold/frost/dry/humid según temp y otros datos

        # Mapear condiciones de OpenWeather a tus condiciones
        condition_map = {
            "rain": "rain",
            "clear": "sunny",
            "clouds": "cloudy",
            "wind": "windy",
            "snow": "frost",
            "drizzle": "rain",
            "thunderstorm": "rain",
            # Puedes añadir más mapeos si lo necesitas
        }
        mapped_condition = condition_map.get(main_condition, main_condition)

        # Lógica adicional para hot/cold/dry/humid
        if temp is not None:
            if temp >= 30:
                mapped_condition = "hot"
            elif temp <= 5:
                mapped_condition = "cold"
            elif temp <= 0:
                mapped_condition = "frost"
            elif weather_data.get("main", {}).get("humidity", 50) >= 80:
                mapped_condition = "humid"
            elif weather_data.get("main", {}).get("humidity", 50) <= 30:
                mapped_condition = "dry"

        # Carga recomendaciones
        with open(os.path.join(os.path.dirname(__file__), "../weather_conditions.json"), "r", encoding="utf-8") as f:
            conditions = json.load(f)["weather_conditions"]

        recommendation = next(
            (c["recommendation"] for c in conditions if c["condition"] == mapped_condition),
            "No hay recomendación específica para este clima."
        )

        return Response({
            "weather": weather_data,
            "recommendation": recommendation,
            "condition": mapped_condition
        })
        
