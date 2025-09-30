const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Facilita - Sistema de Serviços',
      version: '1.0.0',
      description: `
# 📚 Documentação da API Facilita

## 🚀 **Como Configurar e Rodar a API**

### **Pré-requisitos:**
- Node.js (versão 16 ou superior)
- npm ou yarn
- Banco de dados configurado
- Variáveis de ambiente configuradas

### **Instalação:**
\`\`\`bash
# 1. Clone o repositório
git clone <seu-repositorio>

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 4. Execute a API
npm start
# ou para desenvolvimento
npm run dev
\`\`\`

### **Variáveis de Ambiente Necessárias:**
\`\`\`env
PORT=8080
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=facilita_db
JWT_SECRET=seu_jwt_secret
PAGBANK_API_KEY=sua_chave_pagbank
EMAIL_HOST=seu_smtp
EMAIL_PORT=587
EMAIL_USER=seu_email
EMAIL_PASS=sua_senha_email
\`\`\`

## 🔐 **Autenticação**

A API usa **JWT (JSON Web Token)** para autenticação.

### **Headers Obrigatórios para Endpoints Protegidos:**
\`\`\`http
Content-Type: application/json
Authorization: Bearer {seu_token_jwt}
\`\`\`

### **Como obter o token:**
1. Faça login em \`POST /usuario/login\`
2. Use o token retornado no header \`Authorization\`

---
      `,
      contact: {
        name: 'Suporte Facilita',
        email: 'devgioxavier@gmail.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:8080/v1/facilita',
        description: 'Servidor de Desenvolvimento'
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Insira o token JWT no formato: Bearer {token}'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            details: {
              type: 'string',
              description: 'Detalhes do erro'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensagem de sucesso'
            },
            data: {
              type: 'object',
              description: 'Dados retornados'
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js'], // caminho dos seus arquivos de rota
};

const specs = swaggerJsdoc(options);

