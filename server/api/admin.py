from django.contrib import admin

from .models import Garden
from .models import UserPlant
from .models import PlantInfo
from .models import Comment
from .models import Post
from .models import Vote

admin.site.register(UserPlant)
admin.site.register(Garden)
admin.site.register(PlantInfo)
admin.site.register(Comment)
admin.site.register(Post)
admin.site.register(Vote)   