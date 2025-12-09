from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
import requests
from django.http import JsonResponse
from .models import Garden, UserPlant, PlantInfo, Post, Comment, Vote
from .serializers import PostSerializer, CommentSerializer, GardenSimpleSerializer, UserRegisterSerializer, GardenSerializer, UserPlantSerializer, PlantInfoSerializer, CustomTokenObtainPairSerializer, VoteSerializer
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
from google import genai
from google.genai import types
from dotenv import load_dotenv

TREFLE_API_URL = "https://trefle.io/api/v1/plants"
TREFLE_TOKEN = "qD5bYaqpif9la_ZYT6zOPTe5icGrGiJAOlDacDK0Fic" 

PERENUAL_API_URL = "https://perenual.com/api/v2"
PERENUAL_API_KEY = os.getenv('PERENUAL_API_KEY') or "sk-pQXu688cc3229ec5b11655" 

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
        serializer = UserPlantSerializer(user_plants, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserPlantSerializer(data=request.data)
        
        # Si faltan campos, hacer petición a Perenual API
        plant_id = request.data.get('plant_id')
        if plant_id and (not request.data.get('common_name') or not request.data.get('watering_period') or not request.data.get('image')):
            try:
                url = f"{PERENUAL_API_URL}/species/details/{plant_id}"
                params = {'key': PERENUAL_API_KEY}
                response = requests.get(url, params=params)
            
                if response.status_code == 200:
                    perenual_data = response.json()
                
                    # Actualizar datos del request con información de Perenual
                    request_data = request.data.copy()
                
                    if not request_data.get('common_name') and perenual_data.get('common_name'):
                        request_data['common_name'] = perenual_data['common_name']
                
                    if not request_data.get('watering_period') and perenual_data.get('watering_general_benchmark'):
                        watering_data = perenual_data.get('watering_general_benchmark', {})
                        if isinstance(watering_data, dict):
                            value = watering_data.get('value', '').replace('"', '')
                            unit = watering_data.get('unit', '')
                            request_data['watering_period'] = f"{value} {unit}".strip()
                        else:
                            request_data['watering_period'] = perenual_data['watering_general_benchmark']
                
                    if not request_data.get('image') and perenual_data.get('default_image', {}).get('regular_url'):
                        request_data['image'] = perenual_data['default_image']['regular_url']
                
                    # Recrear el serializer con los datos actualizados
                    serializer = UserPlantSerializer(data=request_data)
                
            except Exception as e:
                print(f"Error fetching plant details from Perenual: {str(e)}")
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
        plant_data = serializer.data
        
        # Hacer petición a Perenual para obtener detalles adicionales
        if plant.plant_id:
            try:
                url = f"{PERENUAL_API_URL}/species/details/{plant.plant_id}"
                params = {
                    'key': PERENUAL_API_KEY
                }
                
                response = requests.get(url, params=params)
                
                if response.status_code == 200:
                    perenual_data = response.json()
                    
                    # Obtener información de cuidados desde care_guides si existe
                    if 'care_guides' in perenual_data:
                        care_guides_url = perenual_data['care_guides']
                        try:
                            care_response = requests.get(care_guides_url)
                            if care_response.status_code == 200:
                                care_data = care_response.json()
                                # Procesar la información de cuidados
                                if care_data.get('data') and len(care_data['data']) > 0:
                                    first_guide = care_data['data'][0]
                                    if 'section' in first_guide:
                                        # Extraer watering, pruning y sunlight descriptions
                                        for section in first_guide['section']:
                                            section_type = section.get('type')
                                            if section_type == 'watering':
                                                perenual_data['watering_long'] = section.get('description', '')
                                            elif section_type == 'pruning':
                                                perenual_data['pruning'] = section.get('description', '')
                                            elif section_type == 'sunlight':
                                                perenual_data['sunlight_long'] = section.get('description', '')
                        except Exception as care_e:
                            print(f"Error fetching care guides: {str(care_e)}")
                    
                    # Agregar los datos de Perenual a la respuesta
                    plant_data['perenual_details'] = perenual_data
                    
                elif response.status_code != 404:
                    # Si hay error pero no es 404, agregar información del error
                    plant_data['perenual_details'] = {
                        'error': f"Failed to fetch plant details from Perenual API (status: {response.status_code})"
                    }
                    
            except Exception as e:
                # En caso de error de conexión, agregar información del error pero continuar
                plant_data['perenual_details'] = {
                    'error': f"Error connecting to Perenual API: {str(e)}"
                }
        
        return Response(plant_data)

    def put(self, request, pk):
        plant = self.get_object(pk)
        if not plant:
            return Response({"error": "Plant not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserPlantSerializer(plant, data=request.data)
        if serializer.is_valid():
            updated_plant = serializer.save()
            
            # Obtener el serializer data actualizado
            updated_serializer = UserPlantSerializer(updated_plant)
            plant_data = updated_serializer.data
            
            # Hacer petición a Perenual para obtener detalles adicionales
            if updated_plant.plant_id:
                try:
                    url = f"{PERENUAL_API_URL}/species/details/{updated_plant.plant_id}"
                    params = {
                        'key': PERENUAL_API_KEY
                    }
                    
                    response = requests.get(url, params=params)
                    
                    if response.status_code == 200:
                        perenual_data = response.json()
                        
                        # Obtener información de cuidados desde care_guides si existe
                        if 'care_guides' in perenual_data:
                            care_guides_url = perenual_data['care_guides']
                            try:
                                care_response = requests.get(care_guides_url)
                                if care_response.status_code == 200:
                                    care_data = care_response.json()
                                    # Procesar la información de cuidados
                                    if care_data.get('data') and len(care_data['data']) > 0:
                                        first_guide = care_data['data'][0]
                                        if 'section' in first_guide:
                                            # Extraer watering, pruning y sunlight descriptions
                                            for section in first_guide['section']:
                                                section_type = section.get('type')
                                                if section_type == 'watering':
                                                    perenual_data['watering_long'] = section.get('description', '')
                                                elif section_type == 'pruning':
                                                    perenual_data['pruning'] = section.get('description', '')
                                                elif section_type == 'sunlight':
                                                    perenual_data['sunlight_long'] = section.get('description', '')
                            except Exception as care_e:
                                print(f"Error fetching care guides: {str(care_e)}")
                        
                        # Agregar los datos de Perenual a la respuesta
                        plant_data['perenual_details'] = perenual_data
                        
                    elif response.status_code != 404:
                        # Si hay error pero no es 404, agregar información del error
                        plant_data['perenual_details'] = {
                            'error': f"Failed to fetch plant details from Perenual API (status: {response.status_code})"
                        }
                        
                except Exception as e:
                    # En caso de error de conexión, agregar información del error pero continuar
                    plant_data['perenual_details'] = {
                        'error': f"Error connecting to Perenual API: {str(e)}"
                    }
            
            return Response(plant_data)
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
        
#model = load_model('./models/plant_model.h5')
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
        
class UserPostView(APIView):
    permission_classes = [IsAuthenticated]
    """CRUD para posts de usuarios"""
    def get(self, request):
        posts = request.user.posts.all()
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            post = serializer.save(author=request.user)
            # Devolver el post creado con el contexto para incluir user_vote
            response_serializer = PostSerializer(post, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PlantInfoPostView(APIView):
    """Obtener todos los posts de una planta específica"""
    def get(self, request, pk):
        posts = Post.objects.filter(plant_info_id=pk)
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)    
    
class PostDetailView(APIView):
    """Obtener, actualizar o eliminar un post específico"""
    def get_object(self, pk):
        try:
            return Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return None

    def get(self, request, pk):
        post = self.get_object(pk)
        if not post:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        post = self.get_object(pk)
        if not post:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = PostSerializer(post, data=request.data, context={'request': request})
        if serializer.is_valid():
            updated_post = serializer.save()
            # Devolver el post actualizado con el contexto para incluir user_vote
            response_serializer = PostSerializer(updated_post, context={'request': request})
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        post = self.get_object(pk)
        if not post:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        post.delete()
        return Response({"message": "Post deleted"}, status=status.HTTP_204_NO_CONTENT)
    
class CommentView(APIView):
    permission_classes = [IsAuthenticated]
    """CRUD para comentarios de usuarios"""
    def get(self, request):
        comments = request.user.comments.all()
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PostVoteView(APIView):
    permission_classes = [IsAuthenticated]
    """Votar en un post"""
    
    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        
        vote_type = request.data.get('vote_type')
        if vote_type not in ['like', 'dislike']:
            return Response(
                {"error": "vote_type must be 'like' or 'dislike'"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar voto existente del usuario para este post
        vote, created = Vote.objects.get_or_create(
            user=request.user,
            post=post,
            defaults={'vote_type': vote_type}
        )
        
        if not created:
            # Si ya existe un voto
            if vote.vote_type == vote_type:
                # Si es el mismo voto, lo eliminamos (toggle)
                vote.delete()
                action = 'removed'
            else:
                # Si es diferente, lo actualizamos
                vote.vote_type = vote_type
                vote.save()
                action = 'updated'
        else:
            action = 'created'
        
        # Devolver estado actualizado
        return Response({
            'action': action,
            'vote_type': vote_type if action != 'removed' else None,
            'vote_score': post.get_vote_score(),
            'likes_count': post.get_likes_count(),
            'dislikes_count': post.get_dislikes_count(),
            'user_vote': post.get_user_vote(request.user)
        })

class CommentVoteView(APIView):
    permission_classes = [IsAuthenticated]
    """Votar en un comentario"""
    
    def post(self, request, pk):
        try:
            comment = Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
            return Response({"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)
        
        vote_type = request.data.get('vote_type')
        if vote_type not in ['like', 'dislike']:
            return Response(
                {"error": "vote_type must be 'like' or 'dislike'"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar voto existente del usuario para este comentario
        vote, created = Vote.objects.get_or_create(
            user=request.user,
            comment=comment,
            defaults={'vote_type': vote_type}
        )
        
        if not created:
            # Si ya existe un voto
            if vote.vote_type == vote_type:
                # Si es el mismo voto, lo eliminamos (toggle)
                vote.delete()
                action = 'removed'
            else:
                # Si es diferente, lo actualizamos
                vote.vote_type = vote_type
                vote.save()
                action = 'updated'
        else:
            action = 'created'
        
        # Devolver estado actualizado
        return Response({
            'action': action,
            'vote_type': vote_type if action != 'removed' else None,
            'vote_score': comment.get_vote_score(),
            'likes_count': comment.get_likes_count(),
            'dislikes_count': comment.get_dislikes_count(),
            'user_vote': comment.get_user_vote(request.user)
        })

class PerenualPlantListView(APIView):
    """Obtener lista de plantas desde Perenual API"""
    def get(self, request):
        page = request.GET.get('page', 1)
        q = request.GET.get('q', '')  # Búsqueda por nombre
        indoor = request.GET.get('indoor', None)  # Filtro para plantas de interior
        hardiness = request.GET.get('hardiness', None)  # Zona de resistencia
        watering = request.GET.get('watering', None)  # Frecuencia de riego
        sunlight = request.GET.get('sunlight', None)  # Requerimientos de luz
        
        try:
            url = f"{PERENUAL_API_URL}/species-list"
            params = {
                'key': PERENUAL_API_KEY,
                'page': page
            }
            
            # Añadir parámetros de filtros si están presentes
            if q:
                params['q'] = q
            if indoor is not None:
                params['indoor'] = indoor
            if hardiness:
                params['hardiness'] = hardiness
            if watering:
                params['watering'] = watering
            if sunlight:
                params['sunlight'] = sunlight
            
            response = requests.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                # Filtrar solo los campos deseados
                if 'data' in data:
                    filtered_data = []
                    for plant in data['data']:
                        filtered_plant = {
                            'id': plant.get('id'),
                            'common_name': plant.get('common_name'),
                            'scientific_name': plant.get('scientific_name'),
                            'default_image': plant.get('default_image')
                        }
                        filtered_data.append(filtered_plant)
                    data['data'] = filtered_data
                return Response(data)
            
            if response.status_code == 200:
                data = response.json()
                return Response(data)
            else:
                return Response(
                    {"error": "Failed to fetch plants from Perenual API"}, 
                    status=response.status_code
                )
                
        except Exception as e:
            return Response(
                {"error": "Error connecting to Perenual API", "details": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PerenualPlantDetailView(APIView):
    """Obtener detalles de una planta específica desde Perenual API"""
    def get(self, request, plant_id):
        try:
            url = f"{PERENUAL_API_URL}/species/details/{plant_id}"
            params = {
                'key': PERENUAL_API_KEY
            }
            
            response = requests.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                # Obtener información de cuidados desde care_guides si existe
                if 'care_guides' in data:
                    care_guides_url = data['care_guides']
                    try:
                        care_response = requests.get(care_guides_url)
                        if care_response.status_code == 200:
                            care_data = care_response.json()
                            # Procesar la información de cuidados
                            if care_data.get('data') and len(care_data['data']) > 0:
                                first_guide = care_data['data'][0]
                                if 'section' in first_guide:
                                    # Extraer watering, pruning y sunlight descriptions
                                    for section in first_guide['section']:
                                        section_type = section.get('type')
                                        if section_type == 'watering':
                                            data['watering_long'] = section.get('description', '')
                                        elif section_type == 'pruning':
                                            data['pruning'] = section.get('description', '')
                                        elif section_type == 'sunlight':
                                            data['sunlight_long'] = section.get('description', '')
                    except Exception as care_e:
                        print(f"Error fetching care guides: {str(care_e)}")
                
                return Response(data)
            elif response.status_code == 404:
                return Response(
                    {"error": "Plant not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            else:
                return Response(
                    {"error": "Failed to fetch plant details from Perenual API"}, 
                    status=response.status_code
                )
                
        except Exception as e:
            return Response(
                {"error": "Error connecting to Perenual API", "details": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GeminiPlantIdentificationView(APIView):
    parser_classes = [MultiPartParser]
    """Identificación de plantas usando Gemini AI"""
    
    def post(self, request):
        # Verificar que se envió una imagen
        if 'image' not in request.FILES:
            return Response(
                {"error": "No image provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        try:
            # Cargar variables de entorno
            load_dotenv()
            api_key = os.getenv('GEMINI_API_KEY')
            
            if not api_key:
                return Response(
                    {"error": "Gemini API key not configured"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Configurar cliente de Gemini
            client = genai.Client(api_key=api_key)
            
            # Leer los datos de la imagen
            image_data = image_file.read()
            
            # Determinar el tipo MIME de la imagen
            content_type = image_file.content_type
            if not content_type or not content_type.startswith('image/'):
                content_type = 'image/jpeg'  # Fallback por defecto
            
            # Hacer la petición a Gemini
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    types.Part.from_bytes(
                        data=image_data,
                        mime_type=content_type,
                    ),
                    '''Identify this plant and provide only the scientific names. List 3-5 potential identifications with their complete scientific names only, one per line, without numbers, formatting, or additional text.'''
                ]
            )
            
            # Procesar la respuesta de Gemini
            gemini_response = response.text.strip()
            print("Gemini response:", gemini_response)
            scientific_names = [name.strip() for name in gemini_response.split('\n') if name.strip()]
            print("Identified scientific names:", scientific_names)
            
            # Buscar plantas en la base de datos
            found_plants = []
            suggestions = []
            
            for scientific_name in scientific_names:
                # Buscar coincidencia exacta primero
                plant_info = PlantInfo.objects.filter(
                    scientific_name__iexact=scientific_name
                ).first()
                
                if plant_info:
                    found_plants.append({
                        'plant_info': PlantInfoSerializer(plant_info).data,
                        'confidence': 'high',
                        'match_type': 'exact',
                        'scientific_name': scientific_name
                    })
                else:
                    # Buscar coincidencias parciales
                    partial_matches = PlantInfo.objects.filter(
                        scientific_name__icontains=scientific_name.split()[0]  # Buscar por género
                    )[:3]
                    
                    for match in partial_matches:
                        suggestions.append({
                            'plant_info': PlantInfoSerializer(match).data,
                            'confidence': 'medium',
                            'match_type': 'partial',
                            'scientific_name': scientific_name,
                            'matched_name': match.scientific_name
                        })
            
            # Si no encontramos coincidencias exactas, buscar por nombre común
            if not found_plants:
                for scientific_name in scientific_names:
                    common_name_matches = PlantInfo.objects.filter(
                        common_name__icontains=scientific_name.split()[0]
                    )[:2]
                    
                    for match in common_name_matches:
                        suggestions.append({
                            'plant_info': PlantInfoSerializer(match).data,
                            'confidence': 'low',
                            'match_type': 'common_name',
                            'scientific_name': scientific_name,
                            'matched_name': match.common_name
                        })
            
            # Determinar la planta primaria basada en el primer resultado de Gemini
            primary_plant = None
            primary_plant_id = None
            confidence = 'low'  # Por defecto
            primary_scientific_name = scientific_names[0] if scientific_names else None
            
            if primary_scientific_name:
                # Intentar coincidencia exacta con el primer nombre
                primary = PlantInfo.objects.filter(
                    scientific_name__iexact=primary_scientific_name
                ).first()
                
                if primary:
                    primary_plant = primary
                    primary_plant_id = primary.id
                    confidence = 'high'
                else:
                    # Intentar coincidencias parciales por género (primer token)
                    genus = primary_scientific_name.split()[0]
                    partial = PlantInfo.objects.filter(scientific_name__icontains=genus).first()
                    if partial:
                        primary_plant = partial
                        primary_plant_id = partial.id
                        confidence = 'medium'
                    else:
                        # Intentar por nombre común
                        common = PlantInfo.objects.filter(common_name__icontains=genus).first()
                        if common:
                            primary_plant = common
                            primary_plant_id = common.id
                            confidence = 'low'
            
            return Response({
                'class': primary_scientific_name,
                'confidence': confidence,
                'plant_id': primary_plant_id,
                'plant_info': PlantInfoSerializer(primary_plant).data if primary_plant else None,
                'gemini_response': gemini_response,
                'identified_names': scientific_names
            })
            
        except Exception as e:
            return Response(
                {
                    "error": "Failed to identify plant",
                    "details": str(e)
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )