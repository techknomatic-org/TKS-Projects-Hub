/*
  Warnings:

  - You are about to drop the column `featureId` on the `user_stories` table. All the data in the column will be lost.
  - Added the required column `productId` to the `user_stories` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
SET sql_require_primary_key = OFF;
ALTER TABLE `user_stories` DROP FOREIGN KEY `user_stories_featureId_fkey`;


-- AlterTable
ALTER TABLE `user_stories` DROP COLUMN `featureId`,
    ADD COLUMN `productId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('EMPLOYEE', 'ADMIN', 'BOTH') NOT NULL;

-- CreateTable
CREATE TABLE `_UserTaggedProducts` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_UserTaggedProducts_AB_unique`(`A`, `B`),
    INDEX `_UserTaggedProducts_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_stories` ADD CONSTRAINT `user_stories_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserTaggedProducts` ADD CONSTRAINT `_UserTaggedProducts_A_fkey` FOREIGN KEY (`A`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserTaggedProducts` ADD CONSTRAINT `_UserTaggedProducts_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
