from django.contrib import admin

from .models import Garden
from .models import Plant

admin.site.register(Plant)
admin.site.register(Garden)