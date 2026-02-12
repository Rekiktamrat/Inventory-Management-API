from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, InventoryItem, InventoryChangeLog

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class InventoryItemSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    managed_by_username = serializers.ReadOnlyField(source='managed_by.username')

    class Meta:
        model = InventoryItem
        fields = (
            'id', 'name', 'description', 'quantity', 'price', 
            'category', 'category_name', 'date_added', 
            'last_updated', 'managed_by', 'managed_by_username'
        )
        read_only_fields = ('managed_by', 'date_added', 'last_updated')

class InventoryChangeLogSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = InventoryChangeLog
        fields = (
            'id', 'item', 'item_name', 'user', 'user_username', 
            'action', 'quantity_changed', 'timestamp', 'remarks'
        )
        read_only_fields = ('user', 'timestamp')
