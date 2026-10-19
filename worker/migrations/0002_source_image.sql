-- store.js'in yazdığı ama ilk migration'da unutulan sütunlar
ALTER TABLE news ADD COLUMN source_image TEXT;
ALTER TABLE news ADD COLUMN full_text INTEGER NOT NULL DEFAULT 0;