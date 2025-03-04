from django.db import models

class Garden(models.Model):
    name = models.CharField(max_length=255)
    location = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Plant(models.Model):
    scientific_name = models.CharField(max_length=255)
    common_name = models.CharField(max_length=255, blank=True, null=True)
    plant_type = models.CharField(max_length=100, choices=[
        ('Tree', 'Tree'),
        ('Shrub', 'Shrub'),
        ('Herb', 'Herb'),
        ('Flower', 'Flower'),
    ])
    planting_date = models.DateField()
    last_watered_date = models.DateField(blank=True, null=True)  # New field for last watering date
    garden = models.ForeignKey(Garden, on_delete=models.CASCADE, related_name='plants')

    def __str__(self):
        return f"{self.common_name or self.scientific_name} ({self.garden.name})"
