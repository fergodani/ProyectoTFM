from django.apps import AppConfig
from django.apps import AppConfig
import os
import json

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        from django.db.utils import OperationalError
        from .models import Garden
        try:
            if Garden.objects.filter(is_template=True).exists():
                print("Las plantillas de jardines ya existen. No se realizará ninguna acción.")
                return
        except OperationalError:
            print("Error al conectar con la base de datos. Asegúrate de que el servidor esté en funcionamiento.")
            return
        try:
            with open(os.path.join(os.path.dirname(__file__), './garden_templates.json')) as f:
                garden_templates = json.load(f)
            for template in garden_templates:
                Garden.objects.get_or_create(
                    name=template['name'],
                    location=template['location'],
                    humidity=template['humidity'],
                    sunlight_exposure=template['sunlight'],
                    air=template['air'],
                    owner=template["owner"],
                    custom_image=template['image'],
                    is_template=True
                )
            print("Importación de jardines completada.")
        except OperationalError:
            print("Error al conectar con la base de datos. Asegúrate de que el servidor esté en funcionamiento.")
            pass
        except Exception as e:
            print(f"Error al importar jardines: {e}")