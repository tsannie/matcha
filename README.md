```
# Database
DB_USER=matcha
DB_PASSWORD=REDACTED_DB_PASSWORD
DB_NAME=matcha

# JWT
JWT_SECRET=REDACTED_JWT_SECRET

# Email - OVH
EMAIL_HOST=ssl0.ovh.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=matcha@sannie.fr
EMAIL_PASS=REDACTED_SMTP_PASSWORD

# URLs
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000
```

# To reset the database, run the following command:

docker run --rm -v "$PWD":/app -w /app alpine rm -rf data

---

# Smart Match Algorithm

Profiles are ranked with a weighted composite score (0–100):

```
score = distance×0.40 + common_tags×0.25 + age_proximity×0.20 + fame×0.15
```

### Distance (40%)
Exponential decay based on geographic distance: `100 × exp(-km / 50)`.
Profiles within a few km score near 100; score halves roughly every 35 km.
Falls back to 50 if the current user has no location set.

### Common interest tags (25%)
Number of shared tags with the current user, normalized over 5: `min(100, shared/5 × 100)`.
5 or more shared tags → 100 pts. 0 shared tags → 0 pts.

### Age proximity (20%)
Exponential decay on the age difference: `100 × exp(-diff / 10)`.
Same age → 100 pts; 10 years apart → ~37 pts; 20 years apart → ~14 pts.
Falls back to 50 if either profile has no birthdate.

### Fame rating (15%)
Fame score normalized from 0–1000 to 0–100.
