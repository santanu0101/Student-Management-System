import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Student Management API",
      version: "1.0.0",
    },

    servers: [
      {
        url: "http://localhost:8000/api/v1",
        description: "Local development server",
      },
    ],

    components: {
      // schemas: {
      //   CreateStudent: {
      //     type: "object",
      //     required: ["name", "email", "department"],
      //     properties: {
      //       name: { type: "string" },
      //       email: { type: "string" },
      //       department: { type: "string" },
      //     },
      //   },
      //   UpdateStudent: {
      //     type: "object",
      //     properties: {
      //       name: { type: "string" },
      //       email: { type: "string" },
      //       department: { type: "string" },
      //     },
      //   },
      //   UpdateStudentStatus: {
      //     type: "object",
      //     required: ["status"],
      //     properties: {
      //       status: {
      //         type: "string",
      //         enum: ["ACTIVE", "SUSPENDED", "GRADUATED"],
      //       },
      //     },
      //   },
      // },
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [{ BearerAuth: [] }],
  },

  apis: ["./src/modules/**/*.js"],
});
