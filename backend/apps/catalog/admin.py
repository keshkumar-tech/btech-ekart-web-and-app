from django.contrib import admin

from .models import Banner, Branch, Category, Product, SiteSetting, Subject


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "order")
    list_editable = ("is_active", "order")
    search_fields = ("name",)


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "short_name", "is_active")
    list_editable = ("is_active",)
    search_fields = ("name", "short_name")


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "branch", "semester", "code")
    list_filter = ("branch", "semester")
    search_fields = ("name", "code")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "branch", "semester", "price", "mrp", "discount", "rating", "is_active", "is_trending", "is_new_arrival", "sold_count")
    list_filter = ("type", "branch", "semester", "is_active", "is_trending", "is_new_arrival", "category")
    list_editable = ("is_active", "is_trending", "is_new_arrival")
    search_fields = ("title", "subject_code", "tags")
    autocomplete_fields = ("category", "branch", "subject")
    readonly_fields = ("rating", "rating_count", "sold_count", "discount")
    actions = ["make_active", "make_trending", "make_new_arrival"]

    def make_active(self, request, queryset):
        queryset.update(is_active=True)
    make_active.short_description = "Mark selected as active"

    def make_trending(self, request, queryset):
        queryset.update(is_trending=True)
    make_trending.short_description = "Mark as Trending"

    def make_new_arrival(self, request, queryset):
        queryset.update(is_new_arrival=True)
    make_new_arrival.short_description = "Mark as New Arrival"


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("title", "order", "is_active")
    list_editable = ("order", "is_active")
    list_filter = ("is_active",)


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ("key", "updated_at")
    readonly_fields = ("key",)
