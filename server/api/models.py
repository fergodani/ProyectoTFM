from django.db import models
from django.contrib.auth.models import User 

class Garden(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(
        max_length=20,
        choices=[
            ('indoor', 'Indoor'),
            ('outdoor', 'Outdoor'),
        ],
        default='indoor'
    )
    humidity = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low humidity'),
            ('normal', 'Normal'),
            ('high', 'High humidity'),
        ],
        default='normal'
    )
    sunlight_exposure = models.CharField(
        max_length=20,
        choices=[
            ('full_sun', 'Full Sun'),
            ('partial_sun', 'Partial Sun'),
            ('indirect_sun', 'Indirect Sunlight'),
            ('full_shade', 'Full Shade'),
        ],
        default='partial_sun'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gardens')
    def __str__(self):
        return self.name

class UserPlant(models.Model):
    planting_date = models.DateField(null=True, blank=True)
    last_watered_date = models.DateField(blank=True, null=True)  # New field for last watering date
    garden = models.ForeignKey(Garden, on_delete=models.CASCADE, related_name='user_plants',null=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plants') 
    plant = models.ForeignKey('PlantInfo', on_delete=models.CASCADE, related_name='user_plant')

    def __str__(self):
        return f"{self.plant.common_name or self.plant.scientific_name}"

class PlantInfo(models.Model):
    care_level = models.CharField(max_length=50, blank=True, null=True)
    cones = models.CharField(max_length=255, blank=True, null=True)
    cuisine = models.CharField(max_length=255, blank=True, null=True)
    cycle = models.CharField(max_length=50, blank=True, null=True)
    drought_tolerant = models.CharField(max_length=10, blank=True, null=True)
    edible_fruit = models.CharField(max_length=255, blank=True, null=True)
    edible_leaf = models.CharField(max_length=255, blank=True, null=True)
    flowering_season = models.CharField(max_length=255, blank=True, null=True)
    flowers = models.CharField(max_length=255, blank=True, null=True)
    fruiting_season = models.CharField(max_length=255, blank=True, null=True)
    fruits = models.CharField(max_length=255, blank=True, null=True)
    growth_rate = models.CharField(max_length=50, blank=True, null=True)
    harvest_method = models.CharField(max_length=255, blank=True, null=True)
    harvest_season = models.CharField(max_length=255, blank=True, null=True)
    indoor = models.CharField(max_length=10, blank=True, null=True)
    invasive = models.CharField(max_length=10, blank=True, null=True)
    leaf = models.CharField(max_length=10, blank=True, null=True)
    maintenance = models.CharField(max_length=255, blank=True, null=True)
    medicinal = models.CharField(max_length=255, blank=True, null=True)
    pest_susceptibility = models.CharField(max_length=255, blank=True, null=True)
    poisonous_to_humans = models.CharField(max_length=10, blank=True, null=True)
    poisonous_to_pets = models.CharField(max_length=10, blank=True, null=True)
    pruning_month = models.CharField(max_length=50, blank=True, null=True)
    rare = models.CharField(max_length=10, blank=True, null=True)
    salt_tolerant = models.CharField(max_length=10, blank=True, null=True)
    soil = models.CharField(max_length=255, blank=True, null=True)
    sunlight = models.TextField(blank=True, null=True)
    thorny = models.CharField(max_length=10, blank=True, null=True)
    tropical = models.CharField(max_length=10, blank=True, null=True)
    watering = models.CharField(max_length=50, blank=True, null=True)
    sun = models.CharField(max_length=50, blank=True, null=True)
    edible = models.CharField(max_length=10, blank=True, null=True)
    hardiness = models.CharField(max_length=50, blank=True, null=True)
    image = models.URLField(blank=True, null=True)
    common_name = models.CharField(max_length=255, blank=True, null=True)
    scientific_name = models.CharField(max_length=255, blank=True, null=True)
    watering_long = models.TextField(blank=True, null=True)
    pruning = models.TextField(blank=True, null=True)

    # Guarda el array watering_period como JSON
    watering_period = models.JSONField(blank=True, null=True)

    def __str__(self):
        return self.common_name or self.scientific_name or "Plant Info"