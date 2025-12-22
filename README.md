# Facilita API

API back-end de uma plataforma de intermediação de serviços entre pessoas, com foco em **acessibilidade**, **pagamentos integrados** e **comunicação em tempo real**.

Este projeto foi desenvolvido como parte do meu **TCC**, sendo eu responsável **exclusivamente pelo back-end**, desde a arquitetura até as integrações externas.

---

## 📌 Visão Geral

A **Facilita API** é responsável por toda a lógica de negócio de uma plataforma que conecta **contratantes** e **prestadores de serviço**, oferecendo:

- Cadastro e autenticação de usuários
- Gerenciamento de serviços (criação, aceite, execução e finalização)
- **Pagamentos via carteira digital**, com integração ao **PagBank**
- **Chat e atualizações em tempo real** via **WebSocket**
- Sistema de avaliações
- Notificações automáticas
- Suporte a geolocalização

O back-end garante segurança, consistência dos dados e comunicação eficiente com o front-end.

---

## 🛠️ Tecnologias Utilizadas

- **Node.js**
- **Express**
- **WebSocket** (comunicação em tempo real)
- **JWT** (autenticação e autorização)
- **MySQL**
- **PagBank API** (PIX, recargas e pagamentos)
- **Webhooks**
- **Arquitetura RESTful**
- **Variáveis de ambiente (.env)**

---

## 🧠 Principais Responsabilidades no Back-end

- Modelagem do banco de dados
- Implementação das regras de negócio
- Criação e documentação de endpoints REST
- Comunicação em tempo real (chat e localização)
- Integração com gateway de pagamento
- Validações, autenticação e controle de acesso
- Webhooks para confirmação de pagamentos
- Gerenciamento de status e notificações

---

## 🏗️ Arquitetura Geral (Resumo)
```text
Front-end
   ↓
API REST (Node.js / Express)
   ↓
Regras de Negócio
   ↓
Banco de Dados (MySQL)
   ↓
PagBank API (Pagamentos)
   ↓
WebSocket (Chat e tempo real)
```

---

## 🔄 Fluxo Principal da Aplicação

1. **Cadastro do usuário**
2. Escolha do tipo de conta: **Contratante** ou **Prestador**
3. Criação da **carteira digital**
4. Contratante cria um serviço
5. Prestador visualiza e aceita o serviço
6. Serviço é executado
7. Contratante confirma a conclusão
8. Pagamento é processado
9. Avaliação opcional do serviço

---

## 💳 Fluxo de Pagamento

### Cenário 1 — Saldo suficiente
- Débito da carteira do contratante
- Crédito na carteira do prestador
- Serviço marcado como **PAGO**

### Cenário 2 — Saldo insuficiente
- Solicitação de recarga via **PIX**
- Confirmação automática via **Webhook PagBank**
- Processamento do pagamento do serviço

---

## 💬 Comunicação em Tempo Real

Utilização de **WebSocket** para:
- Chat entre contratante e prestador
- Atualização de status de mensagens
- Notificações instantâneas
- Compartilhamento de localização em tempo real durante o serviço

---

## 📁 Estrutura de Endpoints (Resumo)

### Autenticação & Usuários
- Cadastro e login
- Recuperação de senha
- Atualização de perfil
- Definição do tipo de conta

### Serviços
- Criação
- Listagem
- Aceite
- Finalização
- Confirmação

### Pagamentos & Carteira
- Criação de carteira
- Recargas via PIX
- Pagamento de serviços
- Webhooks PagBank

### Chat & Notificações
- Mensagens em tempo real
- Histórico de chat
- Marcação de mensagens
- Notificações automáticas

### Avaliações
- Avaliação de serviços finalizados
- Consulta de avaliações por prestador

> 📌 A documentação completa dos endpoints está disponível na ferramenta de documentação da API.

---

## 🔐 Autenticação

- Autenticação baseada em **JWT**
- Tokens com expiração
- Controle de acesso por tipo de conta
- Proteção de rotas sensíveis

---

## ⚙️ Requisitos Técnicos

- Node.js 16+
- MySQL
- Servidor com suporte a WebSocket
- SSL/TLS (produção)
- Conta PagBank (sandbox ou produção)

---

## 🚀 Como Executar o Projeto

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar o servidor
npm run dev
```
---

## 📌 Observações

Este projeto tem foco educacional e demonstrativo, mas segue boas práticas de desenvolvimento back-end, arquitetura e integração com serviços externos.

## 👩‍💻 Autoria

Projeto desenvolvido por **Giovanna Soares Xavier**  
Back-end Developer | Node.js

## 📬 Contato

Caso queira conversar sobre o projeto ou sobre a parte técnica do back-end, fique à vontade para entrar em contato pelo [LinkedIn](https://www.linkedin.com/in/giovannaxavier7/).
