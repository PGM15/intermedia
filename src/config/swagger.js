import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BildyApp API",
      version: "1.0.0",
      description: "API REST para gestión de usuarios, clientes, proyectos y albaranes",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string", example: "Unauthorized" },
          },
        },

        AddressClient: {
          type: "object",
          properties: {
            street: { type: "string", example: "Calle Mayor" },
            number: { type: "string", example: "12" },
            postal: { type: "string", example: "28001" },
            city: { type: "string", example: "Madrid" },
            province: { type: "string", example: "Madrid" },
          },
        },

        AddressUserCompany: {
          type: "object",
          properties: {
            street: { type: "string", example: "Gran Via 20" },
            city: { type: "string", example: "Madrid" },
            postalCode: { type: "string", example: "28013" },
            country: { type: "string", example: "España" },
          },
        },

        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "69ca94c28d3911cab3b9b1f8" },
            email: { type: "string", example: "cjb6@test.com" },
            name: { type: "string", example: "Pablo" },
            lastName: { type: "string", example: "González Mediavilla" },
            nif: { type: "string", example: "12345678Z" },
            role: { type: "string", example: "admin" },
            company: { type: "string", example: "69dcbe1345e02cf24539d4e3" },
          },
        },

        Company: {
          type: "object",
          properties: {
            _id: { type: "string", example: "69dcbe1345e02cf24539d4e3" },
            name: { type: "string", example: "Mi Empresa SL" },
            cif: { type: "string", example: "B12345678" },
            isFreelance: { type: "boolean", example: false },
            logoUrl: { type: "string", example: "https://res.cloudinary.com/..." },
            address: {
              $ref: "#/components/schemas/AddressUserCompany",
            },
          },
        },

        Client: {
          type: "object",
          properties: {
            _id: { type: "string", example: "69dcbe1345e02cf24539d4e3" },
            user: { type: "string", example: "69ca94c28d3911cab3b9b1f8" },
            company: { type: "string", example: "69dcbe1345e02cf24539d4e3" },
            name: { type: "string", example: "Construcciones Garcia SL" },
            cif: { type: "string", example: "B12345678" },
            email: { type: "string", example: "cliente@garcia.com" },
            phone: { type: "string", example: "600123123" },
            address: { $ref: "#/components/schemas/AddressClient" },
            deleted: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        Project: {
          type: "object",
          properties: {
            _id: { type: "string", example: "69dcc6e327bd272daa751382" },
            user: { type: "string", example: "69ca94c28d3911cab3b9b1f8" },
            company: { type: "string", example: "69dcbe1345e02cf24539d4e3" },
            client: { type: "string", example: "69dcbe1345e02cf24539d4e3" },
            name: { type: "string", example: "Reforma Oficina Central" },
            projectCode: { type: "string", example: "REF-001" },
            email: { type: "string", example: "obra@cliente.com" },
            notes: { type: "string", example: "Proyecto prioritario" },
            active: { type: "boolean", example: true },
            address: { $ref: "#/components/schemas/AddressClient" },
            deleted: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        Worker: {
          type: "object",
          properties: {
            name: { type: "string", example: "Juan" },
            hours: { type: "number", example: 4 },
          },
        },

        DeliveryNote: {
          type: "object",
          properties: {
            _id: { type: "string", example: "69dd00000000000000000001" },
            user: { type: "string", example: "69ca94c28d3911cab3b9b1f8" },
            company: { type: "string", example: "69dcbe1345e02cf24539d4e3" },
            client: { type: "string", example: "69dcbe1345e02cf24539d4e3" },
            project: { type: "string", example: "69dcc6e327bd272daa751382" },
            format: { type: "string", enum: ["material", "hours"], example: "material" },
            description: { type: "string", example: "Entrega de materiales de obra" },
            workDate: { type: "string", format: "date", example: "2026-04-13" },
            material: { type: "string", example: "Cemento" },
            quantity: { type: "number", example: 25 },
            unit: { type: "string", example: "sacos" },
            hours: { type: "number", example: 8 },
            workers: {
              type: "array",
              items: { $ref: "#/components/schemas/Worker" },
            },
            signed: { type: "boolean", example: false },
            signedAt: { type: "string", format: "date-time", nullable: true },
            signatureUrl: { type: "string", example: "https://res.cloudinary.com/..." },
            pdfUrl: { type: "string", example: "https://res.cloudinary.com/..." },
            deleted: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };