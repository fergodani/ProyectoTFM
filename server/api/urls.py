from django.urls import path

from .views import GardenListCreateView, GardenDetailView, PlantListCreateView, PlantDetailView 

urlpatterns = [
    path('gardens/', GardenListCreateView.as_view(), name='garden-list-create'),
    path('gardens/<int:pk>/', GardenDetailView.as_view(), name='garden-detail'),
    path('plants/', PlantListCreateView.as_view(), name='plant-list-create'),
    path('plants/<int:pk>/', PlantDetailView.as_view(), name='plant-detail'),
]