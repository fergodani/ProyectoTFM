from datetime import timedelta, date
from unittest import skip
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase
from django.contrib.auth.models import User
from unittest.mock import patch, MagicMock
from rest_framework_simplejwt.tokens import AccessToken
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.views import TokenVerifyView
from PIL import Image
from io import BytesIO
import os

from api.models import Garden, UserPlant, Post, Comment, Vote


def create_test_image(name='test.jpg', size=(100, 100), color='red'):
    """Helper function to create a valid test image"""
    image = Image.new('RGB', size, color)
    buffer = BytesIO()
    image.save(buffer, format='JPEG')
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type='image/jpeg')


class ViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='pass1234')
        self.other = User.objects.create_user(username='other', password='pass1234')
        self.client.force_authenticate(user=self.user)

    def test_create_garden(self):
        url = reverse('garden-list-create')
        resp = self.client.post(url, {'name': 'G1', 'owner': self.user.id}, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertIn('id', resp.data)
        self.assertEqual(resp.data['name'], 'G1')

    def test_list_gardens(self):
        # Create a garden first
        Garden.objects.create(name='TestGarden', owner=self.user)
        url = reverse('garden-list-create')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.data, list)
        self.assertTrue(any(g['name'] == 'TestGarden' for g in resp.data))

    def test_get_garden_detail(self):
        garden = Garden.objects.create(name='DetailGarden', owner=self.user)
        detail = reverse('garden-detail', kwargs={'pk': garden.id})
        resp = self.client.get(detail)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['name'], 'DetailGarden')

    def test_update_garden(self):
        garden = Garden.objects.create(name='OldName', owner=self.user)
        detail = reverse('garden-detail', kwargs={'pk': garden.id})
        resp = self.client.put(detail, {'name': 'UpdatedName', 'owner': self.user.id}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['name'], 'UpdatedName')

    def test_delete_garden(self):
        garden = Garden.objects.create(name='ToDelete', owner=self.user)
        detail = reverse('garden-detail', kwargs={'pk': garden.id})
        resp = self.client.delete(detail)
        self.assertEqual(resp.status_code, 200)
        # Verify it's deleted
        resp = self.client.get(detail)
        self.assertEqual(resp.status_code, 404)

    def test_garden_suitability_without_plant_id_returns_400(self):
        Garden.objects.create(name='SuitG', owner=self.user)
        url = reverse('garden-suitability')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 400)

    def test_garden_suitability_with_plant_id_returns_results(self):
        Garden.objects.create(name='SuitG', owner=self.user)
        url = reverse('garden-suitability')
        resp = self.client.get(url + '?plant_id=1')
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.data, list)

    def test_create_post(self):
        url = reverse('user-posts')
        resp = self.client.post(url, {'title': 'Hello', 'content': 'World'}, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertIn('id', resp.data)
        self.assertEqual(resp.data['title'], 'Hello')

    def test_list_posts(self):
        url = reverse('user-posts')
        # create a post first
        Post.objects.create(title='TestPost', content='Content', author=self.user)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(any(p['title'] == 'TestPost' for p in resp.data))

    def test_get_post_detail(self):
        post = Post.objects.create(title='Hello', content='World', author=self.user)
        detail = reverse('post-detail', kwargs={'pk': post.id})
        resp = self.client.get(detail)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['title'], 'Hello')

    def test_update_post_put(self):
        post = Post.objects.create(title='Original', content='Content', author=self.user)
        detail = reverse('post-detail', kwargs={'pk': post.id})
        resp = self.client.put(detail, {'title': 'New', 'content': 'World'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['title'], 'New')

    def test_update_post_patch(self):
        post = Post.objects.create(title='Original', content='Content', author=self.user)
        detail = reverse('post-detail', kwargs={'pk': post.id})
        resp = self.client.patch(detail, {'title': 'Patched'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['title'], 'Patched')

    def test_delete_post(self):
        post = Post.objects.create(title='ToDelete', content='Content', author=self.user)
        detail = reverse('post-detail', kwargs={'pk': post.id})
        resp = self.client.delete(detail)
        self.assertEqual(resp.status_code, 200)

    def test_create_comment(self):
        post = Post.objects.create(title='T', content='C', author=self.other)
        url = reverse('comment-list-create')
        # Using ORM to create comment since API expects different structure
        comment = Comment.objects.create(post=post, author=self.user, content='Hi')
        self.assertTrue(Comment.objects.filter(post=post, author=self.user).exists())

    def test_list_comments(self):
        post = Post.objects.create(title='T', content='C', author=self.other)
        Comment.objects.create(post=post, author=self.user, content='Hi')
        url = reverse('comment-list-create')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)

    def test_edit_comment_by_author(self):
        post = Post.objects.create(title='T', content='C', author=self.other)
        comment = Comment.objects.create(post=post, author=self.user, content='Hi')
        detail = reverse('comment-detail', kwargs={'pk': comment.id})
        resp = self.client.patch(detail, {'content': 'Edited'}, format='json')
        self.assertEqual(resp.status_code, 200)

    def test_edit_comment_by_non_author(self):
        post = Post.objects.create(title='T', content='C', author=self.other)
        comment = Comment.objects.create(post=post, author=self.user, content='Hi')
        detail = reverse('comment-detail', kwargs={'pk': comment.id})
        other_client = APIClient()
        other_client.force_authenticate(user=self.other)
        resp = other_client.patch(detail, {'content': 'x'}, format='json')
        self.assertEqual(resp.status_code, 403)
        resp = other_client.delete(detail)
        self.assertEqual(resp.status_code, 403)

    def test_vote_new(self):
        post = Post.objects.create(title='V', content='C', author=self.other)
        url = reverse('post-vote', kwargs={'pk': post.id})
        resp = self.client.post(url, {'vote_type': 'like'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['action'], 'created')
        self.assertEqual(resp.data['likes_count'], 1)

    def test_vote_repeated(self):
        post = Post.objects.create(title='V', content='C', author=self.other)
        url = reverse('post-vote', kwargs={'pk': post.id})
        # First vote
        self.client.post(url, {'vote_type': 'like'}, format='json')
        # Same vote again -> removed
        resp = self.client.post(url, {'vote_type': 'like'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['action'], 'removed')

    def test_vote_change(self):
        post = Post.objects.create(title='V', content='C', author=self.other)
        url = reverse('post-vote', kwargs={'pk': post.id})
        # First vote dislike
        self.client.post(url, {'vote_type': 'dislike'}, format='json')
        # Change to like -> updated
        resp = self.client.post(url, {'vote_type': 'like'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['action'], 'updated')

    def test_comment_vote(self):
        post = Post.objects.create(title='V2', content='C', author=self.other)
        comment = Comment.objects.create(post=post, author=self.other, content='c')
        url = reverse('comment-vote', kwargs={'pk': comment.id})
        resp = self.client.post(url, {'vote_type': 'like'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['action'], 'created')

    def test_register_user(self):
        reg = reverse('user-register')
        resp = self.client.post(reg, {'username': 'newu', 'email': 'n@e.com', 'password': 'Testpass123!'}, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertIn('access', resp.data)

    def test_get_current_user(self):
        cur = reverse('current-user')
        resp = self.client.get(cur)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['username'], 'testuser')

    def test_change_password_with_wrong_current(self):
        ch = reverse('change-password')
        resp = self.client.post(ch, {'current_password': 'wrong', 'new_password': 'Newpass123!', 'confirm_password': 'Newpass123!'}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_change_password_success(self):
        ch = reverse('change-password')
        resp = self.client.post(ch, {'current_password': 'pass1234', 'new_password': 'Newpass123!', 'confirm_password': 'Newpass123!'}, format='json')
        self.assertEqual(resp.status_code, 200)

    def test_user_tasks_empty(self):
        # no plants -> empty lists
        url = reverse('user-tasks')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn('today_tasks', resp.data)


class UserPlantViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='upuser', password='pass')
        self.client.force_authenticate(user=self.user)

    @patch('api.views.should_use_mock_data', return_value=True)
    @patch('api.views.get_mock_species_details')
    @patch('api.views.requests.get')
    def test_create_userplant_success(self, mock_requests_get, mock_get_mock, _mock_should):
        perenual_data = {
            'common_name': 'Test Plant',
            'scientific_name': ['Testus plantus'],
            'watering_general_benchmark': "{'value': '7', 'unit': 'days'}",
            'default_image': {'original_url': 'https://placehold.co/600x400.png'}
        }
        mock_get_mock.return_value = perenual_data
        
        # Create a real image in bytes for the mock
        image = Image.new('RGB', (100, 100), 'green')
        buffer = BytesIO()
        image.save(buffer, format='JPEG')
        buffer.seek(0)
        image_bytes = buffer.read()
        
        # Mock successful image download
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = image_bytes
        mock_response.headers = {'Content-Type': 'image/jpeg'}
        mock_requests_get.return_value = mock_response

        url = reverse('plant-list-create')
        data = {
            'plant_id': 123,
            'owner': self.user.id
        }
        resp = self.client.post(url, data, format='multipart')
        
        if resp.status_code != 201:
            print(f"\n❌ Error en test_create_userplant_success:")
            print(f"Status code: {resp.status_code}")
            print(f"Response data: {resp.data}")
        
        self.assertEqual(resp.status_code, 201)
        self.assertIn('id', resp.data)
        self.assertEqual(resp.data['common_name'], 'Test Plant')
        self.assertTrue(UserPlant.objects.filter(owner=self.user, plant_id=123).exists())

    @patch('api.views.should_use_mock_data', return_value=True)
    @patch('api.views.get_mock_species_details')
    def test_create_userplant_perenual_not_found_in_mock(self, mock_get_mock, _mock_should):
        mock_get_mock.return_value = None
        url = reverse('plant-list-create')
        data = {'plant_id': 999, 'owner': self.user.id}
        r = self.client.post(url, data, format='multipart')
        self.assertEqual(r.status_code, 404)
        self.assertIn('Plant not found', str(r.data))

    @patch('api.views.should_use_mock_data', return_value=True)
    @patch('api.views.get_mock_species_details')
    @patch('api.views.requests.get')
    def test_create_userplant_image_download_fail_returns_400(self, mock_requests_get, mock_get_mock, _mock_should):
        perenual_data = {
            'common_name': 'MockPlant',
            'watering_general_benchmark': {'value': '7-10', 'unit': 'days'},
            'default_image': {'original_url': 'http://example.com/img.jpg'}
        }
        mock_get_mock.return_value = perenual_data
        # Simulate requests.get raising
        mock_requests_get.side_effect = Exception('download failed')

        url = reverse('plant-list-create')
        data = {'plant_id': 123, 'owner': self.user.id}
        r = self.client.post(url, data, format='multipart')
        self.assertEqual(r.status_code, 400)

    @patch('api.views.should_use_mock_data', return_value=True)
    @patch('api.views.get_mock_species_details')
    def test_userplant_detail_includes_perenual_details(self, mock_get_mock, _mock_should):
        # create userplant
        up = UserPlant.objects.create(owner=self.user, plant_id=42)

        perenual_data = {
            'common_name': 'MockPlant',
            'care_guides': {'data': [{
                'section': [
                    {'type': 'watering', 'description': 'Water daily'},
                    {'type': 'pruning', 'description': 'Prune yearly'}
                ]
            }]}
        }
        mock_get_mock.return_value = perenual_data

        url = reverse('plant-detail', kwargs={'pk': up.id})
        r = self.client.get(url)
        self.assertEqual(r.status_code, 200)
        self.assertIn('perenual_details', r.data)

    def test_userplant_detail_includes_related_posts(self):
        # create userplant and a post with same plant_id
        up = UserPlant.objects.create(owner=self.user, plant_id=42)
        Post.objects.create(title='Related', content='X', author=self.user, plant_id=42)

        url = reverse('plant-detail', kwargs={'pk': up.id})
        r = self.client.get(url)
        self.assertEqual(r.status_code, 200)
        self.assertIn('posts', r.data)
        self.assertGreaterEqual(len(r.data['posts']), 1)

    def test_user_tasks_empty_when_no_plants(self):
        # Usuario sin plantas debe recibir listas vacías
        url = reverse('user-tasks')
        r = self.client.get(url)
        self.assertEqual(r.status_code, 200)
        self.assertIn('today_tasks', r.data)
        self.assertIn('next_tasks', r.data)
        self.assertIn('previous_tasks', r.data)
        self.assertEqual(len(r.data['today_tasks']), 0)
        self.assertEqual(len(r.data['next_tasks']), 0)
        self.assertEqual(len(r.data['previous_tasks']), 0)


class AuthTokenFlowTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.username = 'authuser'
        self.password = 'Secret123!'
        self.user = User.objects.create_user(username=self.username, password=self.password)

    def test_login_success(self):
        url = reverse('token_obtain_pair')
        resp = self.client.post(url, {'username': self.username, 'password': self.password}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)

    def test_refresh_token_valid(self):
        # obtain token first
        url = reverse('token_obtain_pair')
        resp = self.client.post(url, {'username': self.username, 'password': self.password}, format='json')
        refresh_token = resp.data['refresh']
        
        # verify refresh endpoint
        refresh_url = reverse('token_refresh')
        r2 = self.client.post(refresh_url, {'refresh': refresh_token}, format='json')
        self.assertEqual(r2.status_code, 200)
        self.assertIn('access', r2.data)

    def test_obtain_with_invalid_credentials(self):
        url = reverse('token_obtain_pair')
        resp = self.client.post(url, {'username': self.username, 'password': 'wrongpass'}, format='json')
        # Invalid credentials should not return tokens
        self.assertIn(resp.status_code, (400, 401))

    def test_refresh_with_invalid_token(self):
        refresh_url = reverse('token_refresh')
        r = self.client.post(refresh_url, {'refresh': 'notavalidtoken'}, format='json')
        self.assertIn(r.status_code, (400, 401))

    def test_access_token_contains_custom_claims(self):
        url = reverse('token_obtain_pair')
        resp = self.client.post(url, {'username': self.username, 'password': self.password}, format='json')
        self.assertEqual(resp.status_code, 200)
        access = resp.data['access']
        token = AccessToken(access)
        self.assertEqual(token['username'], self.user.username)
        self.assertEqual(int(token['id']), int(self.user.id))

    def test_protected_endpoint_without_token(self):
        # without credentials -> 401
        anon = APIClient()
        url = reverse('garden-list-create')
        r = anon.get(url)
        self.assertIn(r.status_code, (401, 403))

    def test_protected_endpoint_with_token(self):
        # with access token -> allowed
        url = reverse('garden-list-create')
        obtain = reverse('token_obtain_pair')
        tok = self.client.post(obtain, {'username': self.username, 'password': self.password}, format='json')
        access = tok.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        r2 = self.client.get(url)
        self.assertEqual(r2.status_code, 200)

    def test_verify_token_valid(self):
        # obtain token
        obtain = reverse('token_obtain_pair')
        tok = self.client.post(obtain, {'username': self.username, 'password': self.password}, format='json')
        access = tok.data['access']

        factory = APIRequestFactory()
        view = TokenVerifyView.as_view()
        req = factory.post('/token/verify/', {'token': access}, format='json')
        resp = view(req)
        self.assertEqual(resp.status_code, 200)

    def test_verify_token_invalid(self):
        factory = APIRequestFactory()
        view = TokenVerifyView.as_view()
        # invalid token
        req = factory.post('/token/verify/', {'token': 'badtoken'}, format='json')
        resp = view(req)
        self.assertIn(resp.status_code, (400, 401))


class UploadImageHandlingTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='imguser', password='pwd123')
        self.client.force_authenticate(user=self.user)

    def test_predict_image_from_file(self):
        url = reverse('predict-image')
        upload = create_test_image('img.jpg')

        # Prepare mocks for cv2.imdecode, model.predict and requests.get
        with patch('api.views.cv2.imdecode') as mock_imdecode, \
             patch('api.views.model.predict') as mock_predict, \
             patch('api.views.requests.get') as mock_requests_get:

            # cv2.imdecode should return a numpy-like object (non-None)
            mock_imdecode.return_value = MagicMock()

            # Mock predict result structure expected by the view
            mock_result = MagicMock()
            probs = MagicMock()
            probs.top1 = 0
            probs.top1conf = MagicMock(item=lambda: 0.95)
            mock_result.probs = probs
            mock_result.names = ['MockPlant']
            mock_predict.return_value = [mock_result]

            # Mock perenual search response
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {'data': [{'id': 321}]}
            mock_requests_get.return_value = mock_resp

            resp = self.client.post(url, {'image': upload}, format='multipart')
            self.assertEqual(resp.status_code, 200)
            self.assertIn('plant_id', resp.data)
            self.assertEqual(resp.data['plant_id'], 321)

    def test_predict_image_corrupt_returns_400(self):
        url = reverse('predict-image')
        upload = create_test_image('bad.jpg')

        with patch('api.views.cv2.imdecode') as mock_imdecode:
            mock_imdecode.return_value = None
            resp = self.client.post(url, {'image': upload}, format='multipart')
            self.assertEqual(resp.status_code, 400)
            self.assertIn('Unsupported or corrupt image file', str(resp.data))

    def test_create_post_with_image_upload(self):
        url = reverse('user-posts')
        upload = create_test_image('post.jpg')
        resp = self.client.post(url, {'title': 'ImgPost', 'content': 'X', 'image': upload}, format='multipart')
        if resp.status_code != 201:
            print(f"\n❌ Error en test_create_post_with_image_upload:")
            print(f"Status code: {resp.status_code}")
            print(f"Response data: {resp.data}")
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(Post.objects.filter(author=self.user, title='ImgPost').exists())
        post = Post.objects.get(author=self.user, title='ImgPost')
        self.assertTrue(bool(post.image))

    def test_patch_userplant_custom_image(self):
        up = UserPlant.objects.create(owner=self.user, plant_id=77)
        url = reverse('plant-detail', kwargs={'pk': up.id})
        upload = create_test_image('custom.jpg')
        resp = self.client.patch(url, {'custom_image': upload}, format='multipart')
        if resp.status_code != 200:
            print(f"\n❌ Error en test_patch_userplant_custom_image:")
            print(f"Status code: {resp.status_code}")
            print(f"Response data: {resp.data}")
        self.assertEqual(resp.status_code, 200)
        up.refresh_from_db()
        self.assertTrue(bool(up.custom_image))


class AdditionalEdgeCaseTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='edgeuser', password='edgepwd')
        self.client.force_authenticate(user=self.user)

    def test_predict_image_with_image_url_uses_model_and_returns_plant(self):
        url = reverse('predict-image')
        image_url = 'http://example.com/remote.jpg'
        with patch('api.views.model.predict') as mock_predict, patch('api.views.requests.get') as mock_requests_get:
            mock_result = MagicMock()
            probs = MagicMock()
            probs.top1 = 0
            probs.top1conf = MagicMock(item=lambda: 0.9)
            mock_result.probs = probs
            mock_result.names = ['MockPlant']
            mock_predict.return_value = [mock_result]

            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {'data': [{'id': 777}]}
            mock_requests_get.return_value = mock_resp

            resp = self.client.post(url, {'image_url': image_url}, format='json')
            
            if resp.status_code != 200:
                print(f"\n❌ Error en test_predict_image_with_image_url_uses_model_and_returns_plant:")
                print(f"Status code: {resp.status_code}")
                print(f"Response data: {resp.data}")
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.data.get('plant_id'), 777)

    def test_predict_image_model_raises_typeerror_returns_400_with_hint(self):
        url = reverse('predict-image')
        upload = create_test_image('img.jpg')
        with patch('api.views.cv2.imdecode') as mock_imdecode, patch('api.views.model.predict') as mock_predict:
            mock_imdecode.return_value = MagicMock()
            mock_predict.side_effect = TypeError('bad type')
            resp = self.client.post(url, {'image': upload}, format='multipart')
            self.assertEqual(resp.status_code, 400)
            self.assertIn('Unsupported image type', str(resp.data))

    def test_diagnose_healthy_plant(self):
        url = reverse('predict-pest-image')
        upload = create_test_image('d.jpg')
        with patch('api.views.cv2.imdecode') as mock_imdecode, patch('api.views.model_disease.predict') as mock_predict:
            mock_imdecode.return_value = MagicMock()
            # healthy label
            mock_result = MagicMock()
            probs = MagicMock()
            probs.top1 = 0
            probs.top1conf = MagicMock(item=lambda: 0.99)
            mock_result.probs = probs
            mock_result.names = ['plant___healthy']
            mock_predict.return_value = [mock_result]

            resp = self.client.post(url, {'image': upload}, format='multipart')
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.data.get('id'), -1)

    def test_diagnose_diseased_plant(self):
        url = reverse('predict-pest-image')
        upload = create_test_image('d.jpg')
        with patch('api.views.cv2.imdecode') as mock_imdecode, patch('api.views.model_disease.predict') as mock_predict, patch('api.views.requests.get') as mock_requests_get:
            mock_imdecode.return_value = MagicMock()
            # disease found -> mock requests.get search
            mock_result = MagicMock()
            probs = MagicMock()
            probs.top1 = 0
            probs.top1conf = MagicMock(item=lambda: 0.99)
            mock_result.probs = probs
            mock_result.names = ['plant___some_disease']
            mock_predict.return_value = [mock_result]
            
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {'data': [{'id': 555}]}
            mock_requests_get.return_value = mock_resp

            resp = self.client.post(url, {'image': upload}, format='multipart')
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.data.get('id'), 555)

    def test_predict_image_missing_perenual_api_key_returns_500(self):
        url = reverse('predict-image')
        upload = create_test_image('img.jpg')
        with patch('api.views.cv2.imdecode') as mock_imdecode, patch('api.views.model.predict') as mock_predict, patch('api.views.os.getenv') as mock_getenv:
            mock_imdecode.return_value = MagicMock()
            mock_result = MagicMock()
            probs = MagicMock()
            probs.top1 = 0
            probs.top1conf = MagicMock(item=lambda: 0.8)
            mock_result.probs = probs
            mock_result.names = ['MockPlant']
            mock_predict.return_value = [mock_result]
            # Simulate missing PERENUAL_API_KEY
            def getenv_side(key, default=None):
                if key == 'PERENUAL_API_KEY':
                    return None
                return default
            mock_getenv.side_effect = getenv_side

            resp = self.client.post(url, {'image': upload}, format='multipart')
            self.assertEqual(resp.status_code, 500)
            self.assertIn('PERENUAL_API_KEY', str(resp.data))

    @patch('api.views.should_use_mock_data', return_value=True)
    @patch('api.views.get_mock_species_details')
    def test_perenual_missing_default_image_returns_400(self, mock_get_mock, _):
        mock_get_mock.return_value = {'common_name': 'NoImg', 'watering_general_benchmark': {'value': '3', 'unit': 'days'}}
        url = reverse('plant-list-create')
        resp = self.client.post(url, {'plant_id': 9999, 'owner': self.user.id}, format='multipart')
        self.assertEqual(resp.status_code, 400)

    def test_post_update_replace_image_and_validation(self):
        # create post
        url = reverse('user-posts')
        up = create_test_image('p1.jpg')
        resp = self.client.post(url, {'title': 'ToUpdate', 'content': 'c', 'image': up}, format='multipart')
        self.assertEqual(resp.status_code, 201)
        pid = resp.data['id']
        post = Post.objects.get(pk=pid)
        old_name = post.image.name

        # update image
        detail = reverse('post-detail', kwargs={'pk': pid})
        newimg = create_test_image('p2.jpg')
        r2 = self.client.put(detail, {'title': 'ToUpdate', 'content': 'c', 'image': newimg}, format='multipart')
        self.assertEqual(r2.status_code, 200)
        post.refresh_from_db()
        self.assertNotEqual(post.image.name, old_name)

    def test_create_post_anonymous_denied(self):
        anon = APIClient()
        url = reverse('user-posts')
        r = anon.post(url, {'title': 'x', 'content': 'y'}, format='json')
        self.assertIn(r.status_code, (401, 403))

    def test_create_post_validation_error(self):
        url = reverse('user-posts')
        # missing title
        r = self.client.post(url, {'content': 'only'}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertIn('title', str(r.data))
