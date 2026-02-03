-- Create indexes for searching and sorting expedientes
-- Date: 2026-02-03
-- Author: Antigravity

USE imevi_sgd;

-- Index for searching by name (commonly used in search bar)
CREATE INDEX idx_expedientes_nombre_expediente ON expedientes(nombre_expediente);

-- Index for filtering by status (used in status dropdown)
CREATE INDEX idx_expedientes_estado ON expedientes(estado);

-- Index for sorting by creation date (default sort order)
CREATE INDEX idx_expedientes_fecha_apertura ON expedientes(fecha_apertura DESC);

-- Composite index for filtering by series/subseries if needed for future optimization
-- CREATE INDEX idx_expedientes_serie_subserie ON expedientes(id_serie, id_subserie);
