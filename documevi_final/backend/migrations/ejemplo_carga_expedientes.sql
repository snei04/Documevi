-- =====================================================================
-- EJEMPLO DE EJECUCIÓN: Carga de Expedientes de Pacientes
-- Fecha: 2026-01-16
-- Base de datos: imevi_sgd
-- =====================================================================
-- ESTRUCTURA EXCEL:
-- | FILA | DEPENDENCIA | OFICINA | SERIE | SUBSERIE | NOMBRE_EXPEDIENTE | RADICADO | TIPO_SOPORTE | FECHA_EXPEDIENTE | FECHA_CIERRE | ESTADO | CEDULA | NOMBRE_PACIENTE | EPS |
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. DATOS MAESTROS
-- =====================================================================

-- Dependencias
INSERT IGNORE INTO dependencias (id, codigo_dependencia, nombre_dependencia, activo) VALUES
(1, '100', 'GERENCIA GENERAL', 1),
(2, '200', 'DIRECCION MEDICA', 1);

-- Oficinas
INSERT IGNORE INTO oficinas_productoras (id, id_dependencia, codigo_oficina, nombre_oficina, activo) VALUES
(1, 2, '201', 'HISTORIAS CLINICAS', 1);

-- Series
INSERT IGNORE INTO trd_series (id, id_oficina_productora, codigo_serie, nombre_serie, activo, requiere_subserie) VALUES
(1, 1, 'S1.1', 'HISTORIAS CLINICAS', 1, 1);

-- Subseries
INSERT IGNORE INTO trd_subseries (id, id_serie, codigo_subserie, nombre_subserie, activo) VALUES
(1, 1, 'SS1.1', 'HISTORIA CLINICA AMBULATORIA', 1);

-- Campos Personalizados
INSERT IGNORE INTO oficina_campos_personalizados (id, id_oficina, nombre_campo, tipo_campo, es_obligatorio, validar_duplicidad) VALUES
(1, 1, 'Cedula', 'texto', 1, 1),
(2, 1, 'Nombre Paciente', 'texto', 1, 0),
(3, 1, 'EPS', 'texto', 0, 0);

-- =====================================================================
-- 2. CARGAR EXPEDIENTES DE PACIENTES
-- =====================================================================
-- Nota: id_usuario_responsable = 5 (ajustar según su usuario admin)

-- FILA | NOMBRE_EXPEDIENTE | id_serie | id_subserie | descriptor_1 | descriptor_2 | fecha_apertura | fecha_cierre | estado | disponibilidad | id_usuario
INSERT INTO expedientes (id, nombre_expediente, id_serie, id_subserie, descriptor_1, descriptor_2, fecha_apertura, fecha_cierre, estado, disponibilidad, id_usuario_responsable) VALUES
(1, 'EXPEDIENTE CLINICO PACIENTE', 1, 1, 'EXP-001', NULL, '2024-01-15 08:00:00', NULL, 'En trámite', 'Disponible', 5),
(2, 'EXPEDIENTE CLINICO PACIENTE', 1, 1, 'EXP-002', NULL, '2024-01-20 09:30:00', NULL, 'En trámite', 'Disponible', 5),
(3, 'EXPEDIENTE CLINICO PACIENTE', 1, 1, 'EXP-003', NULL, '2024-02-05 10:15:00', '2024-06-15 12:00:00', 'Cerrado en Gestión', 'Disponible', 5);

-- =====================================================================
-- 3. CARGAR DOCUMENTOS RADICADOS
-- =====================================================================
-- NOTA: La tabla documentos NO tiene id_expediente directo.
-- La relación se hace mediante la tabla expediente_documentos

-- Columnas: id | radicado | asunto | tipo_soporte | id_oficina_productora | id_serie | id_subserie | remitente_nombre | id_usuario_radicador | fecha_radicado
INSERT INTO documentos (id, radicado, asunto, tipo_soporte, id_oficina_productora, id_serie, id_subserie, remitente_nombre, id_usuario_radicador, fecha_radicado) VALUES
(1, '20240115-0001', 'Documento ingreso paciente',    'Físico',       1, 1, 1, 'PACIENTE', 5, '2024-01-15 08:30:00'),
(2, '20240116-0001', 'Resultados laboratorio',        'Electrónico',  1, 1, 1, 'LABORATORIO', 5, '2024-01-16 14:00:00'),
(3, '20240120-0001', 'Historia clínica inicial',      'Físico',       1, 1, 1, 'PACIENTE', 5, '2024-01-20 09:45:00'),
(4, '20240615-0001', 'Epicrisis de egreso',           'Electrónico',  1, 1, 1, 'MEDICO', 5, '2024-06-15 12:00:00');

-- =====================================================================
-- 3.1 RELACIONAR DOCUMENTOS CON EXPEDIENTES
-- =====================================================================
-- Tabla: expediente_documentos (id_expediente, id_documento, orden_foliado, requiere_firma)

