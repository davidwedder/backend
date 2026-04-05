-- AlterTable
CREATE SEQUENCE store_settings_id_seq;
ALTER TABLE "store_settings" ALTER COLUMN "id" SET DEFAULT nextval('store_settings_id_seq'),
ALTER COLUMN "about_image_url" DROP DEFAULT,
ALTER COLUMN "hero_image_url" DROP DEFAULT;
ALTER SEQUENCE store_settings_id_seq OWNED BY "store_settings"."id";
