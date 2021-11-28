FROM node:16.13.0 AS build-stage
ARG CLIENT_DIR
ARG CONTRACT_ADDRESS

################################## Frontend ##################################
WORKDIR /frontend

# Install dev dependencies
COPY frontend/package*.json ./
RUN npm install --production=false

# Bundle app source
COPY frontend/server.ts ./app-src/server.ts

# Build
COPY frontend/babel.config.json ./babel.config.json
RUN ./node_modules/.bin/babel --copy-files --extensions ".ts" ./app-src --out-dir ./app-lib
################################## Frontend ##################################

##################################  Client  ##################################
WORKDIR /client

# Install dev dependencies
COPY ${CLIENT_DIR}/package*.json ./
RUN npm install --production=false

# Bundle app source
COPY ${CLIENT_DIR}/src ./src
COPY ${CLIENT_DIR}/public ./public

# Build
COPY ${CLIENT_DIR}/tsconfig.json ./tsconfig.json
# avoids issues with Content Security Policy by not bundling the JS with index.html page
RUN INLINE_RUNTIME_CHUNK=false REACT_APP_VERIFICATION_CONTRACT_ADDRESS=${CONTRACT_ADDRESS} ./node_modules/.bin/react-scripts build
##################################  Client  ##################################

FROM node:16.13.0

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install --production
# If you are building your code for production
# RUN npm ci --only=production

# Add compiled frontend source
COPY --from=build-stage /frontend/app-lib ./frontend

# Add client build
COPY --from=build-stage /client/build ./client
ENV CLIENT_BUILD_PATH /usr/src/app/client

CMD [ "node", "frontend/server.js" ]
