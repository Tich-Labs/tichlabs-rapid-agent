# Required Secrets

Seed scripts require `FIREBASE_SERVICE_ACCOUNT_JSON` set in the environment.

Run from the `mcp-server/` directory (where `firebase-admin` is installed):

```bash
cd mcp-server
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
  npx tsx ../scripts/seed-nairobi-services.ts
```

This writes ~150+ Nairobi service providers to the `referral_services` Firestore collection.
