# 🚀 API REST - Práctica Intermedia Web2

## 📌 Descripción

API REST desarrollada con **Node.js**, **Express** y **MongoDB (Mongoose)** siguiendo una arquitectura **MVC**.

Esta API implementa un sistema completo de gestión de usuarios y empresas con:

* 🔐 Autenticación con JWT (**access + refresh tokens**)
* 🧾 Validación de datos con **Zod**
* 🔑 Encriptación de contraseñas con **bcrypt**
* 🏢 Gestión de empresas y roles (**admin / guest**)
* 📤 Subida de archivos con **Multer**
* ⚙️ Middleware de seguridad
* 📡 Sistema de eventos con **EventEmitter**
* 🧠 Soft delete y control de sesiones

---

## 🏗️ Arquitectura

El proyecto sigue el patrón **MVC (Model - View - Controller)**:

```
src/
  controllers/
  models/
  routes/
  middleware/
  utils/
  validators/
  services/
```

---

## 🚀 Instalación

Clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd intermedia
```

Instalar dependencias:

```bash
npm install
```

---

## ▶️ Ejecución

Modo desarrollo:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

---

## ⚙️ Variables de entorno

Crear un archivo `.env` basado en `.env.example`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/intermedia

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

BCRYPT_SALT_ROUNDS=10
```

---

## 🔐 Autenticación

La API utiliza:

* **Access Token** (corta duración)
* **Refresh Token** (larga duración)

### Flujo:

1. Login → devuelve access + refresh
2. Refresh → genera nuevo access
3. Logout → invalida refresh token

---

## 📡 Endpoints principales

### 🔐 Auth

* `POST /api/user/register` → Registro de usuario
* `PUT /api/user/validation` → Validación por código
* `POST /api/user/login` → Login
* `POST /api/user/refresh` → Renovar access token
* `POST /api/user/logout` → Logout

---

### 👤 Usuario

* `GET /api/user` → Obtener usuario actual
* `PUT /api/user/register` → Completar perfil
* `PUT /api/user/password` → Cambiar contraseña
* `DELETE /api/user` → Eliminar usuario (soft/hard)

---

### 🏢 Empresa

* `PATCH /api/user/company` → Crear/unirse a empresa
* `PATCH /api/user/logo` → Subir logo (solo admin)
* `POST /api/user/invite` → Invitar usuario (solo admin)

---

## 🧪 Testing

Se incluye un archivo `.http` con todas las peticiones necesarias para probar la API.

Se recomienda usar:

* VS Code REST Client
* Postman
* Thunder Client

---

## 🔒 Seguridad

La API implementa:

* **Helmet** → Protección de cabeceras HTTP
* **Rate Limiting** → Prevención de abuso
* **Mongo Sanitize** → Protección contra inyección NoSQL
* **Validación con Zod**
* **JWT para autenticación**

---

## 👥 Roles y permisos

* `admin`

  * Puede crear empresas
  * Puede invitar usuarios
  * Puede subir logo

* `guest`

  * Puede unirse a empresa
  * Acceso limitado

---

## 📡 EventEmitter

Eventos implementados:

* `user.registered`
* `user.validated`
* `user.logged_in`
* `user:invited`
* `user:deleted`

---

## 🧠 Funcionalidades clave

* Autenticación completa con refresh tokens
* Control de sesiones
* Soft delete de usuarios
* Validación avanzada con Zod
* Middleware de errores centralizado
* Arquitectura escalable

---

## 🛠️ Tecnologías utilizadas

* Node.js
* Express
* MongoDB + Mongoose
* Zod
* JWT
* bcrypt
* Multer

---

## 📌 Estado del proyecto

✅ Práctica completada
✅ Cumple requisitos del enunciado
✅ Arquitectura limpia
✅ Lista para evaluación

---

## 👨‍💻 Autor

Pablo González Mediavilla

---
