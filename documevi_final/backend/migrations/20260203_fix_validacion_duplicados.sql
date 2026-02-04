-- Fix for partially applied migration 20260114_validacion_duplicados.sql
USE imevi_sgd;

-- 2. Crear tabla de historial de anexos por duplicados (Missing)
CREATE TABLE IF NOT EXISTS expediente_anexos_historial (
    id INT NOT NULL AUTO_INCREMENT,
    id_expediente INT NOT NULL,
    id_documento INT NOT NULL,
    fecha_apertura_documento DATE NOT NULL 
        COMMENT 'Fecha de apertura del documento/historia anexado',
    campo_validacion_id INT NOT NULL 
        COMMENT 'Campo que generó la coincidencia',
    valor_coincidencia VARCHAR(255) NOT NULL 
        COMMENT 'Valor que coincidió (ej: cédula)',
    tipo_soporte ENUM('Físico', 'Electrónico') NOT NULL DEFAULT 'Electrónico',
    id_usuario_anexo INT NOT NULL,
    fecha_anexo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    PRIMARY KEY (id),
    INDEX idx_expediente (id_expediente),
    INDEX idx_documento (id_documento),
    INDEX idx_campo (campo_validacion_id),
    FOREIGN KEY (id_expediente) REFERENCES expedientes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_documento) REFERENCES documentos(id) ON DELETE CASCADE,
    FOREIGN KEY (campo_validacion_id) REFERENCES oficina_campos_personalizados(id),
    FOREIGN KEY (id_usuario_anexo) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
  COMMENT='Historial de documentos anexados por coincidencia de campos personalizados';

-- 3. Agregar índice para optimizar búsquedas de duplicados (Missing)
-- We use a stored procedure to safely add index if it doesn't exist to avoid errors
DROP PROCEDURE IF EXISTS AddIndexIfNotExists;
DELIMITER $$
CREATE PROCEDURE AddIndexIfNotExists()
BEGIN
    DECLARE indexCount INT;
    
    SELECT COUNT(*) INTO indexCount
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE()
      AND table_name = 'expediente_datos_personalizados' 
      AND index_name = 'idx_edp_campo_valor';
      
    IF indexCount = 0 THEN
        CREATE INDEX idx_edp_campo_valor ON expediente_datos_personalizados(id_campo, valor(100));
    END IF;
END $$
DELIMITER ;

CALL AddIndexIfNotExists();
DROP PROCEDURE IF EXISTS AddIndexIfNotExists;

-- Index for searching by name (commonly used in search bar)
CREATE INDEX idx_expedientes_nombre_expediente ON expedientes(nombre_expediente);

-- Index for filtering by status (used in status dropdown)
CREATE INDEX idx_expedientes_estado ON expedientes(estado);

-- Index for sorting by creation date (default sort order)
CREATE INDEX idx_expedientes_fecha_apertura ON expedientes(fecha_apertura DESC);
