from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
import requests
from django.http import JsonResponse
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Garden, UserPlant, Post, Comment, Vote
from .serializers import PostSerializer, CommentSerializer, GardenSimpleSerializer, UserRegisterSerializer, GardenSerializer, UserPlantSerializer, CustomTokenObtainPairSerializer, VoteSerializer, UserSerializer, UserUpdateSerializer, ChangePasswordSerializer
from bs4 import BeautifulSoup
from django.utils import timezone
from django.db.models import Q
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import numpy as np
import json
from ultralytics import YOLO
import cv2
import os
from dotenv import load_dotenv
from urllib.parse import urlparse

# Ensure environment variables are loaded if a .env exists
load_dotenv()

PERENUAL_API_URL = "https://perenual.com/api/v2"
PERENUAL_PEST_API_URL = "https://perenual.com/api"


# Mock data helpers
def should_use_mock_data():
    """Determina si debe usar datos mock en lugar de la API real"""
    return os.getenv('USE_MOCK_DATA', 'True').lower() == 'true'

def load_perenual_diseases_cards():
    """Lee el JSON generado desde perenual_diseases.html y devuelve la lista de enfermedades (tarjetas).
    Formato esperado: array de objetos con href, image, name, solutions_count.
    """
    try:
        json_path = os.path.join(os.path.dirname(__file__), '..', 'perenual_diseases_list.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except FileNotFoundError:
        print("Warning: perenual_diseases_list.json not found")
        return []
    except Exception as e:
        print(f"Error reading perenual_diseases_list.json: {e}")
        return []

def load_species_details_mock():
    """Carga los datos mock de species-details"""
    try:
        with open(os.path.join(os.path.dirname(__file__), '..', 'species-details-mock.json'), 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: species-details-mock.json not found")
        return []

def load_species_list_mock():
    """Carga los datos mock de species-list"""
    try:
        with open(os.path.join(os.path.dirname(__file__), '..', 'species-list-mock.json'), 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: species-list-mock.json not found")
        return {"data": []}

def load_disease_list_mock():
    """Carga los datos mock de pest/disease list"""
    try:
        with open(os.path.join(os.path.dirname(__file__), '..', 'disease-list-mock.json'), 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: disease-list-mock.json not found")
        return {"data": []}

def get_mock_species_details(plant_id):
    """Obtiene los detalles de una planta específica desde los datos mock"""
    mock_data = load_species_details_mock()
    for plant in mock_data:
        if plant.get('id') == int(plant_id):
            return plant
    return None

def search_mock_species_list(query=None, page=1):
    """Busca plantas en los datos mock"""
    mock_data = load_species_list_mock()
    plants = mock_data.get('data', [])
    
    if query:
        # Filtrar por nombre común o científico
        query_lower = query.lower()
        filtered_plants = []
        for plant in plants:
            common_name = plant.get('common_name', '').lower()
            scientific_names = plant.get('scientific_name', [])
            scientific_match = any(name.lower() for name in scientific_names if query_lower in name.lower())
            
            if query_lower in common_name or scientific_match:
                filtered_plants.append(plant)
        plants = filtered_plants
    
    # Simular paginación (30 plantas por página)
    per_page = 30
    start_index = (page - 1) * per_page
    end_index = start_index + per_page
    
    return {
        'data': plants[start_index:end_index],
        'to': min(end_index, len(plants)),
        'per_page': per_page,
        'current_page': page,
        'from': start_index + 1 if plants else 0,
        'last_page': (len(plants) + per_page - 1) // per_page,
        'total': len(plants)
    }

def search_mock_disease_list(query=None, page=1, item_id=None):
    """Busca plagas/enfermedades en los datos mock"""
    mock_data = load_disease_list_mock()
    items = mock_data.get('data', [])

    # Filtrar por id si se proporciona
    if item_id:
        try:
            item_id_int = int(item_id)
        except (TypeError, ValueError):
            item_id_int = None
        if item_id_int is not None:
            items = [i for i in items if i.get('id') == item_id_int]
            return {'data': items, 'total': len(items), 'current_page': 1, 'per_page': len(items), 'from': 1 if items else 0, 'to': len(items), 'last_page': 1}

    if query:
        query_lower = query.lower()
        filtered = []
        for item in items:
            name = str(item.get('name', '')).lower()
            desc = str(item.get('description', '')).lower()
            if query_lower in name or query_lower in desc:
                filtered.append(item)
        items = filtered

    # Paginación simple
    per_page = 30
    start_index = (page - 1) * per_page
    end_index = start_index + per_page
    return {
        'data': items[start_index:end_index],
        'to': min(end_index, len(items)),
        'per_page': per_page,
        'current_page': page,
        'from': start_index + 1 if items else 0,
        'last_page': (len(items) + per_page - 1) // per_page,
        'total': len(items)
    }

# CRUD para Garden
class GardenListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    """Obtener todos los jardines o crear uno nuevo"""
    def get(self, request):
        gardens = Garden.objects.filter(owner=request.user)
        serializer = GardenSerializer(gardens, many=True, context={'request': request})
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

class GardenTemplatesView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated]
    """Obtener solo los jardines plantilla (templates)"""
    def get(self, request):
        templates = Garden.objects.filter(is_template=True)
        serializer = GardenSerializer(templates, many=True, context={'request': request})
        return Response(serializer.data)


class GardenDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
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
        return Response({"message": "Garden deleted"}, status=status.HTTP_200_OK)

class GardenSuitabilityView(APIView):
    permission_classes = [IsAuthenticated]
    """
    Recibe el id de una planta y devuelve todos los jardines del usuario con un texto explicativo de si es óptimo o no para esa planta.
    """
    def get(self, request):
        plant_id = request.GET.get('plant_id')
        if not plant_id:
            return Response({"error": "plant_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Obtiene la información de la planta
        if should_use_mock_data():
            print("Using mock data for Perenual API")
            plant = get_mock_species_details(plant_id)
        else:
            print("Fetching plant details from Perenual API")
            # Read API key at request time and validate
            api_key = os.getenv('PERENUAL_API_KEY')
            if not api_key:
                return Response(
                    {"error": "Perenual API key not configured", "env": "Missing PERENUAL_API_KEY"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            try:
                url = f"{PERENUAL_API_URL}/species/details/{plant_id}"
                params = {
                    'key': api_key
                }

                response = requests.get(url, params=params)

                if response.status_code == 200:
                    plant = response.json()
            except Exception as e:
                return Response(
                    {"error": "Error connecting to Perenual API", "details": str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        print(f"Evaluating suitability for plant: {plant.get('common_name')}")

        gardens = Garden.objects.filter(owner=request.user)
        results = []
        for garden in gardens:
            reasons = []
            is_optimal = True
        
            # Evaluación de humedad usando el atributo 'watering' de Perenual
            if plant.get('watering') and garden.humidity:
                plant_watering = plant.get('watering').lower()
                garden_humidity = garden.humidity.lower()
                
                # Mapear watering de Perenual a las opciones de humedad del jardín
                if plant_watering == "frequent" and garden_humidity != "high":
                    is_optimal = False
                    reasons.append("La planta necesita riego frecuente pero el jardín tiene baja/normal humedad.")
                elif plant_watering == "minimal" and garden_humidity == "high":
                    is_optimal = False
                    reasons.append("La planta necesita riego mínimo pero el jardín tiene alta humedad.")
                elif plant_watering == "average" and garden_humidity == "low":
                    is_optimal = False
                    reasons.append("La planta necesita riego promedio pero el jardín tiene baja humedad.")

            # Evaluación de luz usando el atributo 'sunlight' de Perenual
            if plant.get('sunlight') and garden.sunlight_exposure:
                try:
                    # sunlight puede ser un string JSON o ya una lista
                    if isinstance(plant.get('sunlight'), str):
                        plant_sunlight_list = json.loads(plant.get('sunlight'))
                    else:
                        plant_sunlight_list = plant.get('sunlight')
                    
                    garden_light = garden.sunlight_exposure
                    
                    # Mapear opciones de sunlight de Perenual a las del jardín
                    sunlight_mapping = {
                        "full sun": "full_sun",
                        "part sun": "partial_sun", 
                        "part shade": "indirect_sun",
                        "full shade": "full_shade"
                    }
                    
                    # Convertir los requisitos de luz de la planta al formato del jardín
                    compatible_lights = []
                    for light in plant_sunlight_list:
                        mapped_light = sunlight_mapping.get(light.lower())
                        if mapped_light:
                            compatible_lights.append(mapped_light)
                    
                    # Verificar si la luz del jardín es compatible
                    if compatible_lights and garden_light not in compatible_lights:
                        is_optimal = False
                        light_names = [k for k, v in sunlight_mapping.items() if v in compatible_lights]
                        reasons.append(f"La luz no es adecuada. La planta necesita: {', '.join(light_names)}")
                        
                except (json.JSONDecodeError, TypeError):
                    # Si hay error al parsear sunlight, continuar sin evaluar luz
                    pass
        
            # Evaluación de ubicación usando el atributo 'indoor' de Perenual
            if plant.get('indoor') is not None and garden.location:
                plant_indoor = str(plant.get('indoor')).lower() == "true"
                garden_location = garden.location.lower()
                print(f"Plant indoor: {plant_indoor}, Garden location: {garden_location}")
                if plant_indoor and garden_location == "outdoor":
                    is_optimal = False
                    reasons.append("La planta es de interior, pero el lugar es exterior.")
                elif not plant_indoor and garden_location == "indoor":
                    is_optimal = False
                    reasons.append("La planta es de exterior, pero el lugar es interior.")
            
            # Evaluación de corrientes de aire
            if plant.get('indoor') is not None and garden.air is not None:
                plant_indoor = str(plant.get('indoor')).lower() == "true"
                if plant_indoor and garden.air:
                    is_optimal = False
                    reasons.append("La planta es de interior pero el jardín tiene corrientes de aire.")
            
            # Explicación final
            if is_optimal:
                texto = "Este jardín es óptimo para la planta según sus necesidades de riego, luz y ubicación."
            else:
                texto = "Este jardín NO es óptimo para la planta: " + " ".join(reasons)
        
            results.append({
                "garden": GardenSerializer(garden, context={'request': request}).data,
                "is_optimal": is_optimal,
                "reasons": reasons,
            })

        return Response(results)

# CRUD para Plant
class UserPlantListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    """Obtener todas las plantas o crear una nueva"""
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get(self, request):
        user = request.user
        garden_id = request.GET.get('gardenId')
        if garden_id:
            user_plants = UserPlant.objects.filter(owner=user, garden_id=garden_id)
        else:
            user_plants = UserPlant.objects.filter(owner=user)
        serializer = UserPlantSerializer(user_plants, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = UserPlantSerializer(data=request.data)
        
        plant_id = request.data.get('plant_id')
        if plant_id and (not request.data.get('common_name') or not request.data.get('watering_period') or not request.data.get('image')):
            try:
                if should_use_mock_data():
                    print("Using mock data for Perenual API")
                    perenual_data = get_mock_species_details(plant_id)
                    if not perenual_data:
                        return Response(
                            {"error": "Plant not found in mock data"},
                            status=status.HTTP_404_NOT_FOUND
                        )
                    request_data = request.data.copy()
                    return self.set_perenual_info(request_data, perenual_data, serializer, plant_id)
                else:
                    print("Fetching plant details from Perenual API")
                    api_key = os.getenv('PERENUAL_API_KEY')
                    if not api_key:
                        return Response(
                        {"error": "Perenual API key not configured", "env": "Missing PERENUAL_API_KEY"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    url = f"{PERENUAL_API_URL}/species/details/{plant_id}"
                    params = {'key': api_key}
                    response = requests.get(url, params=params)

                    if response.status_code == 200:
                        perenual_data = response.json()

                        # Actualizar datos del request con información de Perenual
                        request_data = request.data.copy()

                        return self.set_perenual_info(request_data, perenual_data, serializer, plant_id)
                    else:
                        return Response(response.json(), status=status.HTTP_429_TOO_MANY_REQUESTS)
            except Exception as e:
                print(f"Error fetching plant details from Perenual: {str(e)}")
        
        return Response({"error": "Se ha producido un error"}, status=status.HTTP_400_BAD_REQUEST)
    
    def set_perenual_info(self, request_data, perenual_data, serializer, plant_id):
        print(perenual_data)
        if not request_data.get('common_name') and perenual_data.get('common_name'):
            request_data['common_name'] = perenual_data['common_name']
                
        if not request_data.get('watering_period') and perenual_data.get('watering_general_benchmark'):
            watering_data = perenual_data.get('watering_general_benchmark', {})
            if isinstance(watering_data, dict):
                value = watering_data.get('value', '').replace('"', '')
                unit = watering_data.get('unit', '')
                request_data['watering_period'] = json.dumps({"value": value, "unit": unit})
            else:
                watering_str = perenual_data['watering_general_benchmark']
                # Dividir el string "7-10 days" en value y unit
                parts = watering_str.strip().split()
                if len(parts) >= 2:
                    value = parts[0]  # "7-10"
                    unit = ' '.join(parts[1:])  # "days"
                    request_data['watering_period'] = json.dumps({"value": value, "unit": unit})
        print("Dowloading image")
        try:
            img_url = perenual_data['default_image']['original_url']
            print(img_url)
            img_resp = requests.get(img_url, timeout=20)
            if img_resp.status_code == 200:
                print("Image downloaded successfully")
                img_content = img_resp.content
                filename = os.path.basename(urlparse(img_url).path) or f"plant_{plant_id}.jpg"
                content_type = img_resp.headers.get('Content-Type', 'image/jpeg')
                request_data['image'] = SimpleUploadedFile(filename, img_content, content_type=content_type)
        except Exception as e:
            return Response({"error": "Se ha producido un error"}, status=status.HTTP_400_BAD_REQUEST)
                
        # Recrear el serializer con los datos actualizados
        serializer = UserPlantSerializer(data=request_data)
        if serializer.is_valid():
            plant = serializer.save()
            # Usar self.request (propiedad de APIView) para el contexto del serializer
            return Response(
                UserPlantSerializer(plant, context={'request': self.request}).data,
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserPlantDetailView(APIView):
    permission_classes = [IsAuthenticated]
    """Obtener, actualizar o eliminar una planta específica"""
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get_object(self, pk):
        try:
            return UserPlant.objects.get(pk=pk)
        except UserPlant.DoesNotExist:
            return None

    def get(self, request, pk):
        plant = self.get_object(pk)
        if not plant:
            return Response({"error": "Plant not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserPlantSerializer(plant, context={'request': request})
        plant_data = serializer.data
        
        # Hacer petición a Perenual para obtener detalles adicionales
        if plant.plant_id:
            try:
                if should_use_mock_data():
                    print("Using mock data for Perenual API")
                    perenual_data = get_mock_species_details(plant.plant_id)
                    if perenual_data:
                        care_data = perenual_data.get('care_guides')
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
                        plant_data['perenual_details'] = perenual_data
                else:
                    print("Fetching plant details from Perenual API")
                    api_key = os.getenv('PERENUAL_API_KEY')
                    if not api_key:
                        return Response(
                        {"error": "Perenual API key not configured", "env": "Missing PERENUAL_API_KEY"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    url = f"{PERENUAL_API_URL}/species/details/{plant.plant_id}"
                    params = {
                        'key': api_key
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
        
        # Añadir posts relacionados con esta planta (por plant_id)
        try:
            if plant.plant_id:
                posts_qs = Post.objects.filter(plant_id=plant.plant_id).order_by('-created_at')
                posts_serialized = PostSerializer(posts_qs, many=True, context={'request': request})
                plant_data['posts'] = posts_serialized.data
        except Exception as posts_e:
            # No bloquear la respuesta si falla la consulta de posts
            plant_data['posts_error'] = str(posts_e)

        return Response(plant_data)

    def put(self, request, pk):
        plant = self.get_object(pk)
        if not plant:
            return Response({"error": "Plant not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserPlantSerializer(plant, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated_plant = serializer.save()
            
            # Obtener el serializer data actualizado
            updated_serializer = UserPlantSerializer(updated_plant, context={'request': request})
            plant_data = updated_serializer.data
            
            # Hacer petición a Perenual para obtener detalles adicionales
            if updated_plant.plant_id:
                try:
                    if should_use_mock_data():
                        print("Using mock data for Perenual API")
                        perenual_data = get_mock_species_details(plant.plant_id)
                        if perenual_data:
                            care_data = perenual_data.get('care_guides')
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
                            plant_data['perenual_details'] = perenual_data
                    else:
                        print("Fetching plant details from Perenual API")
                        api_key = os.getenv('PERENUAL_API_KEY')
                        if not api_key:
                            return Response(
                            {"error": "Perenual API key not configured", "env": "Missing PERENUAL_API_KEY"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                            )
                        url = f"{PERENUAL_API_URL}/species/details/{updated_plant.plant_id}"
                        params = {
                            'key': api_key
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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        plant = self.get_object(pk)
        if not plant:
            return Response({"error": "Plant not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserPlantSerializer(plant, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated_plant = serializer.save()
            
            # Obtener el serializer data actualizado
            updated_serializer = UserPlantSerializer(updated_plant, context={'request': request})
            plant_data = updated_serializer.data
            
            # Hacer petición a Perenual para obtener detalles adicionales
            if updated_plant.plant_id:
                try:
                    if should_use_mock_data():
                        print("Using mock data for Perenual API")
                        perenual_data = get_mock_species_details(plant.plant_id)
                        if perenual_data:
                            care_data = perenual_data.get('care_guides')
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
                            plant_data['perenual_details'] = perenual_data
                    else:
                        print("Fetching plant details from Perenual API")
                        api_key = os.getenv('PERENUAL_API_KEY')
                        if not api_key:
                            return Response(
                            {"error": "Perenual API key not configured", "env": "Missing PERENUAL_API_KEY"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                            )
                        url = f"{PERENUAL_API_URL}/species/details/{updated_plant.plant_id}"
                        params = {
                            'key': api_key
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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        plant = self.get_object(pk)
        if not plant:
            return Response({"error": "Plant not found"}, status=status.HTTP_404_NOT_FOUND)
        plant.delete()
        return Response({"message": "Plant deleted"}, status=status.HTTP_200_OK)  
    
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

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    """Devuelve los datos del usuario autenticado"""
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        """Actualizar username y email del usuario autenticado"""
        serializer = UserUpdateSerializer(request.user, data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    """Cambiar la contraseña del usuario autenticado"""
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'user': request.user})
        if not serializer.is_valid():
            # Construir un único mensaje legible a partir de los errores del serializer
            def _extract_messages(err):
                msgs = []
                if isinstance(err, dict):
                    for v in err.values():
                        msgs.extend(_extract_messages(v))
                elif isinstance(err, list):
                    for item in err:
                        msgs.extend(_extract_messages(item))
                else:
                    msgs.append(str(err))
                return msgs

            messages = _extract_messages(serializer.errors)
            return Response({'message': 'La contraseña no es válida. Debe contener al menos 8 caracteres y no ser común.'}, status=status.HTTP_400_BAD_REQUEST)

        current_password = serializer.validated_data.get('current_password')
        new_password = serializer.validated_data.get('new_password')

        # Validar contraseña actual
        if not request.user.check_password(current_password):
            return Response({'message': ['La contraseña actual no es correcta']}, status=status.HTTP_400_BAD_REQUEST)

        # Establecer nueva contraseña
        request.user.set_password(new_password)
        request.user.save()

        return Response({'message': 'Contraseña cambiada correctamente'})
    
class UserTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        user_plants = UserPlant.objects.filter(owner=request.user)
        today_tasks = []
        next_tasks = []
        previous_tasks = []
        
        for plant in user_plants:
            serializer = UserPlantSerializer(plant, context={'request': request})
            plant_data = serializer.data

            # Riego
            next_watering_date = serializer.get_next_watering_date(plant)
            if next_watering_date and plant_data.get('is_watering_enabled', True):
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
        
model = YOLO("./model/results/plantify_model_v1/weights/best.pt")
model_disease = YOLO("./model/results_disease/plantify_disease_model_v1/weights/best.pt")

class PredictImageView(APIView):
    parser_classes = [MultiPartParser, JSONParser]

    def post(self, request):
        # Acepta imagen subida por multipart o una URL
        image_file = request.FILES.get('image')
        image_url = request.data.get('image_url')

        if not image_file and not image_url:
            return Response({"error": "No image provided. Upload a file as 'image' or provide 'image_url'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if image_file:
                # Convertir archivo subido (InMemoryUploadedFile) a np.ndarray soportado por Ultralytics
                image_file.seek(0)
                file_bytes = np.frombuffer(image_file.read(), dtype=np.uint8)
                img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
                if img is None:
                    return Response({"error": "Unsupported or corrupt image file."}, status=status.HTTP_400_BAD_REQUEST)
                results = model.predict(img)
            else:
                # Si se proporciona URL, Ultralytics acepta rutas/URLs directamente
                results = model.predict(image_url)
        except TypeError as te:
            # Captura el error de tipo de Ultralytics y devuelve un mensaje claro
            return Response({
                "error": "Unsupported image type",
                "detail": str(te),
                "hint": "Provide a standard image file (jpg, png, webp) or a reachable URL."
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "Failed to process image", "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener el resultado más probable
        top1 = results[0].probs.top1
        confianza = results[0].probs.top1conf.item()
        nombre_planta = results[0].names[top1]
        
        print("\n" + "="*30)
        print(f"🌿 PLANTA DETECTADA: {nombre_planta}")
        print(f"🌿 PLANTA DETECTADA: {nombre_planta.upper()}")
        print(f"📊 Confianza: {confianza:.2%}")
        print("="*30 + "\n")
        # Buscar en Perenual API por nombre de planta
        try:
            api_key = os.getenv('PERENUAL_API_KEY')
            if not api_key:
                return Response(
                    {"error": "Perenual API key not configured", "env": "Missing PERENUAL_API_KEY"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            search_url = f"{PERENUAL_API_URL}/species-list"
            search_params = {
            'key': api_key,
            'q': nombre_planta
            }
            search_response = requests.get(search_url, params=search_params)
            
            perenual_plant_id = None
            if search_response.status_code == 200:
                search_data = search_response.json()
                if search_data.get('data') and len(search_data['data']) > 0:
                    perenual_plant_id = search_data['data'][0].get('id')
                    print(f"🔍 Perenual Plant ID: {perenual_plant_id}")
                    return Response({
                        'plant_id': perenual_plant_id
                    })
        except Exception as e:
            print(f"Error buscando en Perenual API: {str(e)}")
            return Response({
                'error': str(e)
            })

class PredictPestDiseaseView(APIView):
    parser_classes = [MultiPartParser, JSONParser]

    def post(self, request):
        # Acepta imagen subida por multipart o una URL
        image_file = request.FILES.get('image')
        image_url = request.data.get('image_url')

        if not image_file and not image_url:
            return Response({"error": "No image provided. Upload a file as 'image' or provide 'image_url'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if image_file:
                # Convertir archivo subido (InMemoryUploadedFile) a np.ndarray soportado por Ultralytics
                image_file.seek(0)
                file_bytes = np.frombuffer(image_file.read(), dtype=np.uint8)
                img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
                if img is None:
                    return Response({"error": "Unsupported or corrupt image file."}, status=status.HTTP_400_BAD_REQUEST)
                results = model_disease.predict(img)
            else:
                # Si se proporciona URL, Ultralytics acepta rutas/URLs directamente
                results = model_disease.predict(image_url)
        except TypeError as te:
            # Captura el error de tipo de Ultralytics y devuelve un mensaje claro
            return Response({
                "error": "Unsupported image type",
                "detail": str(te),
                "hint": "Provide a standard image file (jpg, png, webp) or a reachable URL."
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "Failed to process image", "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener el resultado más probable
        top1 = results[0].probs.top1
        confianza = results[0].probs.top1conf.item()
        nombre_disease = results[0].names[top1]
        # Extrae nombre de planta y enfermedad del formato "planta___enfermedad" y normaliza la enfermedad
        plant_name = None
        disease_label = nombre_disease or ""
        if "___" in disease_label:
            plant_name, disease_label = disease_label.split("___", 1)
        # La enfermedad puede venir separada por guiones bajos: convertirlos a espacios
        disease_query = disease_label.replace("_", " ").strip()

        print("\n" + "="*30)
        if plant_name:
            print(f"🌿 PLANTA DETECTADA: {plant_name}")
        print(f"🌿 ENFERMEDAD DETECTADA: {disease_query}")
        print(f"📊 Confianza: {confianza:.2%}")
        print("="*30 + "\n")
        
        if disease_query.lower() == "healthy":
            return Response({
                'id': -1
            })
        # Buscar en Perenual API por nombre de planta
        try:
            api_key = os.getenv('PERENUAL_API_KEY')
            if not api_key:
                return Response(
                    {"error": "Perenual API key not configured", "env": "Missing PERENUAL_API_KEY"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            # 1) Intentar localizar la URL de detalle con la API (solo para obtener el ID del issue)
            search_url = f"{PERENUAL_PEST_API_URL}/pest-disease-list"
            encoded_q = requests.utils.quote(disease_query)
            full_url = f"{search_url}?key={api_key}&q={encoded_q}"
            print(f"🔗 Perenual search URL (ID lookup): {full_url}")
            detail_url = None
            try:
                lookup_resp = requests.get(full_url, timeout=15)
                if lookup_resp.status_code == 200:
                    lookup_data = lookup_resp.json() or {}
                    first_item = (lookup_data.get('data') or [])[:1]
                    if first_item:
                        issue_id = first_item[0].get('id')
                        if issue_id:
                            detail_url = f"https://perenual.com/pest-disease-search-finder/pest-disease/{issue_id}"
            except Exception:
                pass

            # 2) Fallback: flujo en dos pasos (abrir página, introducir query y "enter" -> coger primer elemento)
            if not detail_url:
                try:
                    page_url = "https://perenual.com/pest-disease-search-finder"
                    # Paso 2.1: cargar la página inicial y verificar el input
                    encoded_q2 = requests.utils.quote(disease_query)
                    results_url = f"{page_url}?search={encoded_q2}"
                    res_resp = requests.get(results_url, timeout=15)
                    if res_resp.status_code == 200:
                        rsoup = BeautifulSoup(res_resp.text, 'html.parser')
                        first_a = rsoup.select_one('#search-container-display > a')
                        if first_a and first_a.get('href'):
                            href = first_a['href']
                            detail_url = f"https://perenual.com{href}" if href.startswith('/') else href
                except Exception:
                    pass

            if not detail_url:
                return Response({
                    'error': 'No se pudo encontrar la página de detalle de la enfermedad en Perenual'
                }, status=status.HTTP_502_BAD_GATEWAY)

            # 3) Scraping de la página de detalle: imagen principal, título, subtítulo y secciones
            print(f"🕸️ Scraping detail page: {detail_url}")
            # Extraer el ID numérico desde la URL de detalle (/pest-disease/{id})
            issue_id = None
            try:
                path = urlparse(detail_url).path if detail_url else ""
                last_segment = path.rstrip('/').split('/')[-1] if path else None
                if last_segment:
                    try:
                        issue_id = int(last_segment)
                    except (TypeError, ValueError):
                        issue_id = last_segment  # devuelve string si no es numérico
            except Exception:
                issue_id = None
            print(f"🔍 Perenual Issue ID: {issue_id}")
            return Response({
                'id': issue_id
            })
        except Exception as e:
            print(f"Error buscando en Perenual API: {str(e)}")
            return Response({
                'error': str(e)
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
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated]
    """CRUD para posts de usuarios"""
    # Permitir tanto JSON como multipart/form-data
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
    
class PostDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
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
        # permitir multipart/form-data para actualizar imagen
        parser_classes = [MultiPartParser, FormParser]
        serializer = PostSerializer(post, data=request.data, context={'request': request})
        if serializer.is_valid():
            updated_post = serializer.save()
            # Devolver el post actualizado con el contexto para incluir user_vote
            response_serializer = PostSerializer(updated_post, context={'request': request})
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        post = self.get_object(pk)
        if not post:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = PostSerializer(post, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated_post = serializer.save()
            response_serializer = PostSerializer(updated_post, context={'request': request})
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        post = self.get_object(pk)
        if not post:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        post.delete()
        return Response({"message": "Post deleted"}, status=status.HTTP_200_OK)
    
class CommentView(APIView):
    permission_classes = [IsAuthenticated]
    """CRUD para comentarios de usuarios"""
    def get(self, request):
        comments = request.user.comments.filter(is_deleted=False)
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        print("Creating comment with data:", request.data)
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            # Accept both 'post' and 'post_id' from clients
            post_id = request.data.get('post_id') or request.data.get('post')
            if post_id is None:
                return Response({"post": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
            serializer.save(author=request.user, post_id=post_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get_object(self, pk):
        try:
            return Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
            return None
    def get(self, request, pk):
        comment = self.get_object(pk)
        if not comment:
            return Response({"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = CommentSerializer(comment, context={'request': request})
        return Response(serializer.data)
    def patch(self, request, pk):
        comment = self.get_object(pk)
        if not comment:
            return Response({"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)
        # Only the author can edit their comment
        if comment.author != request.user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        serializer = CommentSerializer(comment, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated = serializer.save()
            response_serializer = CommentSerializer(updated, context={'request': request})
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, pk):
        comment = self.get_object(pk)
        if not comment:
            return Response({"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)
        # Only the author can delete their comment
        if comment.author != request.user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        comment.is_deleted = True
        comment.deleted_at = timezone.now()
        comment.save()
        # Return a JSON body with 200 to avoid some mobile clients treating empty 204 responses as network errors
        return Response({"message": "Comment deleted"}, status=status.HTTP_200_OK)

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
        if should_use_mock_data():
            print("/perenual/plants Using mock data for Perenual API")
            query = request.GET.get('q', None)
            page = int(request.GET.get('page', 1))
            
            data = search_mock_species_list(query, page)
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
            
        # Read API key at request time and validate
        api_key = os.getenv('PERENUAL_API_KEY')
        if not api_key:
            return Response(
                {"error": "Perenual API key not configured", "env": "Missing PERENUAL_API_KEY"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        page = request.GET.get('page', 1)
        q = request.GET.get('q', '')  # Búsqueda por nombre
        indoor = request.GET.get('indoor', None)  # Filtro para plantas de interior
        hardiness = request.GET.get('hardiness', None)  # Zona de resistencia
        watering = request.GET.get('watering', None)  # Frecuencia de riego
        sunlight = request.GET.get('sunlight', None)  # Requerimientos de luz
        
        try:
            url = f"{PERENUAL_API_URL}/species-list"
            params = {
                'key': api_key,
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
                # Pass through status and add details for debugging
                return Response(
                    {"error": "Failed to fetch plants from Perenual API", "status": response.status_code, "details": response.text[:300]}, 
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
        if should_use_mock_data():
            print("Using mock data for Perenual API")
            perenual_data = get_mock_species_details(plant_id)
            if perenual_data:
                care_data = perenual_data.get('care_guides')
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
            # Añadir posts relacionados por plant_id (si existen)
            try:
                posts_qs = Post.objects.filter(plant_id=plant_id).order_by('-created_at')
                perenual_data['posts'] = PostSerializer(posts_qs, many=True, context={'request': request}).data
            except Exception as posts_e:
                perenual_data['posts_error'] = str(posts_e)

            return Response(perenual_data)
        # Read API key at request time and validate
        api_key = os.getenv('PERENUAL_API_KEY')
        if not api_key:
            return Response(
                {"error": "Perenual API key not configured", "env": "Missing PERENUAL_API_KEY"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        try:
            url = f"{PERENUAL_API_URL}/species/details/{plant_id}"
            params = {
                'key': api_key
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
                
                # Añadir posts relacionados por plant_id (si existen)
                try:
                    posts_qs = Post.objects.filter(plant_id=plant_id).order_by('-created_at')
                    data['posts'] = PostSerializer(posts_qs, many=True, context={'request': request}).data
                except Exception as posts_e:
                    data['posts_error'] = str(posts_e)

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

class PerenualPestDiseaseView(APIView):
    """Devuelve la lista local de enfermedades parseadas desde perenual_diseases.html (JSON generado).
    Soporta filtro opcional por 'q' en el nombre.
    """
    def get(self, request):
        items = load_perenual_diseases_cards()
        q = request.GET.get('q')
        if q:
            ql = q.lower()
            items = [it for it in items if (it.get('name') or '').lower().find(ql) != -1]
        return Response(items)
    
class PerenualPestDiseaseDetailView(APIView):
    """Devuelve el href de la enfermedad buscando por id en el JSON local.
    Se espera `pest_id` en la URL (por ejemplo, /api/perenual/pest-disease/<pest_id>/).
    """
    def get(self, request, pest_id):
        items = load_perenual_diseases_cards()
        try:
            target_id = int(pest_id)
        except (TypeError, ValueError):
            return Response({"error": "Parámetro id inválido"}, status=status.HTTP_400_BAD_REQUEST)
        for it in items:
            if it.get('id') == target_id:
                href = it.get('href')
                print(f"🕸️ Scraping detail page for pest disease ID {pest_id}: {href}")
                dresp = requests.get(href, timeout=20)
                print(dresp)
                if dresp.status_code != 200:
                    return Response({'error': 'No se pudo cargar la página de detalle'}, status=status.HTTP_502_BAD_GATEWAY)
                dsoup = BeautifulSoup(dresp.text, 'html.parser')

                # Título (visible en el header)
                title = None
                header_title_div = dsoup.select_one('.text-5xl.font-bold')
                if header_title_div:
                    raw = header_title_div.get_text(separator=' ', strip=True)
                    print(header_title_div)
                    parts = [p.strip() for p in raw.split('>') if p.strip()]
                    if parts:
                        title = parts[-1]

                # Subtítulo (nombre científico)
                scientific_name = None
                sci_block = dsoup.select_one('.italic.main-t-c.my-2')
                if sci_block:
                    scientific_name = sci_block.get_text(strip=True)

                # Imagen principal dentro de main (evitando logos)
                image_url = None
                candidate_imgs = dsoup.select('main img') or []
                for im in candidate_imgs:
                    src = im.get('src') or ''
                    alt = (im.get('alt') or '').lower()
                    if 'logo' in src or 'logo' in alt:
                        continue
                    if 'storage' in src or 'perenual.com/storage' in src:
                        image_url = src
                        break
                if not image_url:
                    for im in candidate_imgs:
                        src = im.get('src') or ''
                        if 'logo' not in src:
                            image_url = src
                            break

                # Secciones (clase exacta indicada)
                sections = []
                for sec in dsoup.select('div.rounded-md.shadow.p-3.mb-2.text-sm'):
                    text = sec.get_text('\n', strip=True)
                    if text:
                        sections.append(text)
                # Formatear secciones para el frontend: títulos, párrafos y viñetas
                def _format_sections(raw_sections):
                    import re
                    formatted = []
                    for raw in raw_sections:
                        lines = [l.strip() for l in raw.split('\n') if l.strip()]
                        current = None
                        para_buf = []

                        def flush_para():
                            nonlocal para_buf, current
                            if para_buf:
                                text = ' '.join(para_buf)
                                if current is None:
                                    current = {'title': None, 'subtitle': None, 'paragraphs': [], 'bullets': []}
                                current['paragraphs'].append(text)
                                para_buf = []

                        def is_heading(line: str) -> bool:
                            # Casos típicos: "Symptoms", "Solutions", líneas que acaban en '?' o patrones "N - Subtítulo"
                            if line in ('Symptoms', 'Solutions'):
                                return True
                            if line.endswith('?') and len(line) < 200:
                                return True
                            if re.match(r'^\d+\s*-\s+.+', line):
                                return True
                            # Título corto con inicial mayúscula y sin punto final
                            if len(line) <= 80 and re.match(r'^[A-Z][A-Za-z0-9\-\(\)\s]+$', line) and not line.endswith('.'):
                                return True
                            return False

                        def is_bullet(line: str) -> bool:
                            return bool(re.match(r'^[•\-\*]\s+', line)) or line.startswith('•') or line.startswith('- ') or line.startswith('* ')

                        for ln in lines:
                            if is_heading(ln):
                                flush_para()
                                # cerrar sección previa
                                if current:
                                    formatted.append(current)
                                # iniciar nueva
                                current = {'title': ln, 'subtitle': None, 'paragraphs': [], 'bullets': []}
                                m = re.match(r'^\s*(\d+)\s*-\s*(.+)$', ln)
                                if m:
                                    # usar texto tras el número como título y guardar el número como subtítulo opcional
                                    current['title'] = m.group(2)
                                    current['subtitle'] = f"{m.group(1)}"
                                continue
                            if is_bullet(ln):
                                flush_para()
                                if current is None:
                                    current = {'title': None, 'subtitle': None, 'paragraphs': [], 'bullets': []}
                                bullet = re.sub(r'^[•\-\*]\s*', '', ln)
                                current['bullets'].append(bullet)
                            else:
                                para_buf.append(ln)
                        # cerrar buffers al terminar
                        flush_para()
                        if current:
                            formatted.append(current)
                    return formatted

                structured_sections = _format_sections(sections)

                print(f"✅ Found disease detail: {title}, scientific name: {scientific_name}, image: {image_url}, sections: {len(sections)}")
                print("="*30 + "\n")
                print(structured_sections[:2])  # muestra las 2 primeras secciones formateadas

                return Response({
                    'name': title,
                    'scientific_name': scientific_name,
                    'image': image_url,
                    'sections': structured_sections,
                })

        return Response({"error": "Enfermedad no encontrada"}, status=status.HTTP_404_NOT_FOUND)

