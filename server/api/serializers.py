from datetime import date, timedelta
import json
from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Garden, UserPlant, PlantInfo
from django.utils import timezone

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
    #next_watering_date = serializers.SerializerMethodField()
    class Meta:
        model = UserPlant
        fields = '__all__'
    def get_season(self, dt: date):
        month = dt.month
        if month in [3, 4, 5]:
            return "spring"
        elif month in [6, 7, 8]:
            return "summer"
        elif month in [9, 10, 11]:
            return "fall"
        else:
            return "winter"

    def parse_value(self, value_str):
        # Si es un rango, usa el mínimo
        if '-' in value_str:
            return int(value_str.split('-')[0])
        return int(value_str)
    
    def get_next_watering_date(self, obj):
        # obj.last_watered_date: fecha de último riego
        # obj.plant.watering_period: JSON con los periodos
        if obj.last_watered_date and obj.plant and obj.plant.watering_period:
            try:
                # Si watering_period es un string, conviértelo a lista
                periods = obj.plant.watering_period
                if isinstance(periods, str):
                    periods = json.loads(periods)
                today = obj.last_watered_date
                season = self.get_season(today)
                print(season)
                # Busca el periodo para la estación actual
                period = next((p for p in periods if p["season"] == season), None)
                print(period)
                if period:
                    value = self.parse_value(period["value"])
                    unit = period["unit"]
                    unit_days = {"days": 1, "weeks": 7, "months": 30}
                    days = value * unit_days.get(unit, 1)
                    return today + timedelta(days=days)
            except Exception:
                return None
        return obj.created_at.date()

    def get_next_pruning_date(self, obj):
        if obj.last_pruning_date and obj.pruning_time and obj.pruning_time_unit:
            units = {'day': 1, 'week': 7, 'month': 30}
            days = obj.pruning_time * units.get(obj.pruning_time_unit, 1)
            return obj.last_pruning_date + timedelta(days=days)
        elif obj.pruning_time and obj.pruning_time_unit:
            return obj.created_at.date()
        else:
            return None

    def get_next_spraying_date(self, obj):
        if obj.last_spraying_date and obj.sprayed_time and obj.sprayed_unit:
            units = {'day': 1, 'week': 7, 'month': 30}
            days = obj.sprayed_time * units.get(obj.sprayed_unit, 1)
            return obj.last_spraying_date + timedelta(days=days)
        elif obj.sprayed_time and obj.sprayed_unit:
            return obj.created_at.date()
        return None

    def get_next_rotating_date(self, obj):
        if obj.last_rotating_date and obj.rotation_time and obj.rotation_unit:
            units = {'day': 1, 'week': 7, 'month': 30}
            days = obj.rotation_time * units.get(obj.rotation_unit, 1)
            return obj.last_rotating_date + timedelta(days=days)
        elif obj.rotation_time and obj.rotation_unit:
            return obj.created_at.date()
        return None

    def get_next_fertilizing_date(self, obj):
        #if obj.last_fertilized_date and obj.fertilizing_time and obj.fertilizing_time_unit:
        #    units = {'day': 1, 'week': 7, 'month': 30}
        #    days = obj.fertilizing_time * units.get(obj.fertilizing_time_unit, 1)
        #    return obj.last_fertilized_date + timedelta(days=days)
        #elif obj.fertilizing_time and obj.fertilizing_time_unit:
        #    return obj.created_at.date()
        return None
                
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