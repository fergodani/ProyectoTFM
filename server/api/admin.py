from django.contrib import admin

from .models import Garden
from .models import UserPlant
from .models import PlantInfo

admin.site.register(UserPlant)
admin.site.register(Garden)
admin.site.register(PlantInfo)