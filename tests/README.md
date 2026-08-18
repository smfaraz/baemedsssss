# BaeMeds enquiry tests

Run from the `beameds.in` folder:

```powershell
.\tests\enquiries-smoke.ps1
```

The script prompts for the Supabase admin email and password, creates one record for each enquiry type, verifies all four records through the protected database query, and removes the temporary records.

To keep the records for inspection in `/admin`:

```powershell
.\tests\enquiries-smoke.ps1 -KeepRecords
```

The public anon key is safe for browser-side use; no service-role key or password is stored in this folder.
