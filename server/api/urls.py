from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import GardenListCreateView, GardenDetailView, PlantInfoDetailView, PlantInfoListView, TrefflePlantDetail, TrefflePlantList, UserPlantDetailView, UserPlantListCreateView, CustomTokenObtainPairView, UserRegisterView 

urlpatterns = [
    path('gardens/', GardenListCreateView.as_view(), name='garden-list-create'),
    path('gardens/<int:pk>/', GardenDetailView.as_view(), name='garden-detail'),
    path('userplant/', UserPlantListCreateView.as_view(), name='plant-list-create'),
    path('userplant/<int:pk>/', UserPlantDetailView.as_view(), name='plant-detail'),
    path('trefle/plant', TrefflePlantDetail.as_view(), name='trefle-plants'),
    path('trefle/plants', TrefflePlantList.as_view(), name='trefle-plants'),
    path('plantinfo/', PlantInfoListView.as_view(), name='plantinfo-list'),
    path('plantinfo/<int:pk>/', PlantInfoDetailView.as_view(), name='plantinfo-detail'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', UserRegisterView.as_view(), name='user-register'),
]