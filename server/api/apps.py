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
        from django.contrib.auth import get_user_model
        try:
            if Garden.objects.filter(is_template=True).exists():
                print("Las plantillas de jardines ya existen. No se realizará ninguna acción.")
                return
            User = get_user_model()
            admin_user = User.objects.filter(username='admin').first()
            if not admin_user:
                print("El usuario 'admin' no existe. No se creará automáticamente.")
                return
        except OperationalError:
            print("Error al conectar con la base de datos. Asegúrate de que el servidor esté en funcionamiento.")
            return
        try:
            with open("./garden_templates.json", 'r', encoding='utf-8') as f:
                garden_templates = json.load(f)
            for template in garden_templates:
                Garden.objects.get_or_create(
                    name=template['name'],
                    location=template['location'],
                    humidity=template['humidity'],
                    sunlight_exposure=template['sunlight'],
                    air=template['air'],
                    owner=admin_user,
                    custom_image=template['image'],
                    is_template=True
                )
            print("Importación de jardines completada.")
        except OperationalError:
            print("Error al conectar con la base de datos. Asegúrate de que el servidor esté en funcionamiento.")
            pass
        except Exception as e:
            print(f"Error al importar jardines: {e}")