# AW_Sales_DW_ETL

SQL Server Integration Services (SSIS) project used to load the AdventureWorks sales warehouse structures consumed by the dashboard API.

## Contents

- `AW_Sales_DW_ETL.slnx` - solution file
- `AW_Sales_DW_ETL.dtproj` - SSIS project definition
- `Project.params` - project parameters
- `01_Load_Dimension.dtsx` - dimension load package
- `02_Load_FactSales.dtsx` - fact table load package
- `.gitignore` - ETL-specific ignore rules

## Purpose

This module exists to populate and refresh the warehouse data used by the backend analytics endpoints.

The included diagrams in `../docs/diagrams/` show:
- the source-side model
- the target star schema

## Required tools

- Visual Studio 2022
- SQL Server Data Tools (SSDT)
- SSIS extension / Integration Services support
- SQL Server instance with the target warehouse database available

## How to open

Open:
- `AW_Sales_DW_ETL.slnx`

or directly the project:
- `AW_Sales_DW_ETL.dtproj`

## Recommended execution order

1. `01_Load_Dimension.dtsx`
2. `02_Load_FactSales.dtsx`

## Notes

- The uploaded snapshot already includes generated folders such as `.vs/`, `bin/`, and `obj/`.
- Those are normally local artifacts and should not be committed in a clean Git workflow.


## Authors

- **Youssef Ben Abdallah**
- **Mariem Ben Slim**
