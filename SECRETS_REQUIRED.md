# Required Secrets

Seed scripts require `FIREBASE_SERVICE_ACCOUNT_JSON` set in the environment.

Run from the project root (where `firebase-admin` is installed in `mcp-server/`):

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
  npx tsx mcp-server/scripts/seed-nairobi-services.ts
```

Or using the npm script from `mcp-server/`:

```bash
cd mcp-server
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
  npm run seed:nairobi
```

This writes ~150+ Nairobi service providers to the `referral_services` Firestore collection in the `sgbv-tracker` database.
