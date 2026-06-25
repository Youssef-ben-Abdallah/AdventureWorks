# Traceability matrix

| Requirement ID | Requirement | Scenario / Test case | Level | Suite |
| --- | --- | --- | --- | --- |
| REQ-ADM-01 | Category creation requires admin rights. | TC019 - Category create requires admin | unit_level | `tests/admin_page/test_admin_page.py::test_category_create_requires_admin` |
| REQ-ADM-02 | Admin can manage categories. | TC020 - Admin category CRUD | unit_level | `tests/admin_page/test_admin_page.py::test_admin_can_create_update_delete_category` |
| REQ-ADM-03 | Admin can manage subcategories. | TC021 - Admin subcategory CRUD | unit_level | `tests/admin_page/test_admin_page.py::test_admin_can_create_update_delete_subcategory` |
| REQ-ADM-04 | Admin can manage products. | TC022 - Admin product CRUD | unit_level | `tests/admin_page/test_admin_page.py::test_admin_can_create_update_delete_product` |
| REQ-ADM-05 | Duplicate SKU is rejected. | TC023 - Duplicate SKU rejected | unit_level | `tests/admin_page/test_admin_page.py::test_duplicate_sku_rejected` |
| REQ-ADM-06 | Invalid image upload extension is rejected. | TC024 - Invalid image rejected | unit_level | `tests/admin_page/test_admin_page.py::test_invalid_image_extension_rejected` |
| REQ-ADM-07 | Admin can list all orders. | TC025 - Admin list all orders | unit_level | `tests/orders_page/test_orders_page.py::test_admin_can_list_all_orders` |
| REQ-ADM-08 | Admin can update order status. | TC026 - Admin update order status | unit_level | `tests/orders_page/test_orders_page.py::test_admin_can_update_order_status` |
| REQ-ADM-09 | Authenticated non-admin users must not access the admin route. | TC041 - Non-admin admin route redirect | system | `tests/admin_page/test_admin_page.py::test_non_admin_user_is_redirected_from_admin_route` |
| REQ-ADM-10 | Admin catalog updates are reflected in the public catalog. | TC044 - Admin catalog changes visible publicly | integration | `tests/products_page/test_products_page.py::test_admin_catalog_changes_are_visible_in_public_products` |
| REQ-AUTH-01 | User registration returns a JWT and User role. | TC001 - Register user | unit_level | `tests/login_page/test_login_page.py::test_register_returns_token_and_user_role` |
| REQ-AUTH-01 | User registration returns a JWT and User role. | TC039 - User end-to-end checkout | system | `tests/orders_page/test_orders_page.py::test_user_can_register_browse_add_checkout_and_see_orders` |
| REQ-AUTH-02 | User login succeeds with valid credentials. | TC002 - Login valid credentials | unit_level | `tests/login_page/test_login_page.py::test_me_returns_identity_after_login` |
| REQ-AUTH-03 | Invalid credentials are rejected. | TC003 - Login invalid credentials | unit_level | `tests/login_page/test_login_page.py::test_login_with_invalid_password_is_rejected` |
| REQ-AUTH-04 | Protected identity endpoint requires authentication. | TC004 - Protected me requires auth | unit_level | `tests/login_page/test_login_page.py::test_me_requires_auth` |
| REQ-AUTH-05 | Logging out removes privileged navigation and session-driven admin access indicators. | TC049 - Logout hides admin navigation | system | `tests/navbar_page/test_navbar_page.py::test_logout_hides_admin_navigation` |
| REQ-CAT-01 | Products list is public and populated. | TC005 - Public products list | unit_level | `tests/products_page/test_products_page.py::test_products_list_is_public_and_non_empty` |
| REQ-CAT-02 | Product detail is accessible publicly. | TC006 - Public product detail | unit_level | `tests/products_page/test_products_page.py::test_product_by_id_returns_shape` |
| REQ-CAT-03 | Guest cart access is redirected to login on the UI. | TC007 - Guest cart redirect | system | `tests/cart_page/test_cart_page.py::test_guest_is_redirected_to_login_when_opening_cart` |
| REQ-CAT-04 | Products page supports pagination and browsing. | TC008 - Products pagination | system | `tests/products_page/test_products_page.py::test_products_pagination_controls_work` |
| REQ-CAT-05 | Cart quantity cannot exceed product stock. | TC009 - Cart stock cap | static | `tests/cart_page/test_cart_page.py::test_cart_setqty_is_capped_to_stock` |
| REQ-CAT-06 | Unknown product ids return 404. | TC042 - Unknown product returns 404 | unit_level | `tests/products_page/test_products_page.py::test_unknown_product_returns_404` |
| REQ-CAT-07 | Categories list is publicly accessible and non-empty. | TC073 - Categories list is public | unit_level | `tests/products_page/test_products_page.py::test_categories_list_is_public_and_non_empty` |
| REQ-CAT-08 | SubCategories list is publicly accessible and non-empty. | TC074 - SubCategories list is public | unit_level | `tests/products_page/test_products_page.py::test_subcategories_list_is_public_and_non_empty` |
| REQ-CAT-09 | Product DTO includes all fields required by the React Product type. | TC075 - Product DTO matches React model | unit_level | `tests/products_page/test_products_page.py::test_product_dto_shape_matches_react_model` |
| REQ-DASH-01 | Dashboard is admin only. | TC027 - Dashboard requires admin | unit_level | `tests/dashboard_page/test_dashboard_page.py::test_dashboard_filters_requires_admin` |
| REQ-DASH-01 | Dashboard is admin only. | TC040 - Admin UI access | system | `tests/admin_page/test_admin_page.py::test_admin_can_login_and_open_admin_and_dashboard` |
| REQ-DASH-02 | Dashboard filters endpoint returns reference data. | TC028 - Dashboard filters payload | unit_level | `tests/dashboard_page/test_dashboard_page.py::test_admin_filters_returns_reference_lists` |
| REQ-DASH-03 | Overview endpoint returns KPI payload. | TC029 - Overview KPI payload | unit_level | `tests/dashboard_page/test_dashboard_page.py::test_overview_returns_kpis` |
| REQ-DASH-04 | Details endpoint is paginated. | TC030 - Details paginated | unit_level | `tests/dashboard_page/test_dashboard_page.py::test_details_endpoint_is_paginated` |
| REQ-DASH-05 | Dashboard products tab returns structured data. | TC061 - Dashboard products tab | unit_level | `tests/dashboard_page/test_dashboard_page.py::test_dashboard_products_tab_returns_data` |
| REQ-DASH-06 | Dashboard customers tab returns data. | TC062 - Dashboard customers tab | unit_level | `tests/dashboard_page/test_dashboard_page.py::test_dashboard_customers_tab_returns_data` |
| REQ-DASH-07 | Dashboard shipping tab returns data. | TC063 - Dashboard shipping tab | unit_level | `tests/dashboard_page/test_dashboard_page.py::test_dashboard_shipping_tab_returns_data` |
| REQ-DASH-08 | Dashboard sales team tab returns data. | TC064 - Dashboard sales team tab | unit_level | `tests/dashboard_page/test_dashboard_page.py::test_dashboard_sales_team_tab_returns_data` |
| REQ-DASH-09 | Applying a territory filter changes the overview response. | TC065 - Dashboard territory filter changes results | integration | `tests/dashboard_page/test_dashboard_page.py::test_overview_territory_filter_applied` |
| REQ-DASH-10 | Dashboard details pagination returns different items per page. | TC066 - Dashboard pagination boundary | unit_level | `tests/dashboard_page/test_dashboard_page.py::test_details_page_boundary_values` |
| REQ-NF-01 | Products endpoint responds within 2 seconds. | TC031 - Products latency | integration | `tests/products_page/test_products_page.py::test_products_response_under_two_seconds` |
| REQ-NF-02 | Dashboard filters respond within 2.5 seconds. | TC032 - Dashboard filters latency | integration | `tests/dashboard_page/test_dashboard_page.py::test_dashboard_filters_under_two_point_five_seconds` |
| REQ-NF-03 | Unauthorized API access returns 401 and no login redirect HTML. | TC033 - 401 without redirect html | integration | `tests/orders_page/test_orders_page.py::test_unauthorized_endpoint_returns_401_not_redirect_html` |
| REQ-NF-04 | SQL injection-like login payload is rejected. | TC034 - Injection-like login rejected | unit_level | `tests/login_page/test_login_page.py::test_sql_injection_style_username_does_not_bypass_auth` |
| REQ-NF-05 | Authenticated non-admin users receive 403 on admin-only endpoints. | TC046 - Non-admin endpoint returns 403 | integration | `tests/admin_page/test_admin_page.py::test_non_admin_endpoint_returns_403` |
| REQ-ORD-01 | Order creation requires at least one line item. | TC010 - Empty order rejected | unit_level | `tests/orders_page/test_orders_page.py::test_empty_order_rejected` |
| REQ-ORD-02 | Order rejects invalid product ids. | TC011 - Invalid product rejected | unit_level | `tests/orders_page/test_orders_page.py::test_invalid_product_rejected` |
| REQ-ORD-03 | Order rejects negative or zero quantities. | TC012 - Negative quantity rejected | unit_level | `tests/orders_page/test_orders_page.py::test_negative_qty_rejected` |
| REQ-ORD-04 | Order rejects quantities above available stock. | TC013 - Overstock rejected | unit_level | `tests/orders_page/test_orders_page.py::test_overstock_order_rejected` |
| REQ-ORD-05 | Valid order creation returns a persisted order. | TC014 - Valid order creation | unit_level | `tests/orders_page/test_orders_page.py::test_valid_order_creation_returns_201_and_items` |
| REQ-ORD-06 | User can read own order history. | TC015 - My orders contains created order | unit_level | `tests/orders_page/test_orders_page.py::test_my_orders_contains_created_order` |
| REQ-ORD-07 | Non-owner cannot read another user order. | TC016 - Non-owner forbidden | unit_level | `tests/orders_page/test_orders_page.py::test_non_owner_cannot_read_foreign_order` |
| REQ-ORD-08 | Stock decreases after successful checkout. | TC017 - Stock decreases after order | integration | `tests/orders_page/test_orders_page.py::test_stock_decreases_after_order_creation` |
| REQ-ORD-09 | Referenced products return conflict on delete. | TC018 - Referenced product delete conflict | integration | `tests/admin_page/test_admin_page.py::test_delete_referenced_product_returns_conflict` |
| REQ-ORD-10 | Order history endpoint requires authentication. | TC043 - Orders mine requires auth | unit_level | `tests/orders_page/test_orders_page.py::test_orders_mine_requires_auth` |
| REQ-ORD-11 | Registered users can complete an order flow and read it back in history. | TC045 - Registered user browse order history flow | integration | `tests/orders_page/test_orders_page.py::test_registered_user_can_browse_order_and_see_history` |
| REQ-ORD-12 | Order DTO includes all fields required by the React OrderDto type. | TC076 - Order DTO shape is complete | integration | `tests/orders_page/test_orders_page.py::test_order_dto_shape_is_complete` |
| REQ-ORD-13 | Order with zero quantity is rejected. | TC077 - Zero quantity order rejected | unit_level | `tests/orders_page/test_orders_page.py::test_order_with_zero_quantity_rejected` |
| REQ-ORD-14 | Orders page renders React order-card elements in the browser. | TC078 - Orders page shows order cards | system | `tests/orders_page/test_orders_page.py::test_orders_page_shows_order_cards` |
| REQ-POM-01 | Base page can translate a test id into a stable CSS selector tuple. | TC050 - Base page builds test-id selector | unit_level | `tests/base_page/test_base_page.py::test_by_testid_returns_css_selector_tuple` |
| REQ-POM-02 | Base page open helper delegates browser navigation to the active driver. | TC051 - Base page open delegates navigation | unit_level | `tests/base_page/test_base_page.py::test_open_delegates_to_driver_get` |
| REQ-STAT-01 | Order source code visibly decrements stock. | TC035 - Source shows stock decrement | static | `tests/orders_page/test_orders_page.py::test_order_creation_decrements_stock_in_source` |
| REQ-STAT-02 | Delete endpoints handle FK conflicts gracefully. | TC036 - Conflict handling in delete endpoints | static | `tests/admin_page/test_admin_page.py::test_delete_actions_handle_conflicts_gracefully` |
| REQ-STAT-03 | Stable UI selectors exist for key pages. | TC037 - Stable selectors added | static | `tests/source_audit/test_source_audit.py::test_key_pages_have_stable_test_ids` |
| REQ-STAT-04 | Scanned HTML images include alt text. | TC038 - Image alt attributes | static | `tests/source_audit/test_source_audit.py::test_scanned_images_have_alt_attributes` |
| REQ-STAT-05 | Static audit confirms the targeted corrective changes remain present. | TC047 - Static audit detects key improvements | static | `tests/source_audit/test_source_audit.py::test_static_audit_detects_key_improvements` |
| REQ-CUBE-01 | CubeInsights /kpis returns a valid payload. | TC052 - CubeInsights KPIs payload | unit_level | `tests/cube_insights/test_cube_insights.py::test_cube_insights_kpis_returns_valid_payload` |
| REQ-CUBE-02 | CubeInsights /sales-trend returns monthly data points. | TC053 - CubeInsights monthly trend | unit_level | `tests/cube_insights/test_cube_insights.py::test_cube_insights_sales_trend_monthly` |
| REQ-CUBE-03 | CubeInsights /sales-trend with month param returns daily drill-down data. | TC054 - CubeInsights daily drill-down | unit_level | `tests/cube_insights/test_cube_insights.py::test_cube_insights_sales_trend_drilldown` |
| REQ-CUBE-04 | CubeInsights /profit-analysis returns structured profit data. | TC055 - CubeInsights profit analysis | unit_level | `tests/cube_insights/test_cube_insights.py::test_cube_insights_profit_analysis` |
| REQ-CUBE-05 | CubeInsights /territories returns a non-empty list. | TC056 - CubeInsights territories | unit_level | `tests/cube_insights/test_cube_insights.py::test_cube_insights_territories` |
| REQ-CUBE-06 | CubeInsights /reseller returns 200 or graceful non-200. | TC057 - CubeInsights reseller data | unit_level | `tests/cube_insights/test_cube_insights.py::test_cube_insights_reseller_data` |
| REQ-CUBE-07 | CubeInsights endpoints are publicly accessible (no JWT required). | TC058 - CubeInsights endpoints are public | unit_level | `tests/cube_insights/test_cube_insights.py::test_cube_insights_kpis_is_public` |
| REQ-CUBE-08 | Filtering by year changes the CubeInsights sales-trend result. | TC059 - CubeInsights year filter changes result | integration | `tests/cube_insights/test_cube_insights.py::test_cube_insights_year_filter_changes_result` |
| REQ-CUBE-09 | CubeInsights /kpis responds within 5 seconds. | TC060 - CubeInsights latency | integration | `tests/cube_insights/test_cube_insights.py::test_cube_insights_kpis_under_five_seconds` |
| REQ-REACT-01 | React KpiCards component renders KPI elements in the dashboard. | TC067 - React KPI cards render in browser | system | `tests/dashboard_page/test_dashboard_page.py::test_dashboard_kpi_cards_render_in_react` |
| REQ-REACT-02 | Theme toggle changes a CSS class on the html/body element. | TC068 - Theme toggle changes body class | system | `tests/navbar_page/test_navbar_page.py::test_theme_toggle_changes_body_class` |
| REQ-REACT-03 | Admin nav links (Admin, Dashboard, Reseller Insights) are visible after admin login. | TC069 - Admin nav links visible after login | system | `tests/navbar_page/test_navbar_page.py::test_admin_nav_links_visible_after_login` |
| REQ-REACT-04 | Regular users do not see admin nav links. | TC070 - Regular user does not see admin nav | system | `tests/navbar_page/test_navbar_page.py::test_regular_user_does_not_see_admin_nav` |
| REQ-REACT-05 | React migration entry point App.tsx exists in the source tree. | TC071 - React app entry point exists | static | `tests/source_audit/test_source_audit.py::test_react_app_entry_point_exists` |
| REQ-REACT-06 | CartContext.tsx caps quantity to product stockQty. | TC072 - CartContext caps quantity to stock | static | `tests/source_audit/test_source_audit.py::test_cart_context_caps_quantity_to_stock` |
| REQ-CART-01 | Cart clear button empties all items from the cart. | TC079 - Cart clear empties cart | system | `tests/cart_page/test_cart_page.py::test_cart_clear_empties_cart` |
