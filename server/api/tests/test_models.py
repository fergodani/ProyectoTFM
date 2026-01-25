from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError

from api.models import Garden, UserPlant, Post, Comment, Vote


class GardenModelTest(TestCase):
    def test_str_template_and_normal(self):
        owner = User.objects.create_user(username='owner', password='pass')
        g = Garden.objects.create(name='MyGarden', owner=owner)
        self.assertEqual(str(g), 'MyGarden')
        t = Garden.objects.create(name='Temp', owner=owner, is_template=True)
        self.assertEqual(str(t), 'Template: Temp')


class UserPlantModelTest(TestCase):
    def test_str_default_name(self):
        owner = User.objects.create_user(username='u1', password='pass')
        up = UserPlant.objects.create(owner=owner, plant_id=1)
        self.assertTrue(str(up).startswith('Plant '))

    def test_str_custom_name(self):
        owner = User.objects.create_user(username='u1', password='pass')
        up = UserPlant.objects.create(owner=owner, plant_id=1)
        up.custom_name = 'MiPlanta'
        up.save()
        self.assertEqual(str(up), 'MiPlanta')


class PostModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='puser', password='pass')
        self.post = Post.objects.create(title='T', content='C', author=self.user)

    def test_get_likes_dislikes_and_score(self):
        u2 = User.objects.create_user(username='u2', password='pass')
        Vote.objects.create(user=u2, vote_type='like', post=self.post)
        self.assertEqual(self.post.get_likes_count(), 1)
        self.assertEqual(self.post.get_dislikes_count(), 0)
        self.assertEqual(self.post.get_vote_score(), 1)

    def test_get_vote_score_with_mixed_votes(self):
        # add a dislike and check counts and score (min 0)
        u2 = User.objects.create_user(username='u2', password='pass')
        Vote.objects.create(user=u2, vote_type='like', post=self.post)
        u3 = User.objects.create_user(username='u3', password='pass')
        Vote.objects.create(user=u3, vote_type='dislike', post=self.post)
        self.assertEqual(self.post.get_likes_count(), 1)
        self.assertEqual(self.post.get_dislikes_count(), 1)
        self.assertEqual(self.post.get_vote_score(), 0)

    def test_get_user_vote(self):
        u2 = User.objects.create_user(username='u4', password='pass')
        self.assertIsNone(self.post.get_user_vote(u2))
        Vote.objects.create(user=u2, vote_type='dislike', post=self.post)
        self.assertEqual(self.post.get_user_vote(u2), 'dislike')


class VoteConstraintsTest(TestCase):
    def test_unique_vote_per_user_and_post(self):
        u1 = User.objects.create_user(username='vuser', password='pass')
        p = Post.objects.create(title='X', content='Y', author=u1)
        Vote.objects.create(user=u1, vote_type='like', post=p)
        # second vote by same user on same post should raise IntegrityError
        with self.assertRaises(IntegrityError):
            Vote.objects.create(user=u1, vote_type='dislike', post=p)


class CommentModelTest(TestCase):
    def test_comment_str_and_vote_helpers(self):
        u1 = User.objects.create_user(username='cuser', password='pass')
        post = Post.objects.create(title='PT', content='CT', author=u1)
        comment = Comment.objects.create(post=post, author=u1, content='hey')
        self.assertIn('Comment by', str(comment))
        # votes on comment
        vuser = User.objects.create_user(username='v2', password='p')
        Vote.objects.create(user=vuser, vote_type='like', comment=comment)
        self.assertEqual(comment.get_likes_count(), 1)
        self.assertEqual(comment.get_dislikes_count(), 0)
        self.assertEqual(comment.get_vote_score(), 1)
