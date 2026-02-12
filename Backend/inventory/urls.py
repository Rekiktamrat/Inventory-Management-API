from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, CategoryViewSet, InventoryItemViewSet, InventoryChangeLogViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'items', InventoryItemViewSet, basename='inventoryitem')
router.register(r'logs', InventoryChangeLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
