# ML Prediction Server — Railway
FROM python:3.11-slim

WORKDIR /app

COPY ml/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ml/ .

EXPOSE 8004

CMD ["python", "server.py"]
