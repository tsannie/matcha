DB_USER=matcha_user
DB_PASSWORD=REDACTED_DB_PASSWORD
DB_NAME=matcha_db
JWT_SECRET=REDACTED_JWT_SECRET

EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=REDACTED_SMTP_USER
EMAIL_PASS=REDACTED_SMTP_PASSWORD
CLIENT_URL=http://localhost:5173

2#cS`xm00rxC

# To reset the database, run the following command:

docker run --rm -v "$PWD":/app -w /app alpine rm -rf data
