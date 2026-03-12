import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Vote en ligne",
      version: "1.0.0",
      description: "API pour la gestion des élections et votes",
    },

    servers: [
      {
        url: "http://localhost:5000",
      },
    ],

    components: {

      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },

      schemas: {

        Election: {
          type: "object",
          properties: {
            id: { type: "integer" },
            titre: { type: "string" },
            description: { type: "string" },
            date_debut: { type: "string" },
            date_fin: { type: "string" }
          }
        },

        Candidat: {
          type: "object",
          properties: {
            id: { type: "integer" },
            nom: { type: "string" },
            parti: { type: "string" },
            election_id: { type: "integer" }
          }
        },

        Electeur: {
          type: "object",
          properties: {
            id: { type: "integer" },
            nom: { type: "string" },
            email: { type: "string" },
            password: { type: "string" }
          }
        },

        Vote: {
          type: "object",
          properties: {
            electeur_id: { type: "integer" },
            candidat_id: { type: "integer" },
            election_id: { type: "integer" }
          }
        }

      }

    }
  },

  apis: ["./routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };