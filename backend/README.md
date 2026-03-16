# Backend module

This folder groups the .NET backend solution for the project.

## Contents

- `Ecom.sln` - solution file for Visual Studio / .NET tooling.
- `Ecom.Api/` - ASP.NET Core API project.
- `.gitignore` - backend-specific ignore rules.

## Purpose

The backend is responsible for:
- identity and JWT auth
- catalog CRUD
- order creation and order management
- admin analytics endpoints backed by the data warehouse

## Start here

For full API instructions, open:
- [`Ecom.Api/README.md`](Ecom.Api/README.md)
- [`../docs/api/API_REFERENCE.md`](../docs/api/API_REFERENCE.md)

## Run commands

```bash
cd Ecom.Api
dotnet restore
dotnet ef database update
dotnet run
```
