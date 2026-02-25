-- Script de Migración a Producción v1.3.3 - Documevi SGDEA
-- Fecha: 2026-02-11
-- Descripción: Script consolidado con todos los cambios de base de datos para el release v1.3.3

-- Configuración inicial
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================================
-- 1. Optimización y Validación de Duplicados
-- ==========================================================

-- Agregar columna validar_duplicidad a oficina_campos_personalizados si no existe
-- (Se asume existencia de tabla oficina_campos_personalizados)
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DELIMITER $$
CREATE PROCEDURE AddColumnIfNotExists()
BEGIN
    DECLARE colCount INT;
    SELECT COUNT(*) INTO colCount FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'oficina_campos_personalizados' AND column_name = 'validar_duplicidad';
    IF colCount = 0 THEN
        ALTER TABLE oficina_campos_personalizados ADD COLUMN validar_duplicidad TINYINT(1) NOT NULL DEFAULT 0;
    END IF;
END $$
DELIMITER ;
CALL AddColumnIfNotExists();
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- Crear tabla de historial de anexos por duplicados
CREATE TABLE IF NOT EXISTS expediente_anexos_historial (
    id INT NOT NULL AUTO_INCREMENT,
    id_expediente INT NOT NULL,
    id_documento INT NOT NULL,
    fecha_apertura_documento DATE NOT NULL COMMENT 'Fecha de apertura del documento/historia anexado',
    campo_validacion_id INT NOT NULL COMMENT 'Campo que generó la coincidencia',
    valor_coincidencia VARCHAR(255) NOT NULL COMMENT 'Valor que coincidió (ej: cédula)',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de documentos anexados por coincidencia de campos personalizados';

-- Agregar índice para optimizar búsquedas de duplicados
-- (Logic handles if index already exists)
DROP PROCEDURE IF EXISTS AddIndexIfNotExists;
DELIMITER $$
CREATE PROCEDURE AddIndexIfNotExists()
BEGIN
    DECLARE indexCount INT;
    SELECT COUNT(*) INTO indexCount FROM information_schema.statistics 
    WHERE table_schema = DATABASE() AND table_name = 'expediente_datos_personalizados' AND index_name = 'idx_edp_campo_valor';
    IF indexCount = 0 THEN
        CREATE INDEX idx_edp_campo_valor ON expediente_datos_personalizados(id_campo, valor(100));
    END IF;
END $$
DELIMITER ;
CALL AddIndexIfNotExists();
DROP PROCEDURE IF EXISTS AddIndexIfNotExists;


-- ==========================================================
-- 2. Sistema de Carpetas (Base)
-- ==========================================================

CREATE TABLE IF NOT EXISTS `carpetas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_oficina` int NOT NULL,
  `año` int NOT NULL,
  `consecutivo` int NOT NULL,
  `codigo_carpeta` varchar(50) NOT NULL,
  `descripcion` text,
  `cantidad_actual` int NOT NULL DEFAULT 0,
  `capacidad_maxima` int NOT NULL DEFAULT 200,
  `estado` enum('Abierta', 'Cerrada') NOT NULL DEFAULT 'Abierta',
  `ubicacion_fisica_detalle` text,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_carpeta` (`codigo_carpeta`),
  UNIQUE KEY `consecutivo_oficina_año` (`id_oficina`, `año`, `consecutivo`),
  KEY `id_oficina` (`id_oficina`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agregar columnas de ubicación física a carpetas
DROP PROCEDURE IF EXISTS AddCarpetaCols;
DELIMITER $$
CREATE PROCEDURE AddCarpetaCols()
BEGIN
    DECLARE colCount INT;
    SELECT COUNT(*) INTO colCount FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'carpetas' AND column_name = 'paquete';
    IF colCount = 0 THEN
        ALTER TABLE carpetas
        ADD COLUMN paquete VARCHAR(50) DEFAULT NULL,
        ADD COLUMN tomo VARCHAR(50) DEFAULT NULL,
        ADD COLUMN modulo VARCHAR(50) DEFAULT NULL,
        ADD COLUMN entrepaño VARCHAR(50) DEFAULT NULL,
        ADD COLUMN estante VARCHAR(50) DEFAULT NULL,
        ADD COLUMN otro VARCHAR(255) DEFAULT NULL;
    END IF;
END $$
DELIMITER ;
CALL AddCarpetaCols();
END $$
DELIMITER ;
CALL AddCarpetaCols();
DROP PROCEDURE IF EXISTS AddCarpetaCols;

-- Agregar columna id_carpeta a documentos
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


-- ==========================================================
-- 3. Vinculación Expediente -> Carpeta (1:1)
-- ==========================================================

-- Agregar columna id_expediente a carpetas
DROP PROCEDURE IF EXISTS AddIdExpedienteToCarpetas;
DELIMITER $$
CREATE PROCEDURE AddIdExpedienteToCarpetas()
BEGIN
    DECLARE colCount INT;
    SELECT COUNT(*) INTO colCount FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'carpetas' AND column_name = 'id_expediente';
    IF colCount = 0 THEN
        ALTER TABLE `carpetas`
        ADD COLUMN `id_expediente` INT DEFAULT NULL,
        ADD KEY `id_expediente` (`id_expediente`),
        ADD CONSTRAINT `carpetas_ibfk_2` FOREIGN KEY (`id_expediente`) REFERENCES `expedientes` (`id`) ON DELETE SET NULL;
    END IF;
END $$
DELIMITER ;
CALL AddIdExpedienteToCarpetas();
DROP PROCEDURE IF EXISTS AddIdExpedienteToCarpetas;

-- Garantizar Unique Constraint 1:1
DROP PROCEDURE IF EXISTS AddUniqueConstraint;
DELIMITER $$
CREATE PROCEDURE AddUniqueConstraint()
BEGIN
    DECLARE keyCount INT;
    SELECT COUNT(*) INTO keyCount FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'carpetas' AND index_name = 'uk_carpeta_expediente';
    IF keyCount = 0 THEN
        ALTER TABLE carpetas ADD UNIQUE KEY uk_carpeta_expediente (id_expediente);
    END IF;
END $$
DELIMITER ;
CALL AddUniqueConstraint();
DROP PROCEDURE IF EXISTS AddUniqueConstraint;

-- Crear carpetas retroactivas para expedientes existentes
INSERT IGNORE INTO carpetas (id_oficina, año, consecutivo, codigo_carpeta, descripcion, id_expediente)
SELECT 
    s.id_oficina_productora,
    YEAR(e.fecha_apertura),
    (SELECT COALESCE(MAX(c2.consecutivo), 0) + 1 
     FROM carpetas c2 
     WHERE c2.id_oficina = s.id_oficina_productora AND c2.año = YEAR(e.fecha_apertura)),
    CONCAT('OFC-', s.id_oficina_productora, '-', YEAR(e.fecha_apertura), '-', 
           LPAD((SELECT COALESCE(MAX(c3.consecutivo), 0) + 1 
                 FROM carpetas c3 
                 WHERE c3.id_oficina = s.id_oficina_productora AND c3.año = YEAR(e.fecha_apertura)), 3, '0')),
    CONCAT('Carpeta del expediente ', e.nombre_expediente),
    e.id
FROM expedientes e
JOIN trd_series s ON e.id_serie = s.id
LEFT JOIN carpetas c ON c.id_expediente = e.id
WHERE c.id IS NULL;


-- ==========================================================
-- 4. Sistema de Paquetes
-- ==========================================================

CREATE TABLE IF NOT EXISTS paquetes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  numero_paquete VARCHAR(50) NOT NULL UNIQUE,
  id_oficina INT NULL, -- NULL para paquetes globales
  estado ENUM('Activo', 'Lleno', 'Cerrado') DEFAULT 'Activo',
  expedientes_actuales INT DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre TIMESTAMP NULL,
  observaciones TEXT,
  FOREIGN KEY (id_oficina) REFERENCES oficinas_productoras(id) ON DELETE CASCADE,
  KEY idx_paquete_oficina_estado (id_oficina, estado)
);

-- Vincular expedientes a paquetes
DROP PROCEDURE IF EXISTS AddIdPaqueteToExpedientes;
DELIMITER $$
CREATE PROCEDURE AddIdPaqueteToExpedientes()
BEGIN
    DECLARE colCount INT;
    SELECT COUNT(*) INTO colCount FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'expedientes' AND column_name = 'id_paquete';
    IF colCount = 0 THEN
        ALTER TABLE expedientes ADD COLUMN id_paquete INT DEFAULT NULL;
        ALTER TABLE expedientes ADD KEY idx_expediente_paquete (id_paquete);
        ALTER TABLE expedientes ADD CONSTRAINT fk_expediente_paquete FOREIGN KEY (id_paquete) REFERENCES paquetes(id) ON DELETE SET NULL;
    END IF;
END $$
DELIMITER ;
CALL AddIdPaqueteToExpedientes();
DROP PROCEDURE IF EXISTS AddIdPaqueteToExpedientes;


-- ==========================================================
-- 5. Campos de Remitente Opcionales
-- ==========================================================

ALTER TABLE documentos MODIFY COLUMN remitente_nombre VARCHAR(255) NULL;
ALTER TABLE documentos MODIFY COLUMN remitente_identificacion VARCHAR(50) NULL;
ALTER TABLE documentos MODIFY COLUMN remitente_direccion VARCHAR(255) NULL;


-- ==========================================================
-- 6. Optimización de Retención Documental
-- ==========================================================

-- Modificar ENUM de estado
ALTER TABLE expedientes 
  MODIFY COLUMN estado ENUM(
    'En trámite', 
    'Cerrado en Gestión', 
    'Cerrado en Central', 
    'Histórico', 
    'Eliminable'
  ) NOT NULL DEFAULT 'En trámite';

-- Nuevas columnas de retención
DROP PROCEDURE IF EXISTS AddRetencionCols;
DELIMITER $$
CREATE PROCEDURE AddRetencionCols()
BEGIN
    DECLARE colCount INT;
    SELECT COUNT(*) INTO colCount FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'expedientes' AND column_name = 'fase_retencion';
    IF colCount = 0 THEN
        ALTER TABLE expedientes
          ADD COLUMN fecha_primer_documento TIMESTAMP NULL AFTER fecha_cierre,
          ADD COLUMN fecha_inicio_retencion TIMESTAMP NULL AFTER fecha_primer_documento,
          ADD COLUMN fecha_fin_gestion DATE NULL AFTER fecha_inicio_retencion,
          ADD COLUMN fecha_fin_central DATE NULL AFTER fecha_fin_gestion,
          ADD COLUMN fase_retencion ENUM(
            'Vigente', 'En Gestión', 'En Central', 'Histórico', 'Eliminable'
          ) DEFAULT 'Vigente' AFTER fecha_fin_central;
    END IF;
END $$
DELIMITER ;
CALL AddRetencionCols();
DROP PROCEDURE IF EXISTS AddRetencionCols;

-- Tabla de alertas de retención
CREATE TABLE IF NOT EXISTS retencion_alertas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_expediente INT NOT NULL,
  tipo_alerta ENUM('Próximo a Gestión', 'Próximo a Central', 'Próximo a Disposición') NOT NULL,
  fecha_alerta DATE NOT NULL,
  fecha_limite DATE NOT NULL,
  leida TINYINT(1) DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_expediente) REFERENCES expedientes(id) ON DELETE CASCADE,
  UNIQUE KEY uk_alerta_expediente_tipo (id_expediente, tipo_alerta)
);

-- Índices de retención
DROP PROCEDURE IF EXISTS AddRetencionIndexes;
DELIMITER $$
CREATE PROCEDURE AddRetencionIndexes()
BEGIN
    DECLARE idxCount INT;
    SELECT COUNT(*) INTO idxCount FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'expedientes' AND index_name = 'idx_expedientes_fase';
    IF idxCount = 0 THEN
        CREATE INDEX idx_expedientes_fase ON expedientes(fase_retencion);
        CREATE INDEX idx_expedientes_fin_gestion ON expedientes(fecha_fin_gestion);
        CREATE INDEX idx_expedientes_fin_central ON expedientes(fecha_fin_central);
    END IF;
END $$
DELIMITER ;
CALL AddRetencionIndexes();
DROP PROCEDURE IF EXISTS AddRetencionIndexes;

-- Actualizar datos históricos de retención (Lógica de negocio)
UPDATE expedientes e 
SET fecha_primer_documento = (
  SELECT MIN(d.fecha_radicado) 
  FROM expediente_documentos ed 
  JOIN documentos d ON ed.id_documento = d.id 
  WHERE ed.id_expediente = e.id
)
WHERE e.fecha_primer_documento IS NULL;

UPDATE expedientes 
SET fecha_inicio_retencion = COALESCE(fecha_cierre, fecha_primer_documento, fecha_apertura)
WHERE fecha_inicio_retencion IS NULL;


-- ==========================================================
-- 7. Actualización de Permisos
-- ==========================================================

-- Asegurar permiso documentos_editar
INSERT IGNORE INTO permisos (nombre_permiso, descripcion) VALUES ('documentos_editar', 'Permite editar metadatos y ubicación de documentos.');

-- Deprecar documentos_crear
UPDATE permisos 
SET descripcion = '[DEPRECADO v1.3.3] Usar expedientes_crear para crear expedientes y documentos.'
WHERE nombre_permiso = 'documentos_crear';

SET FOREIGN_KEY_CHECKS = 1;
-- Fin del Script
