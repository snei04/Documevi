-- ============================================================
-- MIGRACIÓN: Validación de Duplicados en Campos Personalizados
-- Fecha: 2026-01-14
-- Descripción: Agrega funcionalidad para validar duplicados en expedientes
--              basándose en campos personalizados marcados para validación
-- ============================================================

-- 1. Agregar columna validar_duplicidad a oficina_campos_personalizados
ALTER TABLE oficina_campos_personalizados 
ADD COLUMN validar_duplicidad TINYINT(1) NOT NULL DEFAULT 0 
    COMMENT 'Si es 1, valida que no exista otro expediente con el mismo valor en la oficina';

-- 2. Crear tabla de historial de anexos por duplicados
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

-- 3. Agregar índice para optimizar búsquedas de duplicados
CREATE INDEX idx_edp_campo_valor ON expediente_datos_personalizados(id_campo, valor(100));
