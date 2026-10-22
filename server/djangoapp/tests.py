from django.test import TestCase, Client
from django.urls import reverse
from .models import CarMake, CarModel


class CarModelTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.make = CarMake.objects.create(
            name="Toyota",
            description="Japanese automotive manufacturer"
        )
        self.model = CarModel.objects.create(
            car_make=self.make,
            name="Corolla",
            type="Sedan",
            year=2022
        )

    def test_car_make_str(self):
        self.assertEqual(str(self.make), "Toyota")

    def test_car_model_str(self):
        self.assertEqual(str(self.model), "Toyota Corolla")

    def test_get_cars_endpoint(self):
        response = self.client.get('/djangoapp/get_cars')
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertIn("CarModels", json_data)
        self.assertGreaterEqual(len(json_data["CarModels"]), 1)
