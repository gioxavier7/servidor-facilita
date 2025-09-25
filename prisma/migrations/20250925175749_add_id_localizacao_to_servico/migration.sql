/*
  Warnings:

  - You are about to drop the column `local_entrega` on the `servico` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `servico` DROP COLUMN `local_entrega`,
    ADD COLUMN `id_localizacao` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `servico` ADD CONSTRAINT `servico_id_localizacao_fkey` FOREIGN KEY (`id_localizacao`) REFERENCES `localizacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
