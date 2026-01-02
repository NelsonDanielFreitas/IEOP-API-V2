function buildOpenApiSpec({ serverUrl }) {
  return {
    openapi: "3.0.0",
    info: {
      title: "IEOP API V2",
      version: "0.1.0",
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: "System" },
      { name: "Products" },
      { name: "Clients" },
      { name: "Documents" },
    ],
    components: {
      schemas: {
        ErrorResponse: {
          type: "object",
          additionalProperties: false,
          properties: {
            ok: { type: "boolean", example: false },
            error: { type: "string", example: "VENDUS_CREATE_FAILED" },
            details: { nullable: true },
          },
        },
        EssentialProduct: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "integer", nullable: true, example: 295783271 },
            reference: {
              type: "string",
              nullable: true,
              example: "RENCLI22652",
            },
            title: {
              type: "string",
              nullable: true,
              example: "Renault Teste 2.0d 4",
            },
            description: {
              type: "string",
              nullable: true,
              example: "Clio completamente tunado, ele até voa",
            },
            grossPrice: { type: "number", nullable: true, example: 45000 },
            priceWithoutTax: {
              type: "number",
              nullable: true,
              example: 36585.37,
            },
            stock: { type: "number", nullable: true, example: 3 },
            status: { type: "string", nullable: true, example: "on" },
            imageUrl: {
              type: "string",
              nullable: true,
              example:
                "https://www.vendus.pt/foto/6247ec487c3a96697b609378e7ef119a_m.png",
            },
          },
        },
        CreateCarRequest: {
          type: "object",
          additionalProperties: false,
          required: ["title", "category", "brand"],
          properties: {
            reference: {
              type: "string",
              description:
                "Referência única do produto. Se não enviares, a API gera automaticamente com base em marca + matrícula. Se já existir, devolve 409.",
              example: "RENCLI22652",
            },
            title: {
              type: "string",
              description: "Nome/modelo do carro.",
              example: "Renault Clio 2.0d",
            },
            license_plate: {
              type: "string",
              description:
                "Matrícula (vai ser adicionada ao título no Vendus).",
              example: "AA-00-BB",
            },
            description: {
              type: "string",
              description: "Descrição do carro.",
              example: "Clio completamente tunado, ele até voa",
            },
            category: {
              type: "string",
              description: "Nome da categoria existente na Vendus.",
              example: "Carros",
            },
            brand: {
              type: "string",
              description: "Nome da marca existente na Vendus.",
              example: "Renault",
            },
            supply_price: {
              type: "number",
              description: "Preço de custo.",
              example: 38000,
            },
            gross_price: {
              type: "number",
              description: "Preço final (com IVA).",
              example: 45000,
            },
            tax_id: {
              type: "string",
              description: "Código de imposto (ex: NOR).",
              example: "NOR",
            },
            tax_exemption: {
              type: "string",
              description: "Motivo de isenção (se aplicável).",
              example: "M01",
            },
            image: {
              type: "string",
              description:
                "(Ainda não implementado) Imagem em base64 para a Vendus.",
              example: "<base64>",
            },
          },
        },
        CreateCarResponse: {
          type: "object",
          additionalProperties: false,
          properties: {
            ok: { type: "boolean", example: true },
            data: {
              type: "object",
              description:
                "Resposta devolvida pela Vendus (campos podem variar).",
              properties: {
                id: { type: "integer", example: 295783271 },
                reference: { type: "string", example: "RENCLI22652" },
                title: {
                  type: "string",
                  example: "Renault Clio 2.0d (Matrícula: AA-00-BB)",
                },
                status: { type: "string", example: "on" },
              },
            },
          },
        },

        CreateClientRequest: {
          type: "object",
          additionalProperties: false,
          required: ["name"],
          properties: {
            name: {
              type: "string",
              description: "Nome do cliente.",
              example: "João Silva",
            },
            email: {
              type: "string",
              nullable: true,
              description: "Email do cliente.",
              example: "joao.silva@email.com",
            },
            phone: {
              type: "string",
              nullable: true,
              description: "Telefone do cliente.",
              example: "+351912345678",
            },
          },
        },

        CreateClientResponse: {
          type: "object",
          additionalProperties: false,
          properties: {
            ok: { type: "boolean", example: true },
            data: {
              type: "object",
              description:
                "Resposta devolvida pela Vendus (campos podem variar).",
              properties: {
                id: { type: "integer", example: 123456 },
                name: { type: "string", example: "João Silva" },
                email: { type: "string", example: "joao.silva@email.com" },
                phone: { type: "string", example: "+351912345678" },
              },
            },
          },
        },

        CreateDocumentRequest: {
          type: "object",
          additionalProperties: false,
          required: ["ClientEmail", "ItemId", "GrossPrice"],
          properties: {
            ClientEmail: {
              type: "string",
              description:
                "Email do cliente que tem de existir no Vendus (usado para ir buscar o cliente).",
              example: "joao.silva@email.com",
            },
            ItemId: {
              type: "integer",
              description: "ID do item/produto na Vendus.",
              example: 295783271,
            },
            GrossPrice: {
              type: "number",
              description: "Preço final (com IVA) do item.",
              example: 45000,
            },
            Notes: {
              type: "string",
              description: "Notas/observações no documento.",
              example: "Pagamento via transferência.",
            },
          },
        },

        CreateDocumentResponse: {
          type: "object",
          additionalProperties: false,
          properties: {
            ok: { type: "boolean", example: true },
            data: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "integer", example: 123456789 },
                type: { type: "string", nullable: true, example: "FT" },
                number: {
                  type: "string",
                  nullable: true,
                  example: "FT 2026/1",
                },
                date: { type: "string", nullable: true, example: "2026-01-02" },
                amount_gross: {
                  type: "number",
                  nullable: true,
                  example: 45000,
                },
                amount_net: {
                  type: "number",
                  nullable: true,
                  example: 36585.37,
                },
                hash: { type: "string", nullable: true },
                atcud: { type: "string", nullable: true },
                qrcode: { type: "string", nullable: true },
                output: { type: "string", nullable: true, example: "pdf" },
                output_data: { nullable: true },
              },
            },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          summary: "Healthcheck",
          tags: ["System"],
          responses: {
            200: { description: "API is healthy" },
          },
        },
      },
      "/products": {
        get: {
          summary: "Lista produtos (Cegid Vendus) - formato essencial",
          tags: ["Products"],
          responses: {
            200: {
              description: "Lista devolvida com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      ok: { type: "boolean", example: true },
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/EssentialProduct",
                        },
                      },
                    },
                  },
                  example: {
                    ok: true,
                    data: [
                      {
                        id: 295783271,
                        reference: "RENCLI22652",
                        title: "Renault Teste 2.0d 4",
                        description: "Clio completamente tunado, ele até voa",
                        grossPrice: 45000,
                        priceWithoutTax: 36585.37,
                        stock: 3,
                        status: "on",
                        imageUrl:
                          "https://www.vendus.pt/foto/6247ec487c3a96697b609378e7ef119a_m.png",
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Cria um carro/produto no Cegid Vendus",
          description:
            "Cria um produto na Vendus com base nos dados do carro. Nota: a parte da imagem ainda não está funcional.",
          tags: ["Products"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateCarRequest" },
                example: {
                  reference: "RENCLI22652",
                  title: "Renault Clio 2.0d",
                  license_plate: "AA-00-BB",
                  description: "Clio completamente tunado, ele até voa",
                  category: "Carros",
                  brand: "Renault",
                  supply_price: 38000,
                  gross_price: 45000,
                  tax_id: "NOR",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Produto criado com sucesso",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CreateCarResponse" },
                  example: {
                    ok: true,
                    data: {
                      id: 295783271,
                      reference: "RENCLI22652",
                      title: "Renault Clio 2.0d (Matrícula: AA-00-BB)",
                      status: "on",
                    },
                  },
                },
              },
            },
            409: {
              description: "Já existe produto com a mesma referência",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: {
                    ok: false,
                    error: "PRODUCT_ALREADY_EXISTS",
                    details: {
                      id: 123,
                      reference: "RENCLI22652",
                      title: "Renault Clio 2.0d",
                    },
                  },
                },
              },
            },
            500: {
              description: "Erro interno / erro da Vendus",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },

      "/clients": {
        post: {
          summary: "Cria um cliente no Cegid Vendus",
          tags: ["Clients"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateClientRequest" },
                example: {
                  name: "João Silva",
                  email: "joao.silva@email.com",
                  phone: "+351912345678",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Cliente criado com sucesso",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CreateClientResponse" },
                  example: {
                    ok: true,
                    data: {
                      id: 123456,
                      name: "João Silva",
                      email: "joao.silva@email.com",
                      phone: "+351912345678",
                    },
                  },
                },
              },
            },
            500: {
              description: "Erro interno / erro da Vendus",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },

      "/documents": {
        get: {
          summary: "Lista documentos (Vendus)",
          description: "Obtém todos os documentos a partir da Vendus.",
          tags: ["Documents"],
          responses: {
            200: {
              description: "Lista devolvida com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      ok: { type: "boolean", example: true },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          description:
                            "Documento devolvido pela Vendus (campos podem variar).",
                          additionalProperties: true,
                        },
                      },
                    },
                  },
                  example: {
                    ok: true,
                    data: [
                      {
                        id: 123456789,
                        type: "FT",
                        number: "FT 2026/1",
                        date: "2026-01-02",
                        amount_gross: 45000,
                      },
                    ],
                  },
                },
              },
            },
            500: {
              description: "Erro interno / erro da Vendus",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          summary: "Cria um documento (Vendus)",
          description:
            "Cria um documento na Vendus com 1 item e associa ao cliente encontrado pelo email.",
          tags: ["Documents"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateDocumentRequest" },
                example: {
                  ClientEmail: "joao.silva@email.com",
                  ItemId: 295783271,
                  GrossPrice: 45000,
                  Notes: "Pagamento via transferência.",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Documento criado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/CreateDocumentResponse",
                  },
                  example: {
                    ok: true,
                    data: {
                      id: 123456789,
                      type: "FT",
                      number: "FT 2026/1",
                      date: "2026-01-02",
                      amount_gross: 45000,
                      amount_net: 36585.37,
                      hash: "...",
                      atcud: "...",
                      qrcode: "...",
                      output: "pdf",
                      output_data: null,
                    },
                  },
                },
              },
            },
            400: {
              description: "Erro de validação",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: {
                    ok: false,
                    error: "VALIDATION_ERROR",
                    details: { field: "ClientEmail" },
                  },
                },
              },
            },
            404: {
              description: "Cliente não encontrado no Vendus",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: {
                    ok: false,
                    error: "CLIENT_NOT_FOUND",
                    details: {
                      available: ["cliente1@email.com", "cliente2@email.com"],
                    },
                  },
                },
              },
            },
            500: {
              description: "Erro interno / erro da Vendus",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
  };
}

module.exports = { buildOpenApiSpec };
