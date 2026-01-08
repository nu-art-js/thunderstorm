FROM node:22
WORKDIR /workspace

# Copy package files
COPY package.json ./
COPY dist/ ./dist/

# Install dependencies including functions-framework
RUN npm install --production && \
    npm install -g @google-cloud/functions-framework

# Expose the port that Cloud Run will use
EXPOSE 8080

# Use functions-framework to run the function
# FUNCTION_TARGET environment variable (set by deployment) specifies which exported function to invoke
# PORT is automatically set by Cloud Run (default 8080)
# The framework will load dist/index.js and route to the function specified in FUNCTION_TARGET
CMD ["functions-framework", "--source=dist/index.js"]

