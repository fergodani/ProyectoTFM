from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import PostVoteView, CommentVoteView, UserPostView, PlantInfoPostView, PostDetailView, CommentView, CommentDetailView, GardenSuitabilityView, WeatherRecommendationView, PredictImageView, GeminiPlantIdentificationView, GardenListNameView, GardenListCreateView, GardenDetailView, PlantInfoDetailView, PlantInfoListView, TrefflePlantDetail, TrefflePlantList, UserPlantDetailView, UserPlantListCreateView, CustomTokenObtainPairView, UserRegisterView, UserTasksView, PerenualPlantListView, PerenualPlantDetailView 

urlpatterns = [
    path('gardens/', GardenListCreateView.as_view(), name='garden-list-create'),
    path('gardens/simple/', GardenListNameView.as_view(), name='user-gardens-simple'),
    path('gardens/<int:pk>/', GardenDetailView.as_view(), name='garden-detail'),
    path('gardens/suitability/', GardenSuitabilityView.as_view(), name='garden-suitability'),
    path('userplant/', UserPlantListCreateView.as_view(), name='plant-list-create'),
    path('userplant/<int:pk>/', UserPlantDetailView.as_view(), name='plant-detail'),
    path('trefle/plant', TrefflePlantDetail.as_view(), name='trefle-plants'),
    path('trefle/plants', TrefflePlantList.as_view(), name='trefle-plants'),
    path('plantinfo/', PlantInfoListView.as_view(), name='plantinfo-list'),
    path('plantinfo/<int:pk>/', PlantInfoDetailView.as_view(), name='plantinfo-detail'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', UserRegisterView.as_view(), name='user-register'),
    path('user-tasks/', UserTasksView.as_view(), name='user-tasks'),
    path('predict/', PredictImageView.as_view(), name='predict-image'),
    path('weather/', WeatherRecommendationView.as_view(), name='weather-recommendation'),
    path('user-posts/', UserPostView.as_view(), name='user-posts'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:pk>/vote/', PostVoteView.as_view(), name='post-vote'),
    path('plantinfo-posts/<int:pk>/', PlantInfoPostView.as_view(), name='plantinfo-post-detail'),
    path('comments/', CommentView.as_view(), name='comment-list-create'),
    path('comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),
    path('comments/<int:pk>/vote/', CommentVoteView.as_view(), name='comment-vote'),
    path('predict-gemini/', GeminiPlantIdentificationView.as_view(), name='predict-gemini'),
    path('perenual/plants/', PerenualPlantListView.as_view(), name='perenual-plant-list'),
    path('perenual/plants/<int:plant_id>/', PerenualPlantDetailView.as_view(), name='perenual-plant-detail'),
]