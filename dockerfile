# ==========================================
# Stage 1: Base (مرحله پایه - مشترک)
# ==========================================
FROM golang:alpine AS base
WORKDIR /app

RUN go env -w GOPROXY=http://nexus.ir:8081/repository/go/ && \
    go env -w GOSUMDB=off

# کپی کردن فایل‌های ماژول و دانلود وابستگی‌ها
COPY go.mod go.sum ./
RUN go mod download

# ==========================================
# Stage 2: Development (محیط توسعه با Air)
# ==========================================
FROM base AS dev
# نصب Air نسخه جدید
RUN go install github.com/air-verse/air@latest
# کپی کردن کل سورس کد
COPY . .
# اجرای Air به عنوان پردازش اصلی کانتینر
CMD ["air", "-c",".air.api.toml"]

# ==========================================
# Stage 3: Builder (مرحله کامپایل برای پروداکشن)
# ==========================================
FROM base AS builder
COPY . .
# کامپایل کد به صورت استاتیک و بدون نیاز به CGO
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# ==========================================
# Stage 4: Production (محیط عملیاتی نهایی)
# ==========================================
FROM alpine:latest AS prod
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]