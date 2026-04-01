# Matcha

A dating web application built as part of the 42 school curriculum.

**Stack:** React 19 · Express 5 · PostgreSQL · Docker

---

## Setup

Copy the `.env` file at the project root with the following variables:

```
DB_USER=matcha
DB_PASSWORD=REDACTED_DB_PASSWORD
DB_NAME=matcha

JWT_SECRET=REDACTED_JWT_SECRET

EMAIL_HOST=ssl0.ovh.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=matcha@sannie.fr
EMAIL_PASS=REDACTED_SMTP_PASSWORD

CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000
```

## Start

```bash
docker compose up --build
```

| Service | URL                   |
| ------- | --------------------- |
| Client  | http://localhost:5173 |
| API     | http://localhost:5000 |
| Adminer | http://localhost:8080 |

## Reset the database

```bash
docker run --rm -v "$PWD":/app -w /app alpine rm -rf data
```

---

## Features

- Registration with email verification and password reset
- Profile with photos (up to 5), interest tags, biography, and GPS location
- Smart profile suggestions based on distance, shared tags, age, and fame
- Advanced search with filters (age, fame, distance, tags)
- Like / unlike · mutual like = match
- Real-time chat between matched users
- Real-time notifications (like, view, message, match, unlike)
- Block and report fake accounts

---

## Smart Match Algorithm

Profiles are ranked with a weighted composite score (0–100):

```
score = distance×0.40 + common_tags×0.25 + age_proximity×0.20 + fame×0.15
```

- **Distance (40%)** - exponential decay: `100 × exp(-km / 50)`
- **Common tags (25%)** - shared interests, normalized over 5 tags
- **Age proximity (20%)** - exponential decay: `100 × exp(-diff / 10)`
- **Fame (15%)** - normalized fame rating (0–100)

---

## Fame Rating

Fame reflects a user's popularity and profile quality. Recalculated from scratch on every relevant event - it can decrease (e.g. when someone unlikes a profile).

```
fame = like_ratio×80 + photos×2 + profile_complete×10 - blocks×3 - reports×5
```

`like_ratio = likes / views` (capped at 1.0 - quality over quantity). Max: **100 pts**.

- **Like ratio (0–80 pts)** - proportion of viewers who liked the profile: `like_ratio × 80`
- **Photos (2 pts each)** - up to 5 photos → up to 10 pts
- **Profile complete (+10 pts)** - one-time flat bonus when all mandatory fields are filled
- **Blocked by others (−3 pts each)** - restored if the user is unblocked
- **Reported by others (−5 pts each)** - permanent

---

## Security

All inputs are validated server-side before reaching the database.

- **SQL injection** - all queries use parameterized statements (`$1`, `$2`, …), no string concatenation
- **XSS** - React JSX escapes all dynamic data; `dangerouslySetInnerHTML` and `innerHTML` are never used
- **File uploads** - MIME type + extension checked (jpeg/jpg/png/webp only), 5 MB limit, random server-generated filenames
- **Passwords** - bcrypt (10 rounds) + zxcvbn strength check
- **Authentication** - JWT verified on every protected route, short-lived tokens (1 h / 30 d)
- **Input validation** - type checks, whitelists, and length limits on all API inputs
