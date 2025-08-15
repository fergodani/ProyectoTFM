from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Garden, UserPlant, PlantInfo

# Serializers
class PlantInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantInfo
        fields = '__all__'
        
class UserPlantSerializer(serializers.ModelSerializer):
    plant = PlantInfoSerializer(read_only=True)
    
    id = serializers.IntegerField(read_only=True)
    plant_id = serializers.PrimaryKeyRelatedField(
        queryset=PlantInfo.objects.all(), source='plant', write_only=True
    )
    garden_name = serializers.CharField(source='garden.name', read_only=True)
    class Meta:
        model = UserPlant
        fields = '__all__'
                
class GardenSerializer(serializers.ModelSerializer):
    user_plants = UserPlantSerializer(many=True, read_only=True)
    class Meta:
        model = Garden
        fields = '__all__'
        
class GardenSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Garden
        fields = ['id', 'name']
        
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Puedes añadir más datos al token si quieres
        token['id'] = user.id
        token['username'] = user.username
        print("Token generated for user:", user.username)
        return token
    
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user