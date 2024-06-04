from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.files.base import ContentFile
from random import randint, shuffle

# Create your models here.
    
    

class Session(models.Model):
    game_code = models.IntegerField(unique=True, default=0, validators=[MinValueValidator(0), MaxValueValidator(999999)], primary_key=True)
    draw_time = models.IntegerField(choices=[(30, '30 seconds'), (45, '45 seconds'), (60, '60 seconds')])
    desc_time = models.IntegerField(choices=[(15, '15 seconds'), (30, '30 seconds'), (45, '45 seconds')])
    created_at = models.DateTimeField(auto_now_add=True)
    users = models.ManyToManyField(User, related_name='sessions')
    round = models.IntegerField(default=0, validators=[MinValueValidator(-1), MaxValueValidator(10)])
    last_modified = models.DateTimeField(auto_now=True)
    # round: 0 is lobby, 1-10 is drawing/word guessing, -1 is game over

    def save(self, *args, **kwargs):
        if not self.game_code:
            self.game_code = self.generate_unique_code()
        super().save(*args, **kwargs)

    def generate_unique_code(self):
        while True:
            code = randint(0, 999999)
            if not Session.objects.filter(game_code=code).exists():
                return code
            
    def add_user(self, user):
        self.users.add(user)
        self.save()
    
    def __str__(self):
        return str(self.game_code)
    
    def start_round(self):
        def generate_chains(users):
            shuffle(users)
            n = len(users)
            result = [[] for _ in range(n)]
            
            for i in range(n):
                for j in range(n):
                    result[j].append(users[(i + j) % n])
            
            return result
        
        self.round = 1
        self.save()

        chains = generate_chains(list(self.users.all()))

        for chain in chains:
            chain_instance = self.chains.create()
            for j, user in enumerate(chain):
                ChainUser.objects.create(user=user, chain=chain_instance, order=j)        
        
    
class Chain(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='chains')
    users = models.ManyToManyField(User, through='ChainUser')

class ChainUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    chain = models.ForeignKey(Chain, on_delete=models.CASCADE)
    order = models.PositiveIntegerField()
    
    class Meta:
        ordering = ['order']

class Description(models.Model):
    description = models.TextField(max_length=100)
    chain = models.ForeignKey(Chain, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='descriptions')

    def __str__(self):
        return self.id

class Drawing(models.Model):
    drawing = models.FileField()
    chain = models.ForeignKey(Chain, on_delete=models.CASCADE)
    created_at = models.DateTimeField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='drawings')

    def save(self, *args, **kwargs):
        # Save the instance to the database to get an id
        self.drawing = None
        super().save(*args, **kwargs)

        # Save the file with the correct name
        file_content = self.drawing.file.read()
        self.drawing.save(f'{self.id}.svg', ContentFile(file_content), save=False)

        # Save the instance again
        super().save(*args, **kwargs)

    def __str__(self):
        return self.id
