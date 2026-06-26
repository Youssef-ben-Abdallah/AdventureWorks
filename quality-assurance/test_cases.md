# Enhanced QA Test Cases

| TC ID | Category | Test Case | Level | Type | Technique | Requirement | Description |
|-------|----------|-----------|-------|------|-----------|-------------|-------------|
| TC001 | login_page | `test_register_returns_token_and_user_role` | unit_level | functional | black-box equivalence | REQ-AUTH-01 | Register returns token and user role |
| TC002 | login_page | `test_me_returns_identity_after_login` | unit_level | functional | black-box nominal | REQ-AUTH-02 | Me returns identity after login |
| TC003 | login_page | `test_login_with_invalid_password_is_rejected` | unit_level | functional | black-box equivalence | REQ-AUTH-03 | Login with invalid password is rejected |
| TC004 | login_page | `test_me_requires_auth` | unit_level | security | black-box access control | REQ-AUTH-04 | Me requires auth |
| TC005 | products_page | `test_products_list_is_public_and_non_empty` | unit_level | functional | black-box nominal | REQ-CAT-01 | Products list is public and non empty |
| TC006 | products_page | `test_product_by_id_returns_shape` | unit_level | functional | black-box boundary | REQ-CAT-02 | Product by id returns shape |
| TC007 | cart_page | `test_guest_is_redirected_to_login_when_opening_cart` | system | functional | black-box navigation | REQ-CAT-03 | Guest is redirected to login when opening cart |
| TC008 | products_page | `test_products_pagination_controls_work` | system | functional | black-box state transition | REQ-CAT-04 | Products pagination controls work |
| TC009 | cart_page | `test_cart_setqty_is_capped_to_stock` | static | functional | white-box code inspection | REQ-CAT-05 | Cart setqty is capped to stock |
| TC010 | orders_page | `test_empty_order_rejected` | unit_level | functional | black-box boundary | REQ-ORD-01 | Empty order rejected |
| TC011 | orders_page | `test_invalid_product_rejected` | unit_level | functional | black-box equivalence | REQ-ORD-02 | Invalid product rejected |
| TC012 | orders_page | `test_negative_qty_rejected` | unit_level | functional | black-box boundary | REQ-ORD-03 | Negative qty rejected |
| TC013 | orders_page | `test_overstock_order_rejected` | unit_level | functional | black-box boundary | REQ-ORD-04 | Overstock order rejected |
| TC014 | orders_page | `test_valid_order_creation_returns_201_and_items` | unit_level | functional | black-box nominal | REQ-ORD-05 | Valid order creation returns 201 and items |
| TC015 | orders_page | `test_my_orders_contains_created_order` | unit_level | functional | black-box nominal | REQ-ORD-06 | My orders contains created order |
| TC016 | orders_page | `test_non_owner_cannot_read_foreign_order` | unit_level | security | black-box access control | REQ-ORD-07 | Non owner cannot read foreign order |
| TC017 | orders_page | `test_stock_decreases_after_order_creation` | integration | confirmation | black-box workflow | REQ-ORD-08 | Stock decreases after order creation |
| TC018 | admin_page | `test_delete_referenced_product_returns_conflict` | integration | confirmation | black-box workflow | REQ-ORD-09 | Delete referenced product returns conflict |
| TC019 | admin_page | `test_category_create_requires_admin` | unit_level | security | black-box access control | REQ-ADM-01 | Category create requires admin |
| TC020 | admin_page | `test_admin_can_create_update_delete_category` | unit_level | functional | black-box CRUD | REQ-ADM-02 | Admin can create update delete category |
| TC021 | admin_page | `test_admin_can_create_update_delete_subcategory` | unit_level | functional | black-box CRUD | REQ-ADM-03 | Admin can create update delete subcategory |
| TC022 | admin_page | `test_admin_can_create_update_delete_product` | unit_level | functional | black-box CRUD | REQ-ADM-04 | Admin can create update delete product |
| TC023 | admin_page | `test_duplicate_sku_rejected` | unit_level | functional | black-box equivalence | REQ-ADM-05 | Duplicate sku rejected |
| TC024 | admin_page | `test_invalid_image_extension_rejected` | unit_level | security | black-box equivalence | REQ-ADM-06 | Invalid image extension rejected |
| TC025 | orders_page | `test_admin_can_list_all_orders` | unit_level | functional | black-box nominal | REQ-ADM-07 | Admin can list all orders |
| TC026 | orders_page | `test_admin_can_update_order_status` | unit_level | functional | black-box state transition | REQ-ADM-08 | Admin can update order status |
| TC027 | dashboard_page | `test_dashboard_filters_requires_admin` | unit_level | security | black-box access control | REQ-DASH-01 | Dashboard filters requires admin |
| TC028 | dashboard_page | `test_admin_filters_returns_reference_lists` | unit_level | functional | black-box nominal | REQ-DASH-02 | Admin filters returns reference lists |
| TC029 | dashboard_page | `test_overview_returns_kpis` | unit_level | functional | black-box nominal | REQ-DASH-03 | Overview returns kpis |
| TC030 | dashboard_page | `test_details_endpoint_is_paginated` | unit_level | functional | black-box boundary | REQ-DASH-04 | Details endpoint is paginated |
| TC031 | products_page | `test_products_response_under_two_seconds` | integration | non-functional/performance | measurement | REQ-NF-01 | Products response under two seconds |
| TC032 | dashboard_page | `test_dashboard_filters_under_two_point_five_seconds` | integration | non-functional/performance | measurement | REQ-NF-02 | Dashboard filters under two point five seconds |
| TC033 | orders_page | `test_unauthorized_endpoint_returns_401_not_redirect_html` | integration | non-functional/security | black-box access control | REQ-NF-03 | Unauthorized endpoint returns 401 not redirect html |
| TC034 | login_page | `test_sql_injection_style_username_does_not_bypass_auth` | unit_level | non-functional/security | black-box robustness | REQ-NF-04 | Sql injection style username does not bypass auth |
| TC035 | orders_page | `test_order_creation_decrements_stock_in_source` | static | static | white-box code inspection | REQ-STAT-01 | Order creation decrements stock in source |
| TC036 | admin_page | `test_delete_actions_handle_conflicts_gracefully` | static | static | white-box code inspection | REQ-STAT-02 | Delete actions handle conflicts gracefully |
| TC037 | source_audit | `test_key_pages_have_stable_test_ids` | static | static | white-box code inspection | REQ-STAT-03 | Key pages have stable ids |
| TC038 | source_audit | `test_scanned_images_have_alt_attributes` | static | non-functional/accessibility | white-box code inspection | REQ-STAT-04 | Scanned images have alt attributes |
| TC039 | orders_page | `test_user_can_register_browse_add_checkout_and_see_orders` | system | functional | black-box end-to-end | REQ-AUTH-01 | User can register browse add checkout and see orders |
| TC040 | admin_page | `test_admin_can_login_and_open_admin_and_dashboard` | system | functional | black-box end-to-end | REQ-DASH-01 | Admin can login and open admin and dashboard |
| TC041 | admin_page | `test_non_admin_user_is_redirected_from_admin_route` | system | functional/security | black-box access control | REQ-ADM-09 | Non admin user is redirected from admin route |
| TC042 | products_page | `test_unknown_product_returns_404` | unit_level | functional | black-box boundary | REQ-CAT-06 | Unknown product returns 404 |
| TC043 | orders_page | `test_orders_mine_requires_auth` | unit_level | security | black-box access control | REQ-ORD-10 | Orders mine requires auth |
| TC044 | products_page | `test_admin_catalog_changes_are_visible_in_public_products` | integration | functional | black-box workflow | REQ-ADM-10 | Admin catalog changes are visible in public products |
| TC045 | orders_page | `test_registered_user_can_browse_order_and_see_history` | integration | functional | black-box workflow | REQ-ORD-11 | Registered user can browse order and see history |
| TC046 | admin_page | `test_non_admin_endpoint_returns_403` | integration | non-functional/security | black-box access control | REQ-NF-05 | Non admin endpoint returns 403 |
| TC047 | source_audit | `test_static_audit_detects_key_improvements` | static | static/regression | white-box code inspection | REQ-STAT-05 | Static audit detects key improvements |
| TC048 | login_page | `test_invalid_login_shows_error` | system | functional/security | black-box equivalence | REQ-AUTH-03 | Invalid login shows error |
| TC049 | navbar_page | `test_logout_hides_admin_navigation` | system | functional/security | black-box state transition | REQ-AUTH-05 | Logout hides admin navigation |
| TC050 | base_page | `test_by_testid_returns_css_selector_tuple` | unit_level | functional | white-box helper verification | REQ-POM-01 | By testid returns css selector tuple |
| TC051 | base_page | `test_open_delegates_to_driver_get` | unit_level | functional | white-box helper verification | REQ-POM-02 | Open delegates to driver get |
| TC052 | cube_insights | `test_cube_insights_kpis_returns_valid_payload` | unit_level | functional | black-box nominal | REQ-CUBE-01 | Cube insights kpis returns valid payload |
| TC053 | cube_insights | `test_cube_insights_sales_trend_monthly` | unit_level | functional | black-box nominal | REQ-CUBE-02 | Cube insights sales trend monthly |
| TC054 | cube_insights | `test_cube_insights_sales_trend_drilldown` | unit_level | functional | black-box equivalence | REQ-CUBE-03 | Cube insights sales trend drilldown |
| TC055 | cube_insights | `test_cube_insights_profit_analysis` | unit_level | functional | black-box nominal | REQ-CUBE-04 | Cube insights profit analysis |
| TC056 | cube_insights | `test_cube_insights_territories` | unit_level | functional | black-box nominal | REQ-CUBE-05 | Cube insights territories |
| TC057 | cube_insights | `test_cube_insights_reseller_data` | unit_level | functional | black-box nominal | REQ-CUBE-06 | Cube insights reseller data |
| TC058 | cube_insights | `test_cube_insights_kpis_is_public` | unit_level | security | black-box access control | REQ-CUBE-07 | CubeInsights endpoints must not require authentication. |
| TC059 | cube_insights | `test_cube_insights_year_filter_changes_result` | integration | functional | black-box equivalence | REQ-CUBE-08 | Cube insights year filter changes result |
| TC060 | cube_insights | `test_cube_insights_kpis_under_five_seconds` | integration | non-functional/performance | measurement | REQ-CUBE-09 | Cube insights kpis under five seconds |
| TC061 | dashboard_page | `test_dashboard_products_tab_returns_data` | unit_level | functional | black-box nominal | REQ-DASH-05 | Dashboard products tab returns data |
| TC062 | dashboard_page | `test_dashboard_customers_tab_returns_data` | unit_level | functional | black-box nominal | REQ-DASH-06 | Dashboard customers tab returns data |
| TC063 | dashboard_page | `test_dashboard_shipping_tab_returns_data` | unit_level | functional | black-box nominal | REQ-DASH-07 | Dashboard shipping tab returns data |
| TC064 | dashboard_page | `test_dashboard_sales_team_tab_returns_data` | unit_level | functional | black-box nominal | REQ-DASH-08 | Dashboard sales team tab returns data |
| TC065 | dashboard_page | `test_overview_territory_filter_applied` | integration | functional | black-box equivalence | REQ-DASH-09 | Verify that applying a territory filter produces different results than no filter. |
| TC066 | dashboard_page | `test_details_page_boundary_values` | unit_level | functional | black-box boundary | REQ-DASH-10 | Details page boundary values |
| TC067 | dashboard_page | `test_dashboard_kpi_cards_render_in_react` | system | functional | black-box end-to-end | REQ-REACT-01 | Verify React KpiCards component renders in the browser after admin login. |
| TC068 | navbar_page | `test_theme_toggle_changes_body_class` | system | functional | black-box state transition | REQ-REACT-02 | React ThemeContext applies a class/attribute on <html> or <body> when theme is toggled. |
| TC069 | navbar_page | `test_admin_nav_links_visible_after_login` | system | functional | black-box nominal | REQ-REACT-03 | After admin login, navbar must show Admin, Dashboard, and Reseller Insights links. |
| TC070 | navbar_page | `test_regular_user_does_not_see_admin_nav` | system | functional/security | black-box access control | REQ-REACT-04 | A regular (non-admin) user must not see Admin, Dashboard, or Reseller Insights nav links. |
| TC071 | source_audit | `test_react_app_entry_point_exists` | static | static | white-box code inspection | REQ-REACT-05 | Confirm the React entry point (App.tsx) is present — verifies migration from Angular. |
| TC072 | source_audit | `test_cart_context_caps_quantity_to_stock` | static | static | white-box code inspection | REQ-REACT-06 | CartContext.tsx must cap setQty and add() to product.stockQty via Math.min. |
| TC073 | products_page | `test_categories_list_is_public_and_non_empty` | unit_level | functional | black-box nominal | REQ-CAT-07 | Categories list is public and non empty |
| TC074 | products_page | `test_subcategories_list_is_public_and_non_empty` | unit_level | functional | black-box nominal | REQ-CAT-08 | Subcategories list is public and non empty |
| TC075 | products_page | `test_product_dto_shape_matches_react_model` | unit_level | functional | white-box structural | REQ-CAT-09 | Verify all fields the React Product type expects are present. |
| TC076 | orders_page | `test_order_dto_shape_is_complete` | integration | functional | white-box structural | REQ-ORD-12 | Each order in /mine must carry all fields the React UI depends on. |
| TC077 | orders_page | `test_order_with_zero_quantity_rejected` | unit_level | functional | black-box boundary | REQ-ORD-13 | Order with zero quantity rejected |
| TC078 | orders_page | `test_orders_page_shows_order_cards` | system | functional | black-box end-to-end | REQ-ORD-14 | Admin creates an order then views it — React order-card elements must appear. |
| TC079 | cart_page | `test_cart_clear_empties_cart` | system | functional | black-box state transition | REQ-CART-01 | Add a product to cart then clear it — cart must become empty. |
