from django.urls import path

from . import views

urlpatterns = [
    # Analytics
    path("overview/", views.OverviewAPI.as_view(), name="dashboard-overview"),
    path("revenue/", views.RevenueChartAPI.as_view(), name="dashboard-revenue"),
    path("recent-orders/", views.RecentOrdersAPI.as_view(), name="dashboard-recent-orders"),
    # Customers
    path("customers/", views.AdminCustomerListView.as_view(), name="dashboard-customers"),
    path("customers/<int:user_id>/", views.AdminCustomerDetailView.as_view(), name="dashboard-customer-detail"),
    # Orders + moderation
    path("orders/", views.AdminOrderListView.as_view(), name="dashboard-orders"),
    path("orders/<str:order_number>/", views.AdminOrderDetailView.as_view(), name="dashboard-order-detail"),
    path("orders/<str:order_number>/approve/", views.ApproveManualPaymentView.as_view(), name="dashboard-order-approve"),
    path("orders/<str:order_number>/reject/", views.RejectManualPaymentView.as_view(), name="dashboard-order-reject"),
    path("orders/<str:order_number>/refund/", views.MarkRefundView.as_view(), name="dashboard-order-refund"),
    # CSV exports
    path("export/orders/", views.ExportOrdersCSV.as_view(), name="dashboard-export-orders"),
    path("export/customers/", views.ExportCustomersCSV.as_view(), name="dashboard-export-customers"),
    path("export/sales/", views.ExportSalesCSV.as_view(), name="dashboard-export-sales"),
]
