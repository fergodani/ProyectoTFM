from django.apps import AppConfig
from django.apps import AppConfig
import os
import json

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        
        from django.db.utils import OperationalError
        from .models import PlantInfo
        if PlantInfo.objects.exists():
            return
        try:
            with open("../../plants_results_old.json", 'r', encoding='utf-8') as f:
                plants_data = json.load(f)
            count = 1
            for plant in plants_data:
                print(f"Importando planta {count}: {plant.get('common_name')}")
                count = count + 1
                PlantInfo.objects.get_or_create(
                    care_level=plant.get('care_level'),
                    cones=plant.get('cones'),
                    cuisine=plant.get('cuisine'),
                    cycle=plant.get('cycle'),
                    drought_tolerant=plant.get('drought_tolerant'),
                    edible_fruit=plant.get('edible_fruit'),
                    edible_leaf=plant.get('edible_leaf'),
                    flowering_season=plant.get('flowering_season'),
                    flowers=plant.get('flowers'),
                    fruiting_season=plant.get('fruiting_season'),
                    fruits=plant.get('fruits'),
                    growth_rate=plant.get('growth_rate'),
                    harvest_method=plant.get('harvest_method'),
                    harvest_season=plant.get('harvest_season'),
                    indoor=plant.get('indoor'),
                    invasive=plant.get('invasive'),
                    leaf=plant.get('leaf'),
                    maintenance=plant.get('maintenance'),
                    medicinal=plant.get('medicinal'),
                    pest_susceptibility=plant.get('pest_susceptibility'),
                    poisonous_to_humans=plant.get('poisonous_to_humans'),
                    poisonous_to_pets=plant.get('poisonous_to_pets'),
                    pruning_month=plant.get('pruning_month'),
                    rare=plant.get('rare'),
                    salt_tolerant=plant.get('salt_tolerant'),
                    soil=plant.get('soil'),
                    sunlight=plant.get('sunlight'),
                    thorny=plant.get('thorny'),
                    tropical=plant.get('tropical'),
                    watering=plant.get('watering'),
                    sun=plant.get('sun'),
                    edible=plant.get('edible'),
                    hardiness=plant.get('hardiness'),
                    image=plant.get('image'),
                    common_name=plant.get('common_name'),
                    scientific_name=plant.get('scientific_name'),
                    watering_long=plant.get('watering_long'),
                    pruning=plant.get('pruning'),
                    watering_period=plant.get('watering_period')
                )
        except OperationalError:
            print("Error al conectar con la base de datos. Asegúrate de que el servidor esté en funcionamiento.")
            pass
        except Exception as e:
            print(f"Error al importar plantas: {e}")

