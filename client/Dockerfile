FROM node:22-alpine

WORKDIR /app

# Copie des fichiers de dépendances NPM
COPY package.json package-lock.json ./

# Installation des dépendances
RUN npm install

# Copie du reste des fichiers
COPY . .

# Port par défaut de Vite
EXPOSE 5173

# Lancement du serveur de dev avec l'option host pour Docker
CMD ["npm", "run", "dev", "--", "--host"]
