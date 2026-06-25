# UML Documentation

Internship-report-quality UML documentation for the AdventureWorks Sales BI Platform. All diagrams are based on the actual codebase — entities, services, controllers, MDX queries, ETL packages, and SSAS cube definitions.

## Rendering

| Format | Tool |
|--------|------|
| `.puml` (PlantUML) | [plantuml.com](https://www.plantuml.com/plantuml/uml/), VS Code PlantUML extension (`Alt+D`), or `java -jar plantuml.jar *.puml` |
| `.mmd` (Mermaid) | [mermaid.live](https://mermaid.live/), GitHub renders natively in `.md` fenced blocks |

## Folder Structure (65 diagrams)

```text
uml/
├── class-diagrams/                    # 7 diagrams
│   ├── CD_Domain_Entities.puml        — OLTP entities (AppUser, Category, Product, Order...)
│   ├── CD_Analytics_Entities.puml     — DW star schema class view (SalesFact + 6 dimensions)
│   ├── CD_Repository_Pattern.puml     — Repository interfaces and implementations
│   ├── CD_Service_Layer.puml          — Service interfaces (JWT, Dashboard, OLAP)
│   ├── CD_Controllers.puml            — All 7 API controllers with endpoints
│   ├── CD_Data_Access_Layer.puml      — OltpDbContext + AnalyticsDbContext
│   └── CD_Frontend_Models.puml        — TypeScript interfaces + service classes
│
├── sequence-diagrams/                 # 10 diagrams
│   ├── SD_User_Registration.puml      — Register flow with Identity + JWT
│   ├── SD_User_Login.puml             — Login with failure paths
│   ├── SD_Product_Browse.puml         — Product listing with image serving
│   ├── SD_Add_To_Cart.puml            — Client-side cart (React Context)
│   ├── SD_Create_Order.puml           — Checkout with stock validation
│   ├── SD_View_Orders.puml            — My Orders with JWT claim extraction
│   ├── SD_Admin_Dashboard_Load.puml   — DW analytics filter + chart loading
│   ├── SD_Cube_Insights_Drill_Down.puml — SSAS MDX drill-down/roll-up flow
│   ├── SD_Admin_Product_CRUD.puml     — Full product CRUD lifecycle
│   └── SD_JWT_Authentication_Flow.puml — JWT creation, validation, expiry
│
├── activity-diagrams/                 # 5 diagrams
│   ├── AD_User_Registration_Workflow.puml — Registration with validation paths
│   ├── AD_Order_Checkout_Workflow.puml    — Cart to order with error handling
│   ├── AD_Dashboard_Analytics_Workflow.puml — 5-tab dashboard with lazy loading
│   ├── AD_Cube_DrillDown_Workflow.puml    — All drill-down patterns across 6 tabs
│   └── AD_Image_Upload_Workflow.puml      — Product image upload pipeline
│
├── state-diagrams/                    # 4 diagrams
│   ├── ST_Order_Lifecycle.puml        — Order status transitions (Pending→Shipped)
│   ├── ST_Authentication_State.puml   — Auth states with User/Admin substates
│   ├── ST_Cart_State.puml             — Shopping cart state machine
│   └── ST_SSAS_Cube_Processing.puml   — Cube processing lifecycle
│
├── component-diagrams/                # 3 diagrams
│   ├── CMP_Backend_Architecture.puml  — Layered .NET architecture with DI
│   ├── CMP_Frontend_Architecture.puml — React pages, context, services, routing
│   └── CMP_System_Integration.puml    — Full system integration with protocols
│
├── package-diagrams/                  # 3 diagrams
│   ├── PKG_Backend_Structure.puml     — Ecom.Api namespace tree
│   ├── PKG_Frontend_Structure.puml    — React src/ package structure
│   └── PKG_Repository_Structure.puml  — Monorepo module layout
│
├── deployment-diagrams/               # 2 diagrams
│   ├── DEP_Development_Environment.puml — Dev machine with all services + ports
│   └── DEP_Production_Architecture.puml — Production with zones + scaling
│
├── database/                          # 2 diagrams
│   ├── ERD_OLTP_Database.puml         — OLTP tables with column mappings
│   └── ERD_DW_Star_Schema.puml        — DW fact + dimensions with SQL types
│
├── architecture/                      # 3 diagrams
│   ├── C4_Context.puml                — Level 1: system + actors + externals
│   ├── C4_Container.puml              — Level 2: all containers + protocols
│   └── C4_Component.puml              — Level 3: API internal components
│
└── business-intelligence/             # 14 diagrams + 12 charts
    ├── BI_Global_Architecture.puml    — End-to-end BI pipeline
    ├── ETL_Process_Flow.puml          — Extract → Transform → Load
    ├── AD_ETL_Execution_Workflow.puml — SSIS package execution activity
    ├── DW_Star_Schema.puml            — Star schema with measures
    ├── DW_Fact_Dimension_Model.puml   — Shared dimensions + hierarchies
    ├── SSAS_Cube_Architecture.puml    — Cube internals + role-playing dims
    ├── SSAS_Cube_Model.puml           — Cube tree: measures + dimensions
    ├── Data_Lineage.puml              — Source → ETL → DW → Cube → Dashboard
    ├── Reporting_Architecture.puml    — Dual reporting path (EF + ADOMD)
    ├── Dashboard_Data_Flow.puml       — Visualization → endpoint → query → table
    ├── KPI_Hierarchy.puml             — Business objectives → KPIs → measures
    ├── Incremental_Load_Process.puml  — Delta load with SCD Type 1
    ├── BI_Deployment_Architecture.puml — SQL Server + SSAS + API + React
    ├── Cube_Performance_Architecture.puml — MOLAP, aggregations, query pipeline
    └── charts/                        # 12 Mermaid charts
        ├── ETL_Execution_Duration.mmd
        ├── Records_Loaded_Per_Day.mmd
        ├── Data_Volume_Growth.mmd
        ├── Fact_Table_Growth.mmd
        ├── Cube_Processing_Time.mmd
        ├── Measure_Usage_Frequency.mmd
        ├── Top_KPIs.mmd
        ├── Dashboard_Usage.mmd
        ├── Data_Quality_Metrics.mmd
        ├── Error_Rate_Trend.mmd
        ├── Dimension_Growth.mmd
        └── Report_Refresh_Duration.mmd
```
