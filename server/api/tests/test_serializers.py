from datetime import timedelta, date
import json
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError

from api.serializers import (
    VoteSerializer, CommentSerializer, PostSerializer,
    UserPlantSerializer, UserRegisterSerializer, ChangePasswordSerializer
)
from api.models import Post, Comment, Vote, UserPlant


class VoteSerializerTest(TestCase):
    def test_validate_requires_post_or_comment(self):
        # include vote_type so field-level validation passes and validate() runs
        s = VoteSerializer(data={'vote_type': 'like'})
        self.assertFalse(s.is_valid())
        # now the error about missing post/comment should appear as non_field_errors
        self.assertIn('non_field_errors', s.errors)

    def test_validate_cannot_have_both(self):
        user = User.objects.create_user('u1', 'u1@example.com', 'p')
        post = Post.objects.create(title='T', content='C', author=user)
        comment = Comment.objects.create(post=post, author=user, content='hi')
        s = VoteSerializer(data={'post': post.id, 'comment': comment.id, 'vote_type': 'like'})
        # Should fail validation
        self.assertFalse(s.is_valid())


class CommentSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('cuser', 'c@example.com', 'p')
        self.post = Post.objects.create(title='P', content='C', author=self.user)

    def test_to_representation_hides_deleted_content(self):
        comment = Comment.objects.create(post=self.post, author=self.user, content='secret')
        # mark deleted
        comment.is_deleted = True
        comment.save()
        s = CommentSerializer(comment)
        data = s.data
        self.assertIsNone(data['content'])

    def test_get_created_since_formatting(self):
        comment = Comment.objects.create(post=self.post, author=self.user, content='x')
        # set created_at 90 minutes ago
        created = timezone.now() - timedelta(minutes=90)
        Comment.objects.filter(pk=comment.pk).update(created_at=created)
        comment.refresh_from_db()
        s = CommentSerializer(comment)
        self.assertTrue(s.data['created_since'].endswith('h') or s.data['created_since'].endswith('m'))


class PostSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('puser', 'p@example.com', 'p')
        self.post = Post.objects.create(title='TT', content='CC', author=self.user)

    def test_vote_and_counts(self):
        u2 = User.objects.create_user('u2', 'u2@example.com', 'p')
        Vote.objects.create(user=u2, vote_type='like', post=self.post)
        s = PostSerializer(self.post, context={'request': None})
        self.assertEqual(s.data['likes_count'], 1)
        self.assertEqual(s.data['dislikes_count'], 0)


class UserPlantSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('upuser', 'up@example.com', 'p')
        self.plant = UserPlant.objects.create(owner=self.user, plant_id=1)

    def test_parse_value_range(self):
        s = UserPlantSerializer()
        self.assertEqual(s.parse_value('7-10'), 7)

    def test_parse_value_single(self):
        s = UserPlantSerializer()
        self.assertEqual(s.parse_value('5'), 5)

    def test_get_next_watering_date_recommended_range(self):
        # set last watered and watering_period as recommended range
        today = date.today()
        self.plant.last_watered_date = today
        self.plant.watering_period = {"unit": "days", "value": "7-10"}
        self.plant.watering_type = 'recommended'
        self.plant.isWateringReminder = True
        self.plant.save()
        s = UserPlantSerializer()
        res = s.get_next_watering_date(self.plant)
        # expected around today + (7+10)/2 = 8.5 -> 8 or 9 days
        self.assertIn(res, [today + timedelta(days=8), today + timedelta(days=9)])

    def test_get_next_watering_date_manual(self):
        today = date.today()
        self.plant.last_watered_date = today
        self.plant.watering_type = 'manual'
        self.plant.watering_time = 2
        self.plant.watering_unit = 'week'
        self.plant.isWateringReminder = True
        self.plant.save()
        s = UserPlantSerializer()
        res = s.get_next_watering_date(self.plant)
        self.assertEqual(res, today + timedelta(days=14))


class UserRegisterAndPasswordSerializerTest(TestCase):
    def test_user_register_create(self):
        s = UserRegisterSerializer(data={'username': 'newu', 'email': 'n@example.com', 'password': 'pA123ssw#s0rd'})
        self.assertTrue(s.is_valid(), s.errors)
        user = s.save()
        self.assertTrue(User.objects.filter(username='newu').exists())

    def test_change_password_validation(self):
        user = User.objects.create_user('cp', 'cp@example.com', 'oldpass')
        s = ChangePasswordSerializer(data={'current_password': 'oldpass', 'new_password': 'Newpass123!', 'confirm_password': 'Newpass123!'}, context={'user': user})
        # validate() should run Django password validators; for default settings this should pass
        self.assertEqual(s.is_valid(), True)