INSERT INTO expediente_documentos (id_expediente, id_documento, orden_foliado, requiere_firma) VALUES
(1, 1, 1, 0),  -- Documento 1 -> Expediente 1, folio 1
(1, 2, 2, 0),  -- Documento 2 -> Expediente 1, folio 2
(2, 3, 1, 0),  -- Documento 3 -> Expediente 2, folio 1
(3, 4, 1, 0);  -- Documento 4 -> Expediente 3, folio 1

-- =====================================================================
-- 4. CARGAR CAMPOS PERSONALIZADOS DE EXPEDIENTES
-- =====================================================================
-- CAMPOS: 1=Cédula, 2=Nombre Paciente, 3=EPS

-- id_expediente | id_campo | valor
INSERT INTO expediente_datos_personalizados (id_expediente, id_campo, valor) VALUES
-- Paciente 1
(1, 1, '19268326'),
(1, 2, 'JOSE ANTONIO RODRIGUEZ ALVAREZ'),




-- Paciente 2
(2, 1, '52345678'),
(2, 2, 'MARIA FERNANDA MARTINEZ LOPEZ'),


-- Paciente 3
(3, 1, '80123456'),
(3, 2, 'CARLOS ANDRES GONZALEZ PEREZ'),


-- =====================================================================
-- 5. REGISTRAR EN AUDITORÍA
-- =====================================================================

INSERT INTO auditoria (usuario_id, accion, detalles, fecha) VALUES
(5, 'MIGRACION_EXPEDIENTES', 'Carga de 3 expedientes de pacientes con 4 documentos y campos personalizados', NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 5. VERIFICAR CARGA
-- =====================================================================

-- Vista completa de expedientes con campos personalizados
SELECT 
    e.id AS FILA,
    d.codigo_dependencia AS DEPENDENCIA,
    o.codigo_oficina AS OFICINA,
    s.codigo_serie AS SERIE,
    ss.codigo_subserie AS SUBSERIE,
    e.nombre_expediente AS NOMBRE_EXPEDIENTE,
    e.descriptor_1 AS CODIGO_EXP,
    DATE(e.fecha_apertura) AS FECHA_APERTURA,
    DATE(e.fecha_cierre) AS FECHA_CIERRE,
    e.estado AS ESTADO,
    MAX(CASE WHEN cp.id = 1 THEN edp.valor END) AS CEDULA,
    MAX(CASE WHEN cp.id = 2 THEN edp.valor END) AS NOMBRE_PACIENTE,
    MAX(CASE WHEN cp.id = 3 THEN edp.valor END) AS EPS
FROM expedientes e
JOIN trd_series s ON e.id_serie = s.id
JOIN oficinas_productoras o ON s.id_oficina_productora = o.id
JOIN dependencias d ON o.id_dependencia = d.id
LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
LEFT JOIN expediente_datos_personalizados edp ON e.id = edp.id_expediente
LEFT JOIN oficina_campos_personalizados cp ON edp.id_campo = cp.id
GROUP BY e.id
ORDER BY e.id;

-- Ver documentos por expediente
SELECT 
    e.id AS EXPEDIENTE,
    doc.radicado AS RADICADO,
    doc.asunto AS ASUNTO,
    doc.tipo_soporte AS TIPO_SOPORTE,
    DATE(doc.fecha_radicado) AS FECHA
FROM documentos doc
JOIN expedientes e ON doc.id_expediente = e.id
ORDER BY e.id, doc.fecha_radicado;

SET FOREIGN_KEY_CHECKS = 0;

-- EJEMPLO DE CARGA PARA EL SQL --
INSERT INTO expedientes (id, nombre_expediente, id_serie, id_subserie, descriptor_1, descriptor_2, fecha_apertura, fecha_cierre, estado, disponibilidad, id_usuario_responsable) VALUES
(5, 'Historia clinica', 5, 8, 'EXP-001', NULL, '16-12-13 0:00:00', '16-12-13 0:00:00', 'Cerrado en Central', 'Disponible', 5);



INSERT INTO documentos (id, radicado, asunto, tipo_soporte, id_oficina_productora, id_serie, id_subserie, remitente_nombre, ubicacion_fisica, id_usuario_radicador, fecha_radicado) VALUES
(7, '20130114-0001', 'Documento ingreso paciente', 'Físico', 5, 5, 5, 'PACIENTE', 'Archivo Central - Estante 3 - Caja 15 - Carpeta 7', 5, '2013-12-16 00:00:00');


INSERT INTO expediente_documentos (id_expediente, id_documento, orden_foliado, requiere_firma, fecha_incorporacion) VALUES
(5, 7, 1, 0, '16-12-13 0:00');  -- Documento 1 -> Expediente 1, folio 1


INSERT INTO expediente_datos_personalizados (id_expediente, id_campo, valor) VALUES
(5, 3, '19268326'),
(5, 4, 'DIAZ VARGAS JOSE LUIS');


INSERT INTO auditoria (usuario_id, accion, detalles, fecha) VALUES
(5, 'MIGRACION_EXPEDIENTES', 'Carga de 1 expedientes de pacientes con 1 documentos y campos personalizados', NOW());

SET FOREIGN_KEY_CHECKS = 1;