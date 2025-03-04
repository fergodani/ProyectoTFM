from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Garden, Plant
from .serializers import GardenSerializer, PlantSerializer

# CRUD para Garden
class GardenListCreateView(APIView):
    """Obtener todos los jardines o crear uno nuevo"""
    def get(self, request):
        gardens = Garden.objects.all()
        serializer = GardenSerializer(gardens, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = GardenSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
class PlantListCreateView(APIView):
    """Obtener todas las plantas o crear una nueva"""
    def get(self, request):
        plants = Plant.objects.all()
        serializer = PlantSerializer(plants, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PlantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PlantDetailView(APIView):
    """Obtener, actualizar o eliminar una planta específica"""
    def get_object(self, pk):
        try:
            return Plant.objects.get(pk=pk)
        except Plant.DoesNotExist:
            return None

    def get(self, request, pk):
        plant = self.get_object(pk)
        if not plant:
            return Response({"error": "Plant not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = PlantSerializer(plant)
        return Response(serializer.data)

    def put(self, request, pk):
        plant = self.get_object(pk)
        if not plant:
            return Response({"error": "Plant not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = PlantSerializer(plant, data=request.data)
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