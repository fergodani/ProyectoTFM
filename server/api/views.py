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
from django.db.models import Q
from rest_framework_simplejwt.tokens import RefreshToken

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
        if name:
            queryset = queryset.filter(
                Q(common_name__icontains=name) | Q(scientific_name__icontains=name)
            )
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
            serializer.save()
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Usuario creado correctamente",
                "refresh": str(refresh),
                "access": str(refresh.access_token)
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
