/*
  Warnings:

  - You are about to drop the column `local_entrega` on the `servico` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cpf]` on the table `Contratante` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `contratante` ADD COLUMN `cpf` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `servico` DROP COLUMN `local_entrega`;

-- CreateIndex
CREATE UNIQUE INDEX `Contratante_cpf_key` ON `Contratante`(`cpf`);
