# Walletly บน Docker (เครื่อง local)

รัน FE + BE + SQL Server ด้วย docker compose

| service | หน้าที่ |
|---|---|
| `web` | nginx เสิร์ฟ FE ที่ build แล้ว และส่ง `/api` ต่อให้ `api` |
| `api` | BE (.NET) build จาก `Dockerfile` ของ BE repo |
| `db` | SQL Server 2022 Developer (ข้อมูลอยู่ใน volume `walletly_db-data`) |
| `db-init` | สร้าง DB + `schema.sql` + `seed.production.sql` + login ของแอป แล้วจบ (รันซ้ำได้) |

## ต้องมี

- Docker Desktop
- BE repo อยู่ข้าง ๆ FE repo (`D:\BE_wallet_net`) หรือตั้ง `BE_DIR` ใน `docker/.env`
- RAM ว่างประมาณ 2GB สำหรับ SQL Server

## ตั้งค่าครั้งแรก

คัดลอก `docker/.env.example` เป็น `docker/.env` แล้วใส่ค่า (รายละเอียดอยู่ในไฟล์)

## คำสั่ง

รันจากโฟลเดอร์ root ของ FE repo

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

เปิด http://localhost:8080 แล้วสมัครสมาชิกได้เลย (ปิดการยืนยันอีเมลไว้ อีเมลที่ระบบจะส่งไปอยู่ใน log ของ `api`)

```bash
docker compose -f docker/docker-compose.yml logs -f api
```

```bash
docker compose -f docker/docker-compose.yml down
```

`down -v` จะลบ volume ของ DB ด้วย ข้อมูลทั้งหมดหายถาวร
