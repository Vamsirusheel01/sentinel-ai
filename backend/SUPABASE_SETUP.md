# Setup instructions for Supabase integration

## Option 1: Use Supabase (PostgreSQL-based, like Firebase)

### Steps:

1. **Create Free Supabase Account**
   - Go to https://supabase.com
   - Sign up (free tier includes 500 MB database)
   - Create a new project

2. **Get Your Credentials**
   - From Supabase dashboard → Settings → API
   - Copy:
     - Project URL (SUPABASE_URL)
     - anon/public key (SUPABASE_KEY)

3. **Create the Schema**
   - In Supabase → SQL Editor → New Query
   - Copy contents of `supabase_schema.sql` and run

4. **Install Python Client**
   ```bash
   pip install supabase
   ```

5. **Set Environment Variables**
   ```bash
   export SUPABASE_URL="your_project_url"
   export SUPABASE_KEY="your_anon_key"
   ```

6. **Update Backend (app.py)**
   ```python
   from supabase_client import get_db
   
   db = get_db()
   
   # Now use: db.store_event(), db.store_device(), etc.
   ```

### Benefits:
✅ Professional UI dashboard
✅ Real-time capabilities
✅ Auto backups
✅ Scalable (pay as you grow)
✅ SQL queries work as-is
✅ Free tier is generous

---

## Option 2: Use Firebase/Firestore

### Steps:

1. Create Firebase project: https://console.firebase.google.com
2. Enable Firestore database
3. Install: `pip install firebase-admin`
4. Download service account key
5. Collections: devices, events, contexts, payloads

⚠️ Less ideal for relational data (your use case has many foreign keys)

---

## Option 3: Keep SQLite But Fix Schema

If you want to stay local:
- Update to proper normalization
- Remove JSON blobs from main rows
- Create separate tables per event type

**I recommend Option 1 (Supabase) for production.**

Would you like me to:
1. Create migration code to move your SQLite data → Supabase?
2. Update app.py to use Supabase instead of SQLite?
3. Create REST API endpoints for the dashboard?
