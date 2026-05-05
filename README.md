# BildyApp API

Backend REST con Node.js, Express y MongoDB para gestionar usuarios, empresas, clientes, proyectos y albaranes.

## Instalación

```bash
npm install
```

Crea un `.env` a partir de `.env.example`.

Variables principales:

- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SLACK_WEBHOOK_URL`
- `MAIL_ENABLED`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

## Desarrollo

```bash
npm run dev
```

La API escucha por defecto en `http://localhost:3000`.

## Docker

```bash
docker compose up --build
```

El `docker-compose.yml` levanta la API y MongoDB.

## Tests

```bash
npm test
npm run test:coverage
```

Los tests usan Jest, Supertest y `mongodb-memory-server`.
El envio de email usa Nodemailer; en entorno de test se usa transporte en memoria para no depender de SMTP real.

## Documentación

Swagger UI está disponible en:

```text
http://localhost:3000/api-docs
```

## Health Check

```http
GET /health
```

Devuelve el estado del servidor, MongoDB, uptime y timestamp.

## Endpoints principales

- `POST /api/user/register`
- `PUT /api/user/validation`
- `POST /api/user/login`
- `PATCH /api/user/company`
- `PATCH /api/user/logo`
- `POST /api/client`
- `GET /api/client`
- `GET /api/client/archived`
- `PATCH /api/client/:id/restore`
- `POST /api/project`
- `GET /api/project`
- `GET /api/project/archived`
- `PATCH /api/project/:id/restore`
- `POST /api/deliverynote`
- `GET /api/deliverynote`
- `GET /api/deliverynote/pdf/:id`
- `PATCH /api/deliverynote/:id/sign`

## Tiempo real

Socket.IO requiere JWT en `handshake.auth.token` o en `Authorization: Bearer <token>`.
Cada usuario se une a la room de su compañía y se emiten:

- `client:new`
- `project:new`
- `deliverynote:new`
- `deliverynote:signed`

Los tests verifican autenticación WebSocket, aislamiento por compañía y emisión de eventos.
