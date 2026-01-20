-- =====================================================================
-- SCRIPT DE MIGRACIÓN: Expedientes de Pacientes
-- Fecha: 2026-01-14
-- Descripción: Definición de base de datos y template para migrar 
--              expedientes de pacientes con documentos y campos personalizados
-- =====================================================================

-- Desactivar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. DEFINIR BASE DE DATOS - CREATE TABLE STATEMENTS
-- =====================================================================

-- -----------------------------------------------------
-- Tabla: dependencias (Nivel jerárquico superior)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `dependencias` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo_dependencia` VARCHAR(20) NOT NULL,
  `nombre_dependencia` VARCHAR(255) NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_dependencia` (`codigo_dependencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: oficinas_productoras (Oficinas por dependencia)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `oficinas_productoras` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_dependencia` INT NOT NULL,
  `codigo_oficina` VARCHAR(20) NOT NULL,
  `nombre_oficina` VARCHAR(255) NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_oficina` (`codigo_oficina`),
  KEY `id_dependencia` (`id_dependencia`),
  CONSTRAINT `oficinas_productoras_ibfk_1` FOREIGN KEY (`id_dependencia`) REFERENCES `dependencias` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: trd_series (Series documentales por oficina)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `trd_series` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_oficina_productora` INT NOT NULL,
  `codigo_serie` VARCHAR(20) NOT NULL,
  `nombre_serie` VARCHAR(255) NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `requiere_subserie` TINYINT(1) NOT NULL DEFAULT 1,
  `retencion_gestion` INT DEFAULT NULL,
  `retencion_central` INT DEFAULT NULL,
  `disposicion_final` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_oficina_productora` (`id_oficina_productora`, `codigo_serie`),
  CONSTRAINT `trd_series_ibfk_1` FOREIGN KEY (`id_oficina_productora`) REFERENCES `oficinas_productoras` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: trd_subseries (Subseries por serie)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `trd_subseries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_serie` INT NOT NULL,
  `codigo_subserie` VARCHAR(20) NOT NULL,
  `nombre_subserie` VARCHAR(255) NOT NULL,
  `retencion_gestion` INT DEFAULT NULL,
  `retencion_central` INT DEFAULT NULL,
  `disposicion_final` ENUM('Conservación Total','Eliminación','Selección') DEFAULT NULL,
  `procedimientos` TEXT,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_serie` (`id_serie`, `codigo_subserie`),
  CONSTRAINT `trd_subseries_ibfk_1` FOREIGN KEY (`id_serie`) REFERENCES `trd_series` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: oficina_campos_personalizados (Campos dinámicos por oficina)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `oficina_campos_personalizados` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_oficina` INT NOT NULL,
  `nombre_campo` VARCHAR(100) NOT NULL,
  `tipo_campo` ENUM('texto','numero','fecha') NOT NULL DEFAULT 'texto',
  `es_obligatorio` TINYINT(1) NOT NULL DEFAULT 0,
  `validar_duplicidad` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Si es 1, valida que no exista otro expediente con el mismo valor',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_oficina` (`id_oficina`, `nombre_campo`),
  CONSTRAINT `oficina_campos_personalizados_ibfk_1` FOREIGN KEY (`id_oficina`) REFERENCES `oficinas_productoras` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: expedientes (Expedientes/Historias clínicas)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `expedientes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre_expediente` VARCHAR(255) NOT NULL,
  `id_serie` INT NOT NULL,
  `id_subserie` INT NOT NULL,
  `descriptor_1` VARCHAR(100) DEFAULT NULL,
  `descriptor_2` VARCHAR(100) DEFAULT NULL,
  `fecha_apertura` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cierre` TIMESTAMP NULL DEFAULT NULL,
  `estado` ENUM('En trámite','Cerrado en Gestión','Cerrado en Central') NOT NULL DEFAULT 'En trámite',
  `disponibilidad` ENUM('Disponible','Prestado','Extraviado') NOT NULL DEFAULT 'Disponible',
  `id_usuario_responsable` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_serie` (`id_serie`),
  KEY `id_subserie` (`id_subserie`),
  KEY `id_usuario_responsable` (`id_usuario_responsable`),
  CONSTRAINT `expedientes_ibfk_1` FOREIGN KEY (`id_serie`) REFERENCES `trd_series` (`id`),
  CONSTRAINT `expedientes_ibfk_2` FOREIGN KEY (`id_subserie`) REFERENCES `trd_subseries` (`id`),
  CONSTRAINT `expedientes_ibfk_3` FOREIGN KEY (`id_usuario_responsable`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: expediente_datos_personalizados (Valores de campos personalizados)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `expediente_datos_personalizados` (
  `id_expediente` INT NOT NULL,
  `id_campo` INT NOT NULL,
  `valor` TEXT NOT NULL,
  PRIMARY KEY (`id_expediente`, `id_campo`),
  KEY `id_campo` (`id_campo`),
  CONSTRAINT `expediente_datos_personalizados_ibfk_2` FOREIGN KEY (`id_campo`) REFERENCES `oficina_campos_personalizados` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expediente_datos_personalizados_ibfk_3` FOREIGN KEY (`id_expediente`) REFERENCES `expedientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: documentos (Documentos radicados físicos o electrónicos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `documentos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `radicado` VARCHAR(20) NOT NULL,
  `asunto` TEXT NOT NULL,
  `tipo_soporte` ENUM('Electrónico','Físico','Híbrido') NOT NULL DEFAULT 'Electrónico',
  `id_oficina_productora` INT NOT NULL,
  `id_serie` INT NOT NULL,
  `id_subserie` INT NOT NULL,
  `remitente_nombre` VARCHAR(255) NOT NULL,
  `remitente_identificacion` VARCHAR(30) DEFAULT NULL,
  `remitente_direccion` VARCHAR(255) DEFAULT NULL,
  `nombre_archivo_original` VARCHAR(255) DEFAULT NULL,
  `path_archivo` VARCHAR(255) DEFAULT NULL,
  `ubicacion_fisica` VARCHAR(255) DEFAULT NULL,
  `contenido_extraido` TEXT,
  `firma_imagen` LONGTEXT,
  `firma_hash` VARCHAR(255) DEFAULT NULL,
  `fecha_firma` DATETIME DEFAULT NULL,
  `id_usuario_radicador` INT NOT NULL,
  `fecha_radicado` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `radicado` (`radicado`),
  KEY `id_oficina_productora` (`id_oficina_productora`),
  KEY `id_serie` (`id_serie`),
  KEY `id_subserie` (`id_subserie`),
  KEY `id_usuario_radicador` (`id_usuario_radicador`),
  CONSTRAINT `documentos_ibfk_1` FOREIGN KEY (`id_oficina_productora`) REFERENCES `oficinas_productoras` (`id`),
  CONSTRAINT `documentos_ibfk_2` FOREIGN KEY (`id_serie`) REFERENCES `trd_series` (`id`),
  CONSTRAINT `documentos_ibfk_3` FOREIGN KEY (`id_subserie`) REFERENCES `trd_subseries` (`id`),
  CONSTRAINT `documentos_ibfk_4` FOREIGN KEY (`id_usuario_radicador`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: expediente_documentos (Relación expedientes-documentos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `expediente_documentos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_expediente` INT NOT NULL,
  `id_documento` INT NOT NULL,
  `orden_foliado` INT NOT NULL,
  `requiere_firma` TINYINT(1) NOT NULL DEFAULT 0,
  `fecha_incorporacion` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_expediente` (`id_expediente`, `id_documento`),
  KEY `id_documento` (`id_documento`),
  CONSTRAINT `expediente_documentos_ibfk_1` FOREIGN KEY (`id_expediente`) REFERENCES `expedientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expediente_documentos_ibfk_2` FOREIGN KEY (`id_documento`) REFERENCES `documentos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Tabla: documento_datos_personalizados (Campos personalizados de documentos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `documento_datos_personalizados` (
  `id_documento` INT NOT NULL,
  `id_campo` INT NOT NULL,
  `valor` TEXT NOT NULL,
  PRIMARY KEY (`id_documento`, `id_campo`),
  KEY `id_campo` (`id_campo`),
  CONSTRAINT `documento_datos_personalizados_ibfk_1` FOREIGN KEY (`id_documento`) REFERENCES `documentos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `documento_datos_personalizados_ibfk_2` FOREIGN KEY (`id_campo`) REFERENCES `oficina_campos_personalizados` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Índice para optimizar búsquedas de duplicados
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_edp_campo_valor ON expediente_datos_personalizados(id_campo, valor(100));

-- =====================================================================
-- 2. DATOS DE MIGRACIÓN - FORMATO TABULAR
-- =====================================================================
-- ESTRUCTURA DE DATOS (Copiar desde Excel/CSV):
-- =====================================================================
-- | FILA | COD_DEPENDENCIA | COD_OFICINA | COD_SERIE | COD_SUBSERIE | NOMBRE_EXPEDIENTE | RADICADO | TIPO_SOPORTE | FECHA_EXPEDIENTE | FECHA_CIERRE | ESTADO | CEDULA_PACIENTE | CAMPO_PERS_2 |
-- =====================================================================

-- =====================================================================
-- 2.1 INSERTAR DATOS MAESTROS (Dependencia, Oficina, Serie, Subserie)
-- =====================================================================

-- Dependencias
INSERT INTO dependencias (id, codigo_dependencia, nombre_dependencia, activo) VALUES
(1, '100', 'GERENCIA', 1),
(2, '200', 'DIRECCION MEDICA', 1);
-- AGREGAR MÁS DEPENDENCIAS AQUÍ...

-- Oficinas Productoras
INSERT INTO oficinas_productoras (id, id_dependencia, codigo_oficina, nombre_oficina, activo) VALUES
(1, 2, '201', 'HISTORIAS CLINICAS', 1),
(2, 2, '202', 'ARCHIVO CLINICO', 1);
-- AGREGAR MÁS OFICINAS AQUÍ...

-- Series Documentales
INSERT INTO trd_series (id, id_oficina_productora, codigo_serie, nombre_serie, activo, requiere_subserie) VALUES
(1, 1, 'S1', 'HISTORIAS CLINICAS', 1, 1);
-- AGREGAR MÁS SERIES AQUÍ...

-- Subseries Documentales
INSERT INTO trd_subseries (id, id_serie, codigo_subserie, nombre_subserie, activo) VALUES
(1, 1, 'SS1', 'HISTORIA CLINICA AMBULATORIA', 1),
(2, 1, 'SS2', 'HISTORIA CLINICA HOSPITALARIA', 1);
-- AGREGAR MÁS SUBSERIES AQUÍ...

-- Campos Personalizados (por oficina)
INSERT INTO oficina_campos_personalizados (id, id_oficina, nombre_campo, tipo_campo, es_obligatorio, validar_duplicidad) VALUES
(1, 1, 'Cédula Paciente', 'texto', 1, 1),
(2, 1, 'Nombre Paciente', 'texto', 1, 0),
(3, 1, 'Fecha Nacimiento', 'fecha', 0, 0);
-- AGREGAR MÁS CAMPOS PERSONALIZADOS AQUÍ...

-- =====================================================================
-- 2.2 INSERTAR EXPEDIENTES DE PACIENTES (FORMATO TABULAR)
-- =====================================================================
-- COLUMNAS: id | nombre_expediente | id_serie | id_subserie | descriptor_1 | descriptor_2 | fecha_apertura | fecha_cierre | estado | disponibilidad | id_usuario_responsable

INSERT INTO expedientes (id, nombre_expediente, id_serie, id_subserie, descriptor_1, descriptor_2, fecha_apertura, fecha_cierre, estado, disponibilidad, id_usuario_responsable) VALUES
-- FILA | NOMBRE_EXPEDIENTE                        | SERIE | SUBSERIE | DESCRIPTOR1    | DESCRIPTOR2 | FECHA_APERTURA        | FECHA_CIERRE | ESTADO        | DISPONIBILIDAD | USUARIO
(1,      'HC - RODRIGUEZ ALVAREZ JOSE',             1,      1,         'HC-2024-0001',  NULL,         '2024-01-15 08:00:00',  NULL,          'En trámite',  'Disponible',    5),
(2,      'HC - MARTINEZ LOPEZ MARIA',               1,      1,         'HC-2024-0002',  NULL,         '2024-02-20 10:30:00',  NULL,          'En trámite',  'Disponible',    5),
(3,      'HC - GOMEZ PEREZ CARLOS',                 1,      2,         'HC-2024-0003',  NULL,         '2024-03-10 14:00:00',  '2024-06-15',  'Cerrado en Gestión', 'Disponible', 5);
-- AGREGAR MÁS EXPEDIENTES AQUÍ...

-- =====================================================================
-- 2.3 INSERTAR DOCUMENTOS RADICADOS (FÍSICO O ELECTRÓNICO)
-- =====================================================================
-- COLUMNAS: id | id_expediente | radicado | asunto | tipo_soporte | fecha_radicado | id_serie | id_subserie | id_usuario_radicador | estado

INSERT INTO documentos (id, id_expediente, radicado, asunto, tipo_soporte, fecha_radicado, id_serie, id_subserie, id_usuario_radicador, estado) VALUES
-- FILA | EXPEDIENTE | RADICADO         | ASUNTO                              | SOPORTE       | FECHA_RADICADO        | SERIE | SUBSERIE | USUARIO | ESTADO
(1,      1,           'RAD-2024-00001',  'Documento de ingreso paciente',      'Físico',       '2024-01-15 08:30:00',  1,      1,         5,        'Radicado'),
(2,      1,           'RAD-2024-00002',  'Resultados laboratorio',             'Electrónico',  '2024-01-16 14:00:00',  1,      1,         5,        'Radicado'),
(3,      2,           'RAD-2024-00003',  'Historia clínica inicial',           'Físico',       '2024-02-20 11:00:00',  1,      1,         5,        'Radicado'),
(4,      3,           'RAD-2024-00004',  'Epicrisis hospitalaria',             'Electrónico',  '2024-03-10 15:00:00',  1,      2,         5,        'Radicado');
-- AGREGAR MÁS DOCUMENTOS AQUÍ...

-- =====================================================================
-- 2.4 INSERTAR CAMPOS PERSONALIZADOS DE EXPEDIENTES
-- =====================================================================
-- COLUMNAS: id_expediente | id_campo | valor
-- CAMPOS: 1=Cédula Paciente, 2=Nombre Paciente, 3=Fecha Nacimiento

INSERT INTO expediente_datos_personalizados (id_expediente, id_campo, valor) VALUES
-- EXPEDIENTE | CAMPO | VALOR
(1,            1,      '19268326'),           -- Cédula paciente 1
(1,            2,      'JOSE RODRIGUEZ ALVAREZ'),  -- Nombre paciente 1
(1,            3,      '1985-03-15'),         -- Fecha nacimiento paciente 1
(2,            1,      '52345678'),           -- Cédula paciente 2
(2,            2,      'MARIA MARTINEZ LOPEZ'),    -- Nombre paciente 2
(2,            3,      '1990-07-22'),         -- Fecha nacimiento paciente 2
(3,            1,      '80123456'),           -- Cédula paciente 3
(3,            2,      'CARLOS GOMEZ PEREZ'),      -- Nombre paciente 3
(3,            3,      '1978-11-08');         -- Fecha nacimiento paciente 3
-- AGREGAR MÁS CAMPOS PERSONALIZADOS AQUÍ...

-- =====================================================================
-- 2.5 INSERTAR CAMPOS PERSONALIZADOS DE DOCUMENTOS (OPCIONAL)
-- =====================================================================

-- INSERT INTO documento_datos_personalizados (id_documento, id_campo, valor) VALUES
-- (1, 1, 'VALOR');
-- AGREGAR SI ES NECESARIO...

-- =====================================================================
-- 2.6 REGISTRAR EN AUDITORÍA
-- =====================================================================

INSERT INTO auditoria (usuario_id, accion, detalles, fecha) VALUES
(5, 'MIGRACION_EXPEDIENTES', 'Migración masiva de expedientes de pacientes desde sistema anterior', NOW());

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 3. VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================================

-- Vista completa de expedientes con campos personalizados
SELECT 
    e.id AS ID_EXPEDIENTE,
    d.codigo_dependencia AS COD_DEPENDENCIA,
    o.codigo_oficina AS COD_OFICINA,
    s.codigo_serie AS COD_SERIE,
    ss.codigo_subserie AS COD_SUBSERIE,
    e.nombre_expediente AS NOMBRE_EXPEDIENTE,
    e.descriptor_1 AS NUM_HISTORIA,
    e.fecha_apertura AS FECHA_APERTURA,
    e.fecha_cierre AS FECHA_CIERRE,
    e.estado AS ESTADO,
    MAX(CASE WHEN cp.nombre_campo = 'Cédula Paciente' THEN edp.valor END) AS CEDULA_PACIENTE,
    MAX(CASE WHEN cp.nombre_campo = 'Nombre Paciente' THEN edp.valor END) AS NOMBRE_PACIENTE
FROM expedientes e
JOIN trd_series s ON e.id_serie = s.id
JOIN oficinas_productoras o ON s.id_oficina_productora = o.id
JOIN dependencias d ON o.id_dependencia = d.id
LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
LEFT JOIN expediente_datos_personalizados edp ON e.id = edp.id_expediente
LEFT JOIN oficina_campos_personalizados cp ON edp.id_campo = cp.id
GROUP BY e.id
ORDER BY e.id;

-- Verificar documentos por expediente
SELECT 
    e.nombre_expediente,
    doc.radicado,
    doc.asunto,
    doc.tipo_soporte,
    doc.fecha_radicado
FROM documentos doc
JOIN expedientes e ON doc.id_expediente = e.id
ORDER BY e.id, doc.fecha_radicado;
