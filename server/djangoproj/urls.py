"""djangoproj URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
"""
import os
from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf import settings
from django.http import Http404

def serve_static(request, path, **kwargs):
    # Try STATIC_ROOT first
    if getattr(settings, 'STATIC_ROOT', None):
        full_path = os.path.join(settings.STATIC_ROOT, path)
        if os.path.exists(full_path) and os.path.isfile(full_path):
            return serve(request, path, document_root=settings.STATIC_ROOT, **kwargs)
    # Check each directory in STATICFILES_DIRS
    for static_dir in getattr(settings, 'STATICFILES_DIRS', []):
        full_path = os.path.join(static_dir, path)
        if os.path.exists(full_path) and os.path.isfile(full_path):
            return serve(request, path, document_root=static_dir, **kwargs)
    raise Http404(f"'{path}' could not be found")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('djangoapp/', include('djangoapp.urls')),
    path('', TemplateView.as_view(template_name="Home.html")),
    path('about/', TemplateView.as_view(template_name="About.html")),
    path('contact/', TemplateView.as_view(template_name="Contact.html")),
    path('login/', TemplateView.as_view(template_name="index.html")),
    path('register/', TemplateView.as_view(template_name="index.html")),
    path('dealers/', TemplateView.as_view(template_name="index.html")),
    path('dealer/<int:dealer_id>', TemplateView.as_view(template_name="index.html")),
    path('postreview/<int:dealer_id>', TemplateView.as_view(template_name="index.html")),
    re_path(r'^static/(?P<path>.*)$', serve_static),
]
