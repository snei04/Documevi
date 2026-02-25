-- Fix: Agregar columnas de ubicación faltantes a la tabla documentos
SET FOREIGN_KEY_CHECKS = 0;

DROP PROCEDURE IF EXISTS AddDocumentoLocationCols;
DELIMITER $$
CREATE PROCEDURE AddDocumentoLocationCols()
BEGIN
    DECLARE colCount INT;
    SELECT COUNT(*) INTO colCount FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'documentos' AND column_name = 'id_carpeta';
    IF colCount = 0 THEN
        ALTER TABLE documentos
        ADD COLUMN id_carpeta INT DEFAULT NULL,
        ADD COLUMN paquete VARCHAR(50) DEFAULT NULL,
        ADD COLUMN tomo VARCHAR(50) DEFAULT NULL,
        ADD COLUMN modulo VARCHAR(50) DEFAULT NULL,
        ADD COLUMN entrepaño VARCHAR(50) DEFAULT NULL,
        ADD COLUMN estante VARCHAR(50) DEFAULT NULL,
        ADD COLUMN otro VARCHAR(255) DEFAULT NULL;
        
        ALTER TABLE documentos
        ADD CONSTRAINT fk_documento_carpeta
        FOREIGN KEY (id_carpeta) REFERENCES carpetas(id) ON DELETE SET NULL;
    END IF;
END $$
DELIMITER ;
CALL AddDocumentoLocationCols();
DROP PROCEDURE IF EXISTS AddDocumentoLocationCols;

-- Asegurar que el permiso documentos_editar existe
INSERT IGNORE INTO permisos (nombre_permiso, descripcion) 
VALUES ('documentos_editar', 'Permite editar metadatos y ubicación de documentos.');

SET FOREIGN_KEY_CHECKS = 1;
