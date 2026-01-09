from django.db import models
from django.contrib.auth.models import User 
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from django.core.files.storage import default_storage

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
    air = models.BooleanField(default=False, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gardens')
    is_template = models.BooleanField(default=False)
    custom_image = models.ImageField(upload_to='gardens/', blank=True, null=True)
    def __str__(self):
        if self.is_template:
            return f"Template: {self.name}"
        return self.name

class UserPlant(models.Model):
    planting_date = models.DateField(null=True, blank=True)
    last_watered_date = models.DateField(blank=True, null=True)
    last_fertilized_date = models.DateField(blank=True, null=True)
    last_pruning_date = models.DateField(blank=True, null=True)
    last_rotating_date = models.DateField(blank=True, null=True)
    last_spraying_date = models.DateField(blank=True, null=True)
    garden = models.ForeignKey(Garden, on_delete=models.CASCADE, related_name='user_plants',null=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plants') 
    plant_id = models.PositiveIntegerField(default=0)
    image = models.URLField(max_length=500, blank=True, null=True)
    custom_image = models.ImageField(upload_to='userplants/', blank=True, null=True)
    isWateringReminder = models.BooleanField(default=True)
    common_name = models.CharField(max_length=255, blank=True, null=True)
    custom_name = models.CharField(max_length=255, blank=True, null=True)
    height = models.PositiveIntegerField(blank=True, null=True)
    age = models.CharField(
        max_length=20,
        choices=[
            ('less_1_year', 'Less than 1 year'),
            ('2_3_years', '2-3 years'),
            ('more_3_years', 'More than 3 years'),
        ],
        blank=True,
        null=True
    )
    fertilizing_time = models.PositiveIntegerField(blank=True, null=True)
    fertilizing_time_unit = models.CharField(
        max_length=10,
        choices=[
            ('day', 'Day'),
            ('week', 'Week'),
            ('month', 'Month'),
        ],
        blank=True,
        null=True
    )
    pruning_time = models.PositiveIntegerField(blank=True, null=True)
    pruning_time_unit = models.CharField(
        max_length=10,
        choices=[
            ('day', 'Day'),
            ('week', 'Week'),
            ('month', 'Month'),
        ],
        blank=True,
        null=True
    )
    sprayed_time = models.PositiveIntegerField(blank=True, null=True)
    sprayed_unit = models.CharField(
        max_length=10,
        choices=[
            ('day', 'Day'),
            ('week', 'Week'),
            ('month', 'Month'),
        ],
        blank=True,
        null=True
    )
    rotation_time = models.PositiveIntegerField(blank=True, null=True)
    rotation_unit = models.CharField(
        max_length=10,
        choices=[
            ('day', 'Day'),
            ('week', 'Week'),
            ('month', 'Month'),
        ],
        blank=True,
        null=True
    )
    pot_type = models.CharField(
        max_length=30,
        choices=[
            ('clay', 'Clay'),
            ('plastic', 'Plastic'),
            ('glazed_ceramic', 'Glazed ceramic/porcelain pot'),
            ('cement', 'Cement'),
            ('peat', 'Peat'),
            ('stone', 'Stone'),
            ('wood', 'Wood'),
            ('fabric', 'Fabric'),
        ],
        blank=True,
        null=True
    )
    pot_size = models.CharField(max_length=50, blank=True, null=True)
    drainage = models.CharField(
        max_length=20,
        choices=[
            ('with_holes', 'With holes'),
            ('without_holes', 'Without holes'),
        ],
        blank=True,
        null=True
    )
    watering_period = models.JSONField(blank=True, null=True)
    watering_type = models.CharField(
        max_length=20,
        choices=[
            ('recommended', 'Recommended'),
            ('manual', 'Manual')
        ],
        default='recommended'
    )
    watering_time = models.PositiveIntegerField(blank=True, null=True)
    watering_unit = models.CharField(
        max_length=10,
        choices=[
            ('day', 'Day'),
            ('week', 'Week'),
            ('month', 'Month'),
        ],
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.custom_name if self.custom_name else f"Plant {self.id} of {self.owner.username}"
    
class Post(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    #plant_info = models.ForeignKey('PlantInfo', on_delete=models.CASCADE, related_name='posts')
    plant_id = models.PositiveIntegerField(default=0)
    plant_common_name = models.CharField(max_length=255, blank=True, null=True)
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    like_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_vote_score(self):
        """Calcula el score total: likes - dislikes (mínimo 0)"""
        likes = self.votes.filter(vote_type='like').count()
        dislikes = self.votes.filter(vote_type='dislike').count()
        return max(0, likes - dislikes)
    
    def get_likes_count(self):
        """Número total de likes"""
        return self.votes.filter(vote_type='like').count()
    
    def get_dislikes_count(self):
        """Número total de dislikes"""
        return self.votes.filter(vote_type='dislike').count()
    
    def get_user_vote(self, user):
        """Obtiene el voto del usuario para este post"""
        if not user.is_authenticated:
            return None
        try:
            return self.votes.get(user=user).vote_type
        except:
            return None

    def __str__(self):
        return self.title


# Señales para eliminar archivos en disco cuando se borra una instancia
@receiver(post_delete, sender=Post)
def delete_post_image(sender, instance, **kwargs):
    if instance.image:
        try:
            default_storage.delete(instance.image.name)
        except Exception:
            pass


@receiver(post_delete, sender=UserPlant)
def delete_userplant_image(sender, instance, **kwargs):
    if instance.image:
        try:
            default_storage.delete(instance.image.name)
        except Exception:
            pass


# Eliminar archivo anterior si se reemplaza en update
@receiver(pre_save, sender=Post)
def auto_delete_post_image_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old = Post.objects.get(pk=instance.pk)
    except Post.DoesNotExist:
        return
    old_file = old.image
    new_file = instance.image
    if old_file and old_file != new_file:
        try:
            default_storage.delete(old_file.name)
        except Exception:
            pass


@receiver(pre_save, sender=UserPlant)
def auto_delete_userplant_image_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old = UserPlant.objects.get(pk=instance.pk)
    except UserPlant.DoesNotExist:
        return
    old_file = old.image
    new_file = instance.image
    if old_file and old_file != new_file:
        try:
            default_storage.delete(old_file.name)
        except Exception:
            pass

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_vote_score(self):
        """Calcula el score total: likes - dislikes (mínimo 0)"""
        likes = self.votes.filter(vote_type='like').count()
        dislikes = self.votes.filter(vote_type='dislike').count()
        return max(0, likes - dislikes)
    
    def get_likes_count(self):
        """Número total de likes"""
        return self.votes.filter(vote_type='like').count()
    
    def get_dislikes_count(self):
        """Número total de dislikes"""
        return self.votes.filter(vote_type='dislike').count()
    
    def get_user_vote(self, user):
        """Obtiene el voto del usuario para este comentario"""
        if not user.is_authenticated:
            return None
        try:
            return self.votes.get(user=user).vote_type
        except:
            return None

    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title}"

class Vote(models.Model):
    VOTE_CHOICES = [
        ('like', 'Like'),
        ('dislike', 'Dislike'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='votes')
    vote_type = models.CharField(max_length=10, choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Campos para referenciar tanto posts como comentarios
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='votes', null=True, blank=True)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='votes', null=True, blank=True)
    
    class Meta:
        # Un usuario solo puede votar una vez por post o comentario
        unique_together = [
            ['user', 'post'],
            ['user', 'comment']
        ]
        # Validar que solo se vote en post O comentario, no ambos
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(post__isnull=False, comment__isnull=True) |
                    models.Q(post__isnull=True, comment__isnull=False)
                ),
                name='vote_either_post_or_comment'
            )
        ]
    
    def __str__(self):
        target = self.post.title if self.post else f"comment on {self.comment.post.title}"
        return f"{self.user.username} {self.vote_type}d {target}"
