#!/usr/bin/env bash
# สร้าง WalletlyDb + schema + ข้อมูลระบบ + login ของแอป (รันซ้ำได้ทุกครั้งที่ docker compose up)
# รันใน container db-init (image เดียวกับ SQL Server จึงมี sqlcmd อยู่แล้ว)
set -euo pipefail

export SQLCMDPASSWORD="$MSSQL_SA_PASSWORD"
SQLCMD=(/opt/mssql-tools18/bin/sqlcmd -S db -U sa -C -b -f 65001)

echo "== database WalletlyDb"
"${SQLCMD[@]}" -Q "IF DB_ID(N'WalletlyDb') IS NULL CREATE DATABASE WalletlyDb;"

# schema.sql รันซ้ำได้ (เช็คก่อนสร้างทุกตาราง/คอลัมน์/index): รันทุกครั้งให้ DB เดิมได้คอลัมน์/ตารางใหม่ด้วย
echo "== schema.sql"
"${SQLCMD[@]}" -d WalletlyDb -i /database/schema.sql

echo "== seed.production.sql"
"${SQLCMD[@]}" -d WalletlyDb -i /database/seed.production.sql

echo "== login walletly_app: อ่าน/เขียนข้อมูลได้ แต่แก้ schema ไม่ได้"
"${SQLCMD[@]}" -v AppPassword="$DB_APP_PASSWORD" -Q "
IF SUSER_ID(N'walletly_app') IS NULL
    CREATE LOGIN walletly_app WITH PASSWORD = N'\$(AppPassword)', DEFAULT_DATABASE = WalletlyDb;
ELSE
    ALTER LOGIN walletly_app WITH PASSWORD = N'\$(AppPassword)';
"
"${SQLCMD[@]}" -d WalletlyDb -Q "
IF USER_ID(N'walletly_app') IS NULL
    CREATE USER walletly_app FOR LOGIN walletly_app;
ALTER ROLE db_datareader ADD MEMBER walletly_app;
ALTER ROLE db_datawriter ADD MEMBER walletly_app;
"

echo "เสร็จ"
