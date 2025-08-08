# 🚀 Secure Web with Docker Secret

![Docker](https://img.shields.io/badge/Docker-Compose%20%7C%20Swarm-blue?logo=docker)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)
![Redis](https://img.shields.io/badge/Database-Redis-red?logo=redis)
![Nginx](https://img.shields.io/badge/Frontend-Nginx-orange?logo=nginx)

Aplikasi web sederhana berbasis **microservices** yang terdiri dari:
- **Frontend**: HTML, CSS, JavaScript (To-Do List App)
- **Backend**: Node.js + Express
- **Redis**: Penyimpanan data sementara (cache) dengan password aman via **Docker Secret**

Dapat dijalankan dengan:
- **Docker Compose** → Pengembangan lokal
- **Docker Swarm** → Produksi (*scalable & high availability*)

---

## 📂 Struktur Proyek

```
WEEK1-SECURE_WEB_WITH_DOCKER_SECRET/
├── backend/              # Backend (Node.js + Express)
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/             # Frontend (HTML, CSS, JS, Nginx)
│   ├── default.conf
│   ├── Dockerfile
│   ├── index.html
│   ├── script.js
│   └── style.css
├── redis/                # Redis + custom entrypoint
│   ├── Dockerfile
│   └── redis-entrypoint.sh
├── secrets/              # Docker Secret (password Redis)
│   └── redis_password.txt
├── .gitignore
├── docker-compose.yaml   # Konfigurasi Docker Compose
└── docker-swarm.yaml     # Konfigurasi Docker Swarm
```

---

## 🖥 Arsitektur Sistem

```
          [ Browser User ]
                 |
            ┌────▼─────┐
            │ Frontend │  (Nginx, HTML, CSS, JS)
            └────┬─────┘
                 │  /api/*
                 ▼
          ┌─────────────┐
          │  Backend    │ (Node.js + Express)
          └────┬────────┘
               │ Redis Client
               ▼
         ┌──────────────┐
         │   Redis DB    │ (Password dari Docker Secret)
         └──────────────┘
```

---

## 🌐 Deskripsi Singkat

### **Frontend**
- Dibangun dengan HTML, CSS, dan JavaScript tanpa framework tambahan.
- Menggunakan **Nginx** untuk menyajikan file statis.
- `default.conf` mengatur agar permintaan `/api/` diteruskan ke backend.

### **Backend**
- Dibangun menggunakan **Node.js** dan **Express**.
- Menyediakan API untuk mengelola daftar To-Do.
- Terhubung ke Redis menggunakan password yang disimpan di **Docker Secret**.

### **Redis**
- Menggunakan image **redis:alpine** yang ringan.
- Password Redis diatur melalui **Docker Secret** dengan bantuan `redis-entrypoint.sh`.

---

```bash
git clone https://github.com/rizkidsaputra/Week1-Secure_Web_with_Docker_Secret/edit/main/README.md
cd Week1-Secure_Web_with_Docker_Secret
```

---

## 🚀 Menjalankan dengan Docker Compose

1. **Buat file password untuk Redis**  
   ```bash
   echo "passwordAnda" > ./secrets/redis_password.txt
   ```

2. **Jalankan Docker Compose**  
   ```bash
   docker compose -f docker-compose.yaml up --build
   ```

3. Akses aplikasi di: [http://localhost:8080](http://localhost:8080)

---

## 📦 Menjalankan dengan Docker Swarm

> **Catatan:** Pastikan image sudah dibuild atau tersedia di registry, karena Docker Swarm tidak mendukung instruksi `build` di file YAML.

1. **Build image terlebih dahulu**  
   ```bash
   docker build -t rizkidsaputra/frontend:week1 ./frontend
   docker build -t rizkidsaputra/backend:week1 ./backend
   docker build -t rizkidsaputra/redis:week1 ./redis
   ```

2. **Inisialisasi Swarm**  
   ```bash
   docker swarm init
   ```

3. **Buat file untuk menyimpan password Redis**  
   ```bash
   echo "passwordAnda" > ./secrets/redis_password.txt
   ```

4. **Buat Docker Secret dari file password tersebut**  
   ```bash
   docker secret create redis_password ./secrets/redis_password.txt
   ```  
   Setelah secret berhasil dibuat, Anda **boleh menghapus** file `redis_password.txt` karena isinya sudah tersimpan aman di Docker Secret.

5. **Deploy stack**  
   ```bash
   docker stack deploy -c docker-swarm.yaml week1
   ```

6. Akses aplikasi di: [http://localhost:8080](http://localhost:8080)

---

## 🔒 Keamanan dengan Docker Secret

- Password Redis tidak disimpan di environment variable atau image.
- Disimpan dalam `/run/secrets/redis_password` di container.

---

## ⚙️ Perintah Penting

- Melihat service di Swarm:  
  ```bash
  docker service ls
  ```
- Melihat log service:  
  ```bash
  docker service logs -f week1_backend
  ```
- Menghapus stack:  
  ```bash
  docker stack rm week1
  ```

---

## 📝 Catatan
- Saat dijalankan di Compose dan Swarm, volume Redis berbeda sehingga cache tidak berbagi data.
- Jika container Redis dihapus tetapi volumenya tidak dihapus, data cache tetap ada.
