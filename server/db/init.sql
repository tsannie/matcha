CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  firstname VARCHAR(50) NOT NULL,
  lastname VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,

  -- Auth & Security
  verified BOOLEAN DEFAULT FALSE,
  token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,

  -- Profile Data
  gender VARCHAR(10),
  sexual_preference VARCHAR(20),
  birthdate DATE,
  biography TEXT,
  fame_rating INT DEFAULT 0,
  latitude FLOAT,
  longitude FLOAT,
  profile_complete BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLE TAGS
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(32) UNIQUE NOT NULL
);

-- 3. TABLE USER_TAGS (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_tags (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, tag_id)
);

-- 4. TABLE USER_IMAGES (One-to-Many)
CREATE TABLE IF NOT EXISTS user_images (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  file_path VARCHAR(255) NOT NULL,
  is_profile_picture BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
