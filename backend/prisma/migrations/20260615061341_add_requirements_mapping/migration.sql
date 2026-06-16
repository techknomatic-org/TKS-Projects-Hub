-- AlterTable
ALTER TABLE `audit_logs` MODIFY `entityType` ENUM('STATUS', 'FEATURE', 'USER_STORY', 'REQUIREMENTS_MAPPING', 'FUNCTIONAL_REQUIREMENT') NOT NULL;

-- AlterTable
ALTER TABLE `notifications` MODIFY `entityType` ENUM('STATUS', 'FEATURE', 'USER_STORY', 'REQUIREMENTS_MAPPING', 'FUNCTIONAL_REQUIREMENT') NULL;

-- CreateTable
CREATE TABLE `functional_requirements` (
    `id` VARCHAR(191) NOT NULL,
    `req_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `functional_requirements_product_id_req_id_key`(`product_id`, `req_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_story_requirement_mappings` (
    `mapping_id` VARCHAR(191) NOT NULL,
    `user_story_id` VARCHAR(191) NOT NULL,
    `functional_requirement_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_story_requirement_mappings_user_story_id_functional_req_key`(`user_story_id`, `functional_requirement_id`),
    PRIMARY KEY (`mapping_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `functional_requirements` ADD CONSTRAINT `functional_requirements_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_story_requirement_mappings` ADD CONSTRAINT `user_story_requirement_mappings_user_story_id_fkey` FOREIGN KEY (`user_story_id`) REFERENCES `user_stories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_story_requirement_mappings` ADD CONSTRAINT `user_story_requirement_mappings_functional_requirement_id_fkey` FOREIGN KEY (`functional_requirement_id`) REFERENCES `functional_requirements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
