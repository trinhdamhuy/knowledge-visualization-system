# Backend - Knowledge Visualization API

Hướng dẫn chạy backend API với Docker.

## Yêu cầu

- Docker Engine 20.10 trở lên
- Docker Compose 2.0 trở lên
- File `.env` đã được cấu hình sẵn

## Chạy ứng dụng

### Khởi động services

```bash
cd backend
docker-compose up --build
```

### Chạy ở chế độ background

```bash
docker-compose up -d --build
```

## Quản lý services

### Xem logs

```bash
# Xem logs của tất cả services
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f chatbot-api
docker-compose logs -f pgvector
```

### Kiểm tra trạng thái

```bash
docker-compose ps
```

### Dừng services

```bash
# Dừng services (giữ lại containers và volumes)
docker-compose stop

# Dừng và xóa containers (giữ lại volumes)
docker-compose down

# Dừng và xóa containers cùng với volumes (xóa dữ liệu database)
docker-compose down -v
```

### Khởi động lại

```bash
docker-compose restart
```

## Kiểm tra ứng dụng

Sau khi khởi động, API sẽ chạy tại:

- **API Base URL**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/`
- **API Documentation**: `http://localhost:8000/docs` (FastAPI Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc` (ReDoc)

### Test API

```bash
curl http://localhost:8000/
```

## Troubleshooting

### Xóa và build lại từ đầu

```bash
docker-compose down -v
docker-compose up --build
```

### Build lại không dùng cache

```bash
docker-compose build --no-cache
docker-compose up
```
