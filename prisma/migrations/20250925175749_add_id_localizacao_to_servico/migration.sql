-- 1️⃣ Adicionar a coluna
ALTER TABLE `servico`
  ADD COLUMN `id_localizacao` INT NULL;

-- 2️⃣ Adicionar a FK
ALTER TABLE `servico`
  ADD CONSTRAINT `servico_id_localizacao_fkey`
  FOREIGN KEY (`id_localizacao`) REFERENCES `Localizacao`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;