from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.models import User
from .models import Category, InventoryItem, InventoryChangeLog
from .serializers import UserSerializer, CategorySerializer, InventoryItemSerializer, InventoryChangeLogSerializer

class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        return obj.managed_by == request.user

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class InventoryItemViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['category', 'price']
    ordering_fields = ['name', 'quantity', 'price', 'date_added']
    search_fields = ['name', 'description']

    def get_queryset(self):
        # Users can only see their own items unless we want a global view
        # The requirement says "view inventory levels for all items" 
        # but also "permission checks to ensure that users can only manage their own inventory items"
        # I'll allow viewing all items but managing only own.
        return InventoryItem.objects.all()

    def perform_create(self, serializer):
        item = serializer.save(managed_by=self.request.user)
        InventoryChangeLog.objects.create(
            item=item,
            item_name=item.name,
            user=self.request.user,
            action='CREATE',
            quantity_changed=item.quantity,
            remarks="Initial creation"
        )

    def perform_update(self, serializer):
        old_item = self.get_object()
        old_quantity = old_item.quantity
        item = serializer.save()
        new_quantity = item.quantity
        
        if old_quantity != new_quantity:
            action_type = 'RESTOCK' if new_quantity > old_quantity else 'SALE'
            quantity_diff = new_quantity - old_quantity
            InventoryChangeLog.objects.create(
                item=item,
                item_name=item.name,
                user=self.request.user,
                action=action_type,
                quantity_changed=quantity_diff,
                remarks=f"Quantity updated from {old_quantity} to {new_quantity}"
            )
        else:
            InventoryChangeLog.objects.create(
                item=item,
                item_name=item.name,
                user=self.request.user,
                action='UPDATE',
                quantity_changed=0,
                remarks="Item details updated"
            )

    def perform_destroy(self, instance):
        InventoryChangeLog.objects.create(
            item=None,
            item_name=instance.name,
            user=self.request.user,
            action='DELETE',
            quantity_changed=-instance.quantity,
            remarks=f"Item '{instance.name}' deleted"
        )
        instance.delete()

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        threshold = request.query_params.get('threshold', 10)
        try:
            threshold = int(threshold)
        except ValueError:
            return Response({"error": "Threshold must be an integer"}, status=status.HTTP_400_BAD_REQUEST)
        
        items = InventoryItem.objects.filter(quantity__lt=threshold)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

class InventoryChangeLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryChangeLog.objects.all()
    serializer_class = InventoryChangeLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['item', 'user', 'action']
    ordering_fields = ['timestamp']

    def get_queryset(self):
        # Optionally filter by item_id if provided in query params
        item_id = self.request.query_params.get('item_id')
        if item_id:
            return InventoryChangeLog.objects.filter(item_id=item_id)
        return super().get_queryset()
