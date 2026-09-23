# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Phase 5B — Super Admin Organization Management

Adds platform-level organization management on top of the Phase 5A foundation.

### New route
- `/super-admin/organizations`

### Database migration
- `database/051_phase5b_super_admin_organization_management.sql`

The migration adds controlled Super Admin RPCs for organization create/update, member lookup, member assignment, member status changes, and admin username search. Customers cannot be assigned as client back-office members through the management RPC.

### Verification note
The source changes were statically inspected. Full `npm run build` remains dependent on installing the project's npm dependencies in an environment with package access.


## Phase 5F

Reschedule RPC tenant audit is implemented in `database/055_phase5f_reschedule_tenant_audit.sql`.

Phase 5J runtime migration/security test matrix: `README_PHASE5J.md`
