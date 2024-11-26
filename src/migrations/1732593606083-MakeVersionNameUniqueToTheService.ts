import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeVersionNameUniqueToTheService1732593606083 implements MigrationInterface {
    name = 'MakeVersionNameUniqueToTheService1732593606083'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "createdByUserId"`);
        await queryRunner.query(`ALTER TABLE "versions" ADD CONSTRAINT "UQ_a4652e12bd4a4b6c49555fc8db2" UNIQUE ("name", "serviceId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "versions" DROP CONSTRAINT "UQ_a4652e12bd4a4b6c49555fc8db2"`);
        await queryRunner.query(`ALTER TABLE "services" ADD "createdByUserId" uuid`);
    }

}
