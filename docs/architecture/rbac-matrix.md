# RBAC Matrix (Scope-Based)

This document describes the server-side RBAC implementation aligned to UDSM role hierarchy.

## Scope Types

- `institution`
- `college`
- `department`
- `course`

Scope is carried by role bindings (`role_bindings.scope_type`, `role_bindings.scope_id`), and optionally constrained per request via:

- `x-scope-type`
- `x-scope-id`

## Role Definitions

Roles are defined in `backend/app/core/rbac.py` and seeded at startup:

- `super_admin`
- `ict_admin`
- `exam_officer`
- `college_admin`
- `college_exam_officer`
- `hod`
- `dept_admin`
- `lecturer`
- `ta`
- `student`
- `external_examiner`
- `guest`

## Permission Definitions

Permissions are defined in `backend/app/core/rbac.py` and seeded into `permissions`.

Role-to-permission grants are seeded into `role_permissions`.

## Runtime Enforcement

Permission checks are enforced via `require_permission(...)` in:

- `backend/app/api/deps.py`

The checker validates:

- authenticated user in current institution
- active role bindings
- permission grant through `role_permissions`
- scope compatibility (`institution` can satisfy narrower scopes)

## Introspection API

RBAC endpoints:

- `GET /api/v1/rbac/me`
- `GET /api/v1/rbac/matrix`
- `GET /api/v1/rbac/users/{user_id}`

These allow inspection of current role bindings and effective permissions.
