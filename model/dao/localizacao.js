/**
 * objetivo: DAO responsável pelo CRUD de localizacao usando Prisma
 * data: 25/09/2025
 * dev: Giovanna
 * versão: 1.0
 */

const { PrismaClient } = require('../../prisma/generated/client')
const prisma = new PrismaClient();

// ================ CREATE =================
async function createLocalizacao(data) {
  return await prisma.localizacao.create({
    data: {
      logradouro: data.logradouro,
      numero: data.numero,
      bairro: data.bairro,
      cidade: data.cidade,
      cep: data.cep,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  });
}

// ================ LISTAR TODOS =================
async function selectAllLocalizacoes() {
  return await prisma.localizacao.findMany();
}

// ================ READ ONE =================
async function selectByIdLocalizacao(id) {
  return await prisma.localizacao.findUnique({
    where: { id: Number(id) },
  });
}

// ================ UPDATE =================
async function updateLocalizacao(id, data) {
  return await prisma.localizacao.update({
    where: { id: Number(id) },
    data: {
      logradouro: data.logradouro,
      numero: data.numero,
      bairro: data.bairro,
      cidade: data.cidade,
      cep: data.cep,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  });
}

// ================ DELETE =================
async function deleteLocalizacao(id) {
  return await prisma.localizacao.delete({
    where: { id: Number(id) },
  });
}

module.exports = {
  createLocalizacao,
  selectAllLocalizacoes,
  selectByIdLocalizacao,
  updateLocalizacao,
  deleteLocalizacao
};
