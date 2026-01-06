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

VITE_API_URL=http://localhost:5000

2#cS`xm00rxC
P@$$w0rd123?

# To reset the database, run the following command:

# Seed the database with initial data:

docker exec -it matcha_server pnpm seed

https://www.drawdb.app/editor?shareId=20ccfdcee9dffba1be9b435bf890e74b

curl -X POST http://localhost:5000/api/profile/images \
 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0aGVvIiwiaWF0IjoxNzY0MzQ1MTcwLCJleHAiOjE3NjQzNDg3NzB9.q1zvVeAPL2vzV9X4MMF7PeNSY8RJeTjbnRnJYynOs3I" \
 -F "image=@test12.jpg"

curl -X DELETE http://localhost:5000/api/profile/images/1 \
 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0aGVvIiwiaWF0IjoxNzY0MzQ1MTcwLCJleHAiOjE3NjQzNDg3NzB9.q1zvVeAPL2vzV9X4MMF7PeNSY8RJeTjbnRnJYynOs3I"

curl -X GET http://localhost:5000/api/profile \
 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0aGVvIiwiaWF0IjoxNzY0MzQ1MTcwLCJleHAiOjE3NjQzNDg3NzB9.q1zvVeAPL2vzV9X4MMF7PeNSY8RJeTjbnRnJYynOs3I"

# TODO LIST

- fix location pb in complete profile
