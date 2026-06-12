FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    g++ \
    gcc \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# 1. Upgrade fundamental build tools
RUN pip install --no-cache-dir --upgrade pip wheel

# 2. Explicitly install setuptools so 'pkg_resources' is available to wheel compilers
RUN pip install --no-cache-dir setuptools

# 3. Install main project dependencies safely
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy your backend files into /app (this automatically places your key at /app/credentials/gee-key.json)
COPY . .

EXPOSE 5000
ENV PORT=5000

CMD ["python", "app.py"]