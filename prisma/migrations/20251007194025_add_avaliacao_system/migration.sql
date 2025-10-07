/*
  Warnings:

  - The primary key for the `_localizacaotoprestador` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `my_row_id` on the `_localizacaotoprestador` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `_localizacaotoprestador` DROP PRIMARY KEY,
    DROP COLUMN `my_row_id`;

-- AlterTable
ALTER TABLE `servico` ADD COLUMN `valor` DECIMAL(10, 2) NULL;

-- CreateTable
CREATE TABLE `avaliacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_servico` INTEGER NOT NULL,
    `id_contratante` INTEGER NOT NULL,
    `id_prestador` INTEGER NOT NULL,
    `nota` INTEGER NOT NULL,
    `comentario` VARCHAR(191) NULL,
    `data_avaliacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `avaliacao_id_servico_key`(`id_servico`),
    INDEX `avaliacao_id_prestador_fkey`(`id_prestador`),
    INDEX `avaliacao_id_contratante_fkey`(`id_contratante`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Prestador_id_usuario_fkey` ON `Prestador`(`id_usuario`);

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `avaliacao_id_servico_fkey` FOREIGN KEY (`id_servico`) REFERENCES `servico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `avaliacao_id_contratante_fkey` FOREIGN KEY (`id_contratante`) REFERENCES `Contratante`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `avaliacao_id_prestador_fkey` FOREIGN KEY (`id_prestador`) REFERENCES `Prestador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