// Adicionar manualmente os paths que não estão nas rotas
specs.paths = {
  ...specs.paths,
  '/usuario/register': {
    post: {
      summary: 'Cadastrar novo usuário',
      tags: ['Usuários'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['nome', 'email', 'telefone', 'senha_hash'],
              properties: {
                nome: {
                  type: 'string',
                  example: 'Ana'
                },
                email: {
                  type: 'string',
                  example: 'ana@gmail.com'
                },
                telefone: {
                  type: 'string',
                  example: '687535345'
                },
                senha_hash: {
                  type: 'string',
                  example: '12345678'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Usuário criado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Usuário criado com sucesso' },
                  id: { type: 'integer', example: 1 }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/schemas/Error' },
        500: { $ref: '#/components/schemas/Error' }
      }
    }
  },
  '/usuario/login': {
    post: {
      summary: 'Fazer login na aplicação',
      tags: ['Usuários'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['login', 'senha'],
              properties: {
                login: {
                  type: 'string',
                  example: 'devgioxavier@gmail.com'
                },
                senha: {
                  type: 'string',
                  example: '7777777'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Login realizado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: {
                    type: 'string',
                    description: 'JWT token para autenticação'
                  },
                  usuario: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      nome: { type: 'string' },
                      email: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Credenciais inválidas'
        }
      }
    }
  },
  '/usuario': {
    get: {
      summary: 'Listar todos os usuários',
      tags: ['Usuários'],
      responses: {
        200: {
          description: 'Lista de usuários retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    nome: { type: 'string' },
                    email: { type: 'string' },
                    telefone: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/usuario/{id}': {
    get: {
      summary: 'Buscar usuário por ID',
      tags: ['Usuários'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
          description: 'ID do usuário'
        }
      ],
      responses: {
        200: {
          description: 'Usuário encontrado',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  nome: { type: 'string' },
                  email: { type: 'string' },
                  telefone: { type: 'string' }
                }
              }
            }
          }
        },
        404: { description: 'Usuário não encontrado' }
      }
    },
    put: {
      summary: 'Atualizar usuário',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                nome: { type: 'string', example: 'Update de user' },
                telefone: { type: 'string', example: '876237813' },
                email: { type: 'string', example: 'novoemail@gmail.com' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Usuário atualizado com sucesso' },
        401: { description: 'Não autorizado' },
        404: { description: 'Usuário não encontrado' }
      }
    },
    delete: {
      summary: 'Deletar usuário',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      responses: {
        200: { description: 'Usuário deletado com sucesso' },
        401: { description: 'Não autorizado' },
        404: { description: 'Usuário não encontrado' }
      }
    }
  },
  '/usuario/{id}/perfil': {
    put: {
      summary: 'Atualizar perfil completo do usuário',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                nome: { type: 'string', example: 'TESTE' },
                email: { type: 'string', example: 'daniel.sa@gmail.com' },
                documentos: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer', example: 9 },
                      action: { type: 'string', enum: ['update', 'create'], example: 'update' },
                      valor: { type: 'string', example: 'Moto' },
                      tipo_documento: { type: 'string', example: 'CNH_EAR' }
                    }
                  }
                },
                locais: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer', example: 1 },
                      action: { type: 'string', enum: ['connect', 'create'], example: 'connect' },
                      logradouro: { type: 'string', example: 'Rua Nova' },
                      numero: { type: 'string', example: '456' },
                      bairro: { type: 'string', example: 'Bairro Novo' },
                      cidade: { type: 'string', example: 'São Paulo' },
                      cep: { type: 'string', example: '01111-111' },
                      latitude: { type: 'string', example: '-23.5510' },
                      longitude: { type: 'string', example: '-46.6340' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Perfil atualizado com sucesso' },
        401: { description: 'Não autorizado' }
      }
    }
  },
  '/usuario/recuperar-senha': {
    post: {
      summary: 'Solicitar recuperação de senha',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: {
                  type: 'string',
                  example: 'devgioxavier@gmail.com'
                }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Email de recuperação enviado' },
        404: { description: 'Email não encontrado' }
      }
    }
  },
  '/usuario/redefinir-senha': {
    post: {
      summary: 'Redefinir senha com código de verificação',
      tags: ['Usuários'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'codigo', 'novaSenha'],
              properties: {
                email: {
                  type: 'string',
                  example: 'devgioxavier@gmail.com'
                },
                codigo: {
                  type: 'string',
                  example: '16907'
                },
                novaSenha: {
                  type: 'string',
                  example: '7777777'
                }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Senha redefinida com sucesso' },
        400: { description: 'Código inválido ou expirado' }
      }
    }
  },
  '/contratante/register': {
    post: {
      summary: 'Cadastrar novo contratante',
      tags: ['Contratantes'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id_localizacao', 'necessidade', 'cpf'],
              properties: {
                id_localizacao: {
                  type: 'integer',
                  example: 1
                },
                necessidade: {
                  type: 'string',
                  enum: ['IDOSO', 'DEF_VISUAL', 'DEF_AUDITIVA', 'MOBILIDADE_REDUZIDA'],
                  example: 'IDOSO'
                },
                cpf: {
                  type: 'string',
                  example: '11144477735'
                }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Contratante cadastrado com sucesso' },
        400: { description: 'Dados inválidos' },
        401: { description: 'Não autorizado' }
      }
    }
  },
  '/contratante': {
    get: {
      summary: 'Buscar todos os contratantes',
      tags: ['Contratantes'],
      responses: {
        200: {
          description: 'Lista de contratantes retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    id_usuario: { type: 'integer' },
                    id_localizacao: { type: 'integer' },
                    necessidade: { type: 'string' },
                    cpf: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/contratante/{id}': {
    get: {
      summary: 'Buscar contratante por ID',
      tags: ['Contratantes'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      responses: {
        200: {
          description: 'Contratante encontrado',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  id_usuario: { type: 'integer' },
                  id_localizacao: { type: 'integer' },
                  necessidade: { type: 'string' },
                  cpf: { type: 'string' }
                }
              }
            }
          }
        },
        404: { description: 'Contratante não encontrado' }
      }
    },
    put: {
      summary: 'Atualizar contratante',
      tags: ['Contratantes'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id_localizacao: { type: 'integer', example: 1 },
                necessidade: { 
                  type: 'string', 
                  enum: ['IDOSO', 'DEF_VISUAL', 'DEF_AUDITIVA', 'MOBILIDADE_REDUZIDA'],
                  example: 'DEF_VISUAL'
                }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Contratante atualizado com sucesso' },
        401: { description: 'Não autorizado' },
        404: { description: 'Contratante não encontrado' }
      }
    },
    delete: {
      summary: 'Apagar contratante',
      tags: ['Contratantes'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      responses: {
        200: { description: 'Contratante deletado com sucesso' },
        401: { description: 'Não autorizado' },
        404: { description: 'Contratante não encontrado' }
      }
    }
  },
  '/prestador/register': {
    post: {
      summary: 'Cadastrar prestador de serviço',
      tags: ['Prestadores'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['locais', 'documentos'],
              properties: {
                locais: {
                  type: 'array',
                  items: { type: 'integer' },
                  example: [1]
                },
                documentos: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['tipo_documento', 'valor'],
                    properties: {
                      tipo_documento: {
                        type: 'string',
                        example: 'CPF'
                      },
                      valor: {
                        type: 'string',
                        example: '12345678900'
                      },
                      data_validade: {
                        type: 'string',
                        format: 'date',
                        example: '2030-12-31'
                      },
                      arquivo_url: {
                        type: 'string',
                        example: 'https://teste.com/documento.pdf'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Prestador cadastrado com sucesso' },
        400: { description: 'Dados inválidos' },
        401: { description: 'Não autorizado' }
      }
    }
  },
  '/prestador': {
    get: {
      summary: 'Listar todos os prestadores',
      tags: ['Prestadores'],
      responses: {
        200: {
          description: 'Lista de prestadores retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    id_usuario: { type: 'integer' },
                    avaliacao: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/prestador/{id}': {
    get: {
      summary: 'Buscar prestador por ID',
      tags: ['Prestadores'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      responses: {
        200: {
          description: 'Prestador encontrado',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  id_usuario: { type: 'integer' },
                  avaliacao: { type: 'number' },
                  locais: {
                    type: 'array',
                    items: { type: 'object' }
                  },
                  documentos: {
                    type: 'array',
                    items: { type: 'object' }
                  }
                }
              }
            }
          }
        },
        404: { description: 'Prestador não encontrado' }
      }
    },
    put: {
      summary: 'Atualizar prestador',
      tags: ['Prestadores'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                locais: {
                  type: 'array',
                  items: { type: 'integer' },
                  example: [1]
                },
                documentos: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      tipo_documento: { type: 'string', example: 'CPF' },
                      valor: { type: 'string', example: '2222222222' },
                      data_validade: { type: 'string', example: '2030-12-31' },
                      arquivo_url: { type: 'string', example: 'https://teste.com/documento.pdf' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Prestador atualizado com sucesso' },
        401: { description: 'Não autorizado' },
        404: { description: 'Prestador não encontrado' }
      }
    },
    delete: {
      summary: 'Deletar prestador',
      tags: ['Prestadores'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      responses: {
        200: { description: 'Prestador deletado com sucesso' },
        401: { description: 'Não autorizado' },
        404: { description: 'Prestador não encontrado' }
      }
    }
  },
  '/localizacao': {
    post: {
      summary: 'Criar nova localização',
      tags: ['Localizações'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['logradouro', 'numero', 'bairro', 'cidade', 'cep', 'latitude', 'longitude'],
              properties: {
                logradouro: { type: 'string', example: 'Rua das Flores' },
                numero: { type: 'string', example: '123' },
                bairro: { type: 'string', example: 'Jardim Primavera' },
                cidade: { type: 'string', example: 'São Paulo' },
                cep: { type: 'string', example: '01234-567' },
                latitude: { type: 'number', format: 'float', example: -23.55052 },
                longitude: { type: 'number', format: 'float', example: -46.633308 }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Localização criada com sucesso' },
        400: { description: 'Dados inválidos' }
      }
    },
    get: {
      summary: 'Listar todas as localizações',
      tags: ['Localizações'],
      responses: {
        200: {
          description: 'Lista de localizações retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    logradouro: { type: 'string' },
                    numero: { type: 'string' },
                    bairro: { type: 'string' },
                    cidade: { type: 'string' },
                    cep: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/localizacao/{id}': {
    get: {
      summary: 'Buscar localização por ID',
      tags: ['Localizações'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      responses: {
        200: {
          description: 'Localização encontrada',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  logradouro: { type: 'string' },
                  numero: { type: 'string' },
                  bairro: { type: 'string' },
                  cidade: { type: 'string' },
                  cep: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' }
                }
              }
            }
          }
        },
        404: { description: 'Localização não encontrada' }
      }
    },
    put: {
      summary: 'Atualizar localização',
      tags: ['Localizações'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                logradouro: { type: 'string', example: 'Rua das Palmeiras' },
                numero: { type: 'string', example: '123' },
                bairro: { type: 'string', example: 'Jardim Primavera' },
                cidade: { type: 'string', example: 'São Paulo' },
                cep: { type: 'string', example: '01234-567' },
                latitude: { type: 'number', example: -23.5505 },
                longitude: { type: 'number', example: -46.6333 }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Localização atualizada com sucesso' },
        404: { description: 'Localização não encontrada' }
      }
    },
    delete: {
      summary: 'Deletar localização',
      tags: ['Localizações'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' }
        }
      ],
      responses: {
        200: { description: 'Localização deletada com sucesso' },
        404: { description: 'Localização não encontrada' }
      }
    }
  },
  '/servico': {
    post: {
      summary: 'Criar um novo serviço',
      tags: ['Serviços'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id_contratante', 'id_prestador', 'id_categoria', 'id_localizacao', 'descricao', 'status'],
              properties: {
                id_contratante: { type: 'integer', example: 3 },
                id_prestador: { type: 'integer', example: 2 },
                id_categoria: { type: 'integer', example: 1 },
                id_localizacao: { type: 'integer', example: 1 },
                descricao: { type: 'string', example: 'UBER' },
                status: {
                  type: 'string',
                  enum: ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'],
                  example: 'PENDENTE'
                }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Serviço criado com sucesso' },
        400: { description: 'Dados inválidos' }
      }
    }
  },
  '/categoria': {
    post: {
      summary: 'Adicionar nova categoria de serviço',
      tags: ['Categorias'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['nome'],
              properties: {
                nome: { type: 'string', example: 'Limpeza' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Categoria criada com sucesso' },
        400: { description: 'Dados inválidos' }
      }
    },
    get: {
      summary: 'Listar todas as categorias',
      tags: ['Categorias'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Lista de categorias retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    nome: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/pagamento': {
    post: {
      summary: 'Criar pagamento local (para testes)',
      tags: ['Pagamentos'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id_servico', 'id_contratante', 'id_prestador', 'valor', 'metodo', 'status'],
              properties: {
                id_servico: { type: 'integer', example: 3 },
                id_contratante: { type: 'integer', example: 2 },
                id_prestador: { type: 'integer', example: 2 },
                valor: { type: 'number', format: 'float', example: 150.00 },
                metodo: {
                  type: 'string',
                  enum: ['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'CARTEIRA_PAGBANK'],
                  example: 'CARTEIRA_PAGBANK'
                },
                status: {
                  type: 'string',
                  enum: ['PENDENTE', 'PROCESSANDO', 'APROVADO', 'RECUSADO', 'ESTORNADO'],
                  example: 'PENDENTE'
                }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Pagamento criado com sucesso' },
        400: { description: 'Dados inválidos' }
      }
    }
  },
  '/pagamento/pagbank': {
    post: {
      summary: 'Processar pagamento via PagBank',
      tags: ['Pagamentos'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id_servico', 'valor', 'metodo'],
              properties: {
                id_servico: { type: 'integer', example: 6 },
                valor: { type: 'number', format: 'float', example: 7000.00 },
                metodo: {
                  type: 'string',
                  enum: ['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO'],
                  example: 'PIX'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Pagamento processado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  qr_code: { type: 'string', description: 'QR Code para pagamento PIX' },
                  payment_id: { type: 'string', description: 'ID do pagamento no PagBank' },
                  status: { type: 'string', example: 'PENDING' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/webhook/pagbank': {
    post: {
      summary: 'Webhook para receber notificações do PagBank',
      tags: ['Pagamentos'],
      description: 'Endpoint chamado pelo PagBank para atualizar status de pagamentos',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id_servico: { type: 'integer', example: 4 },
                valor: { type: 'number', example: 150.00 },
                metodo: { type: 'string', example: 'CARTEIRA_PAGBANK' },
                status: { type: 'string', example: 'APROVADO' },
                pagbank_payment_id: { type: 'string', example: 'pay_123456789' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Webhook processado com sucesso' }
      }
    }
  },
  '/carteira': {
    post: {
      summary: 'Criar carteira digital para usuário',
      tags: ['Carteira'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id_usuario', 'chave_pagbank'],
              properties: {
                id_usuario: { type: 'integer', example: 5 },
                chave_pagbank: { type: 'string', example: 'abc123' },
                saldo: { type: 'number', format: 'float', example: 700.00 }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Carteira criada com sucesso' },
        400: { description: 'Dados inválidos' },
        401: { description: 'Não autorizado' }
      }
    }
  }
};

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Facilita - Documentação'
  }));
};