/*
  Warnings:

  - You are about to alter the column `data_avaliacao` on the `avaliacao` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.

*/
-- DropForeignKey
ALTER TABLE `avaliacao` DROP FOREIGN KEY `avaliacao_id_contratante_fkey`;

-- DropForeignKey
ALTER TABLE `avaliacao` DROP FOREIGN KEY `avaliacao_id_prestador_fkey`;

-- DropForeignKey
ALTER TABLE `avaliacao` DROP FOREIGN KEY `avaliacao_id_servico_fkey`;

-- AlterTable
ALTER TABLE `avaliacao` MODIFY `comentario` TEXT NULL,
    MODIFY `data_avaliacao` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `servico` ADD COLUMN `data_confirmacao` DATETIME(3) NULL;

-- RenameIndex
ALTER TABLE `_localizacaotoprestador` RENAME INDEX `_LocalizacaoToPrestador_AB_unique` TO `_localizacaotoprestador_AB_unique`;

-- RenameIndex
ALTER TABLE `_localizacaotoprestador` RENAME INDEX `_LocalizacaoToPrestador_B_index` TO `_localizacaotoprestador_B_index`;

-- RenameIndex
ALTER TABLE `avaliacao` RENAME INDEX `avaliacao_id_contratante_fkey` TO `avaliacao_id_contratante_idx`;

-- RenameIndex
ALTER TABLE `avaliacao` RENAME INDEX `avaliacao_id_prestador_fkey` TO `avaliacao_id_prestador_idx`;

-- RenameIndex
ALTER TABLE `avaliacao` RENAME INDEX `avaliacao_id_servico_key` TO `id_servico`;

-- RenameIndex
ALTER TABLE `prestador` RENAME INDEX `Prestador_id_usuario_fkey` TO `Prestador_id_usuario_idx`;
