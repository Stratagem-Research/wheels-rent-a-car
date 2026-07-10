> **Status: DRAFT — ready to send by Marc.**

# Email to Adam — vehicle sync 401 with staging token

**To:** Adam (069 Design / Wizard)  
**Cc:** Fatema, Elie  
**Subject:** Re: Vehicle sync — token received, `/api/v1/vehicles/sync` returns 401

---

Hi Adam,

Thank you for sending the staging credentials and `WIZARD_PUBLIC_PARENT_ID=2`.

We have implemented vehicle sync exactly against your spec:

- `GET /api/v1/vehicles/sync` on the adoring-hugle demo
- `Authorization: Bearer <token>` and `Accept: application/json`
- Incremental sync via `?updated_since=YYYY-MM-DD HH:mm:ss`
- Parsing the confirmed response schema and syncing into our `wizard_vehicles` table

With the token you provided, we ran live smoke tests on the demo environment. Results:

**Working**

- Public API: `GET /availability` and `POST /booking-request` (test booking created successfully)
- Internal API: `POST /api/v1/bookings/{reference}/sync-status` returns `200` with the same bearer token

**Not working**

- `GET /api/v1/vehicles/sync` returns `401 Unauthorized` with the same bearer token

Example response:

```json
{ "success": false, "message": "Unauthorized." }
```

Since `sync-status` accepts the token but `vehicles/sync` does not, this does not match your spec — where the same `WIZARD_API_TOKEN` should authenticate `GET /api/v1/vehicles/sync` on the adoring-hugle demo.

Could you please check on your side:

1. Is `GET /api/v1/vehicles/sync` deployed and enabled on adoring-hugle with the staging token?
2. If not yet live, when should we expect it to accept the same bearer token as `sync-status`?
3. Does the request need any additional parameter beyond what you specified (for example `parent_id=2`)?

Once that endpoint accepts the token, we will run `pnpm wizard:sync-vehicles`, enable real booking on staging, and share the full smoke test results.

Best,  
Marc
