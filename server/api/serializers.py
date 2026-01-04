from datetime import date, timedelta
import json
from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Garden, UserPlant, PlantInfo, Post, Comment, Vote
from django.utils import timezone

# Serializers
class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['vote_type', 'post', 'comment']
        
    def validate(self, data):
        """Validar que se vote solo en post O comentario"""
        if not data.get('post') and not data.get('comment'):
            raise serializers.ValidationError("Must vote on either a post or comment")
        if data.get('post') and data.get('comment'):
            raise serializers.ValidationError("Cannot vote on both post and comment")
        return data

class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    vote_score = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = '__all__'
    
    def to_representation(self, instance):
        """Oculta el contenido si el comentario ha sido marcado como eliminado."""
        data = super().to_representation(instance)
        if getattr(instance, 'is_deleted', False):
            # Mostrar un placeholder en lugar del contenido real
            data['content'] = None
        return data
        
    def get_vote_score(self, obj):
        return obj.get_vote_score()
    
    def get_likes_count(self, obj):
        return obj.get_likes_count()
    
    def get_dislikes_count(self, obj):
        return obj.get_dislikes_count()
        
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_user_vote(request.user)
        return None
        
class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    vote_score = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = '__all__'
        
    def get_vote_score(self, obj):
        return obj.get_vote_score()
    
    def get_likes_count(self, obj):
        return obj.get_likes_count()
    
    def get_dislikes_count(self, obj):
        return obj.get_dislikes_count()
        
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_user_vote(request.user)
        return None
        
class PlantInfoSerializer(serializers.ModelSerializer):
    posts = PostSerializer(many=True, read_only=True)
    class Meta:
        model = PlantInfo
        fields = '__all__'
        
class UserPlantSerializer(serializers.ModelSerializer):
    #plant = PlantInfoSerializer(read_only=True)
    
    id = serializers.IntegerField(read_only=True)
    #plant_id = serializers.PrimaryKeyRelatedField(
    #    queryset=PlantInfo.objects.all(), source='plant', write_only=True
    #)
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
        if obj.last_watered_date and obj.watering_period:
            try:
                # Si watering_period es un string, conviértelo a lista
                period = obj.watering_period
                if isinstance(period, str):
                    period = json.loads(period)
                today = obj.last_watered_date

                unit = period["unit"]
                unit_days = {"days": 1, "weeks": 7, "months": 30}
                
                value = period["value"]
                if isinstance(value, str) and '-' in value:
                    # Si es un rango como "7-10", calcular la media
                    min_val, max_val = map(int, value.split('-'))
                    value = (min_val + max_val) / 2
                else:
                    value = int(value)
                days = value * unit_days.get(unit, 1)
                print("Calculated days for watering:", days)
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