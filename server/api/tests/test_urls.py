from django.test import SimpleTestCase
from django.urls import reverse, resolve

from api import views
from rest_framework_simplejwt.views import TokenRefreshView


class UrlsTest(SimpleTestCase):
    def test_garden_list_create_url_resolves(self):
        url = reverse('garden-list-create')
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, views.GardenListCreateView)

    def test_garden_templates_url_resolves(self):
        url = reverse('garden-templates')
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, views.GardenTemplatesView)

    def test_garden_detail_url_resolves(self):
        url = reverse('garden-detail', kwargs={'pk': 1})
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, views.GardenDetailView)

    def test_plant_list_create_url_resolves(self):
        url = reverse('plant-list-create')
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, views.UserPlantListCreateView)

    def test_plant_detail_url_resolves(self):
        url = reverse('plant-detail', kwargs={'pk': 1})
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, views.UserPlantDetailView)

    def test_token_obtain_pair_url_resolves(self):
        url = reverse('token_obtain_pair')
        resolver = resolve(url)
        # CustomTokenObtainPairView is defined in views and wraps TokenObtainPairView
        self.assertTrue(hasattr(resolver.func, 'view_class'))

    def test_token_refresh_url_resolves(self):
        url = reverse('token_refresh')
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, TokenRefreshView)

    def test_user_register_url_resolves(self):
        url = reverse('user-register')
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, views.UserRegisterView)

    def test_post_detail_url_resolves(self):
        url = reverse('post-detail', kwargs={'pk': 1})
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, views.PostDetailView)

    def test_post_vote_url_resolves(self):
        url = reverse('post-vote', kwargs={'pk': 1})
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, views.PostVoteView)

    def test_comment_list_create_url_resolves(self):
        url = reverse('comment-list-create')
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, views.CommentView)

    def test_comment_detail_url_resolves(self):
        url = reverse('comment-detail', kwargs={'pk': 1})
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, views.CommentDetailView)
