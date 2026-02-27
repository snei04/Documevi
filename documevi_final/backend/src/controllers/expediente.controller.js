const pool = require('../config/db');
// Importamos el nuevo servicio para la lógica de negocio compleja
const expedienteService = require('../services/expediente.service');
const documentoService = require('../services/documento.service');
const validacionDuplicadosService = require('../services/validacionDuplicados.service');

// --- CONTROLADORES CON LÓGICA SIMPLE ---

/**
 * Obtiene todos los expedientes con información enriquecida.
 * Para auditores: solo expedientes cerrados y habilitados
 */
/**
 * Obtiene todos los expedientes con información enriquecida (Paginado).
 * Para auditores: solo expedientes cerrados y habilitados
 */
exports.getAllExpedientes = async (req, res) => {
    try {
        // Parametros de paginacion y filtros
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const estadoFilter = req.query.estado || '';
        const serieFilter = req.query.serie || '';

        const fechaInicio = req.query.fecha_inicio;
        const fechaFin = req.query.fecha_fin;
        const customFieldSearch = req.query.custom_search || '';

        // Verificar si el usuario es auditor (tiene permisos limitados)
        const userPermissions = req.user.permissions || [];
        const isAuditor = userPermissions.includes('auditoria_ver') &&
            !userPermissions.includes('expedientes_crear') &&
            !userPermissions.includes('expedientes_editar');

        // Construccion de condiciones WHERE
        let whereConditions = [];
        let queryParams = [];

        // Filtro de busqueda (nombre, descriptors)
        if (search) {
            whereConditions.push(`(
                e.nombre_expediente LIKE ? OR 
                e.descriptor_1 LIKE ? OR 
                e.descriptor_2 LIKE ?
            )`);
            const searchParam = `%${search}%`;
            queryParams.push(searchParam, searchParam, searchParam);
        }

        // Filtro por rango de fechas
        if (fechaInicio) {
            whereConditions.push(`e.fecha_apertura >= ?`);
            queryParams.push(fechaInicio);
        }
        if (fechaFin) {
            whereConditions.push(`e.fecha_apertura <= ?`);
            queryParams.push(fechaFin);
        }

        // Filtro por valor en campos personalizados (búsqueda general en todos los campos)
        if (customFieldSearch) {
            whereConditions.push(`EXISTS (
                SELECT 1 FROM expediente_datos_personalizados edp 
                WHERE edp.id_expediente = e.id AND edp.valor LIKE ?
            )`);
            queryParams.push(`%${customFieldSearch}%`);
        }

        // Filtros especificos
        if (estadoFilter) {
            whereConditions.push(`e.estado = ?`);
            queryParams.push(estadoFilter);
        }

        if (serieFilter) {
            whereConditions.push(`e.id_serie = ?`);
            queryParams.push(serieFilter);
        }

        // Si es auditor, filtrar solo expedientes cerrados y habilitados
        if (isAuditor) {
            whereConditions.push(`e.estado = 'cerrado'`);
            whereConditions.push(`e.activo = 1`);
        }

        // Armar clausula WHERE
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Query principal de datos
        let dataQuery = `
            SELECT 
                e.*, 
                s.nombre_serie, 
                ss.nombre_subserie,
                u.nombre_completo as nombre_responsable,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'nombre_campo', ocp.nombre_campo, 
                            'valor', edp.valor
                        )
                    )
                    FROM expediente_datos_personalizados edp
                    JOIN oficina_campos_personalizados ocp ON edp.id_campo = ocp.id
                    WHERE edp.id_expediente = e.id
                ) as datos_personalizados
            FROM expedientes e
            LEFT JOIN trd_series s ON e.id_serie = s.id
            LEFT JOIN trd_subseries ss ON e.id_subserie = ss.id
            LEFT JOIN usuarios u ON e.id_usuario_responsable = u.id
            ${whereClause}
            ORDER BY e.fecha_apertura DESC
            LIMIT ? OFFSET ?
        `;

        // Query para contar total de registros (para paginacion)
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM expedientes e 
            ${whereClause}
        `;

        // Ejecutar queries en paralelo
        // Spread ...queryParams para el count, y ...queryParams + limit + offset para data
        const [rows] = await pool.query(dataQuery, [...queryParams, limit, offset]);
        const [countResult] = await pool.query(countQuery, queryParams);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: rows,
            meta: {
                total,
                page,
                limit,
                totalPages
            }
        });
    } catch (error) {
        console.error("Error en getAllExpedientes:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Crea un nuevo expediente.
 */
exports.createExpediente = async (req, res) => {
    const { nombre_expediente, id_serie, id_subserie, descriptor_1, descriptor_2 } = req.body;
    const id_usuario_responsable = req.user.id;

    if (!nombre_expediente || !id_serie || !id_subserie) {
        return res.status(400).json({ msg: 'Nombre, serie y subserie son obligatorios.' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO expedientes (nombre_expediente, id_serie, id_subserie, descriptor_1, descriptor_2, id_usuario_responsable) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre_expediente, id_serie, id_subserie, descriptor_1, descriptor_2, id_usuario_responsable]
        );

        // Auto-asignar paquete activo de la oficina
        try {
            const paqueteService = require('../services/paquete.service');
            const [serie] = await pool.query('SELECT id_oficina_productora FROM trd_series WHERE id = ?', [id_serie]);
            if (serie.length > 0 && serie[0].id_oficina_productora) {
                const paquete = await paqueteService.obtenerPaqueteActivo(serie[0].id_oficina_productora);
                if (paquete) {
                    await pool.query('UPDATE expedientes SET id_paquete = ? WHERE id = ?', [paquete.id, result.insertId]);
                    await pool.query('UPDATE paquetes SET expedientes_actuales = expedientes_actuales + 1 WHERE id = ?', [paquete.id]);
                }
            }
        } catch (paqErr) {
            console.error('Error auto-asignando paquete:', paqErr.message);
        }

        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error("Error al crear expediente:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Crea un expediente con el flujo optimizado de 3 pasos.
 * POST /api/expedientes/crear-completo
 * Acepta JSON o multipart/form-data (cuando incluye documento con archivo)
 */
exports.crearExpedienteCompleto = async (req, res) => {
    try {
        // Detectar formato: multipart (con documento) o JSON (sin documento)
        let data;
        const archivo = req.file || null;

        if (req.body.data) {
            // Multipart: los datos vienen como JSON string en req.body.data
            data = JSON.parse(req.body.data);
        } else {
            // JSON directo
            data = req.body;
        }

        const userId = req.user.id;

        // Validaciones básicas
        if (!data.expediente || !data.expediente.id_serie) {
            return res.status(400).json({ msg: 'La serie es obligatoria.' });
        }

        if (!data.expediente.tipo_soporte) {
            return res.status(400).json({ msg: 'El tipo de soporte es obligatorio.' });
        }

        const resultado = await expedienteService.crearExpedienteCompleto(data, userId, archivo);

        res.status(201).json(resultado);
    } catch (error) {
        console.error("Error en crearExpedienteCompleto:", error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({ msg: error.message });
        }

        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Obtiene un expediente por ID con lógica de permisos.
 */
exports.getExpedienteById = async (req, res) => {
    const { id: id_expediente } = req.params;
    const { id: id_usuario_actual, permissions: permisos_usuario = [] } = req.user;

    try {
        const [expedientes] = await pool.query(`
            SELECT e.*, s.id_oficina_productora,
                   p.numero_paquete, p.estado as estado_paquete,
                   c.codigo_carpeta, c.descripcion as descripcion_carpeta
            FROM expedientes e
            LEFT JOIN trd_series s ON e.id_serie = s.id
            LEFT JOIN paquetes p ON e.id_paquete = p.id
            LEFT JOIN carpetas c ON c.id_expediente = e.id
            WHERE e.id = ?
        `, [id_expediente]);
        if (expedientes.length === 0) {
            return res.status(404).json({ msg: 'Expediente no encontrado.' });
        }

        const expediente = expedientes[0];
        const esProductor = expediente.id_usuario_responsable === id_usuario_actual ||
            permisos_usuario.includes('expedientes_editar') ||
            permisos_usuario.includes('documentos_editar');
        const tienePermisoEspecial = permisos_usuario.includes('ver_expedientes_cerrados');

        // Verificar si es auditor
        const isAuditor = permisos_usuario.includes('auditoria_ver') &&
            !permisos_usuario.includes('expedientes_crear') &&
            !permisos_usuario.includes('expedientes_editar');

        // Si es auditor, solo puede ver expedientes cerrados y habilitados
        if (isAuditor && (expediente.estado !== 'cerrado' || expediente.activo !== 1)) {
            return res.status(403).json({ msg: 'Los auditores solo pueden ver expedientes cerrados y habilitados.' });
        }

        const sqlDocumentos = `
            SELECT d.*, ed.orden_foliado, ed.fecha_incorporacion, ed.requiere_firma
            FROM expediente_documentos ed
            LEFT JOIN documentos d ON ed.id_documento = d.id 
            WHERE ed.id_expediente = ? 
            ORDER BY ed.orden_foliado ASC
        `;

        if (esProductor || tienePermisoEspecial || isAuditor) {
            const [documentos] = await pool.query(sqlDocumentos, [id_expediente]);
            let vista = 'auditor';
            if (esProductor) vista = 'productor';
            else if (isAuditor) vista = 'auditor_readonly';

            return res.json({ ...expediente, documentos: documentos, vista: vista });
        }

        const [prestamos] = await pool.query(
            "SELECT * FROM prestamos WHERE id_expediente = ? AND id_usuario_solicitante = ? AND estado = 'Prestado' AND fecha_devolucion_prevista >= CURDATE()",
            [id_expediente, id_usuario_actual]
        );

        if (prestamos.length > 0) {
            const [documentos] = await pool.query(sqlDocumentos, [id_expediente]);
            res.json({ ...expediente, documentos: documentos, vista: 'solicitante_prestamo' });
        } else {
            res.json({
                nombre_expediente: expediente.nombre_expediente,
                fecha_apertura: expediente.fecha_apertura,
                estado: expediente.estado,
                vista: 'solicitante_restringido'
            });
        }
    } catch (error) {
        console.error("Error al obtener el expediente:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Añade un documento a un expediente con foliado automático.
 */
exports.addDocumentoToExpediente = async (req, res) => {
    const { id_expediente } = req.params;
    const { id_documento, requiere_firma } = req.body;

    if (!id_documento) {
        return res.status(400).json({ msg: 'El ID del documento es obligatorio.' });
    }
    try {
        // Verificar estado del expediente
        const [expediente] = await pool.query(
            'SELECT id, estado, tipo_soporte, nombre_expediente, id_paquete FROM expedientes WHERE id = ?',
            [id_expediente]
        );

        if (expediente.length === 0) {
            return res.status(404).json({ msg: 'Expediente no encontrado.' });
        }

        const estadoExp = expediente[0].estado;
        const soporteExp = expediente[0].tipo_soporte || 'Electrónico';
        const esCerrado = estadoExp === 'Cerrado en Gestión' || estadoExp === 'Cerrado en Central';

        // Expedientes electrónicos cerrados NO permiten anexar
        if (esCerrado && soporteExp !== 'Físico') {
            return res.status(400).json({ msg: 'No se pueden agregar documentos a expedientes electrónicos cerrados.' });
        }

        const [folioRows] = await pool.query('SELECT MAX(orden_foliado) as max_folio FROM expediente_documentos WHERE id_expediente = ?', [id_expediente]);
        const nuevoFolio = (folioRows[0].max_folio || 0) + 1;

        await pool.query(
            'INSERT INTO expediente_documentos (id_expediente, id_documento, orden_foliado, requiere_firma) VALUES (?, ?, ?, ?)',
            [id_expediente, id_documento, nuevoFolio, requiere_firma || false]
        );

        // Auditoría especial si se anexó a un expediente cerrado (solo físico)
        if (esCerrado) {
            await pool.query(
                'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES (?, ?, ?)',
                [req.user.id, 'ANEXO_EXPEDIENTE_CERRADO',
                `Documento ${id_documento} agregado al expediente CERRADO ${id_expediente} (${expediente[0].nombre_expediente}). Estado: ${estadoExp}. Soporte: ${soporteExp}.`]
            );
        }

        res.status(201).json({ msg: 'Documento añadido con éxito.', orden_foliado: nuevoFolio });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'Este documento ya existe en el expediente.' });
        }
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Obtiene los datos personalizados de un expediente.
 */
exports.getExpedienteCustomData = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT id_campo, valor FROM expediente_datos_personalizados WHERE id_expediente = ?', [id]);
        const data = rows.reduce((acc, row) => {
            acc[row.id_campo] = row.valor;
            return acc;
        }, {});
        res.json(data);
    } catch (error) {
        console.error("Error al obtener datos personalizados:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// --- CONTROLADORES QUE USAN EL SERVICIO ---

/**
 * Cierra un expediente.
 */
exports.closeExpediente = async (req, res) => {
    try {
        const resultado = await expedienteService.cerrarExpediente(req.params.id, req.user.id);
        res.json(resultado);
    } catch (error) {
        console.error("Error al cerrar el expediente:", error);
        res.status(error.statusCode || 500).json({ msg: error.message });
    }
};

/**
 * Guarda o actualiza los datos personalizados de un expediente.
 */
exports.updateExpedienteCustomData = async (req, res) => {
    try {
        const resultado = await expedienteService.guardarDatosPersonalizados(req.params.id, req.body);
        res.json(resultado);
    } catch (error) {
        console.error("Error al guardar datos personalizados:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

/**
 * Crea un documento desde una plantilla.
 */
exports.createDocumentoFromPlantilla = async (req, res) => {
    try {
        const resultado = await documentoService.generarDocumentoDesdePlantilla(req.body, req.user.id);
        res.status(201).json(resultado);
    } catch (error) {
        console.error("Error al generar documento desde plantilla:", error);
        res.status(error.statusCode || 500).json({ msg: error.message });
    }
};

exports.createDocumentoFromPlantillaInExpediente = async (req, res) => {
    const { id: expedienteId } = req.params;
    try {
        const resultado = await expedienteService.generarYAnadirDocumentoAExpediente(
            expedienteId,
            req.body,
            req.user.id
        );
        res.status(201).json(resultado);
    } catch (error) {
        console.error("Error al generar y añadir documento desde plantilla:", error);
        res.status(error.statusCode || 500).json({ msg: error.message });
    }
};

/**
 * Valida duplicados antes de crear un expediente.
 * POST /api/expedientes/validar-duplicados
 */
exports.validarDuplicados = async (req, res) => {
    try {
        const { id_oficina, campos_personalizados } = req.body;

        if (!id_oficina) {
            return res.status(400).json({ msg: 'La oficina es obligatoria' });
        }

        const resultado = await validacionDuplicadosService.validarDuplicados({
            id_oficina,
            campos_personalizados: campos_personalizados || {}
        });

        res.json(resultado);

    } catch (error) {
        console.error('Error en validacion de duplicados:', error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

/**
 * Actualiza las fechas de un expediente.
 * PUT /api/expedientes/:id/fechas
 */
exports.updateExpedienteFechas = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await expedienteService.actualizarFechasExpediente(id, req.body, req.user.id);
        res.json(resultado);
    } catch (error) {
        console.error("Error al actualizar fechas del expediente:", error);
        res.status(error.statusCode || 500).json({ msg: error.message });
    }
};

/**
 * Anexa un documento a un expediente existente por coincidencia de duplicado.
 * POST /api/expedientes/:id/anexar-por-duplicado
 */
exports.anexarPorDuplicado = async (req, res) => {
    try {
        const { id: id_expediente } = req.params;
        const {
            id_documento,
            fecha_apertura_documento,
            campo_validacion_id,
            valor_coincidencia,
            tipo_soporte,
            observaciones
        } = req.body;

        if (!id_documento) {
            return res.status(400).json({ msg: 'El documento es obligatorio' });
        }
        if (!fecha_apertura_documento) {
            return res.status(400).json({ msg: 'La fecha de apertura del documento es obligatoria' });
        }

        const resultado = await validacionDuplicadosService.anexarDocumentoAExpediente({
            id_expediente: parseInt(id_expediente),
            id_documento,
            fecha_apertura_documento,
            campo_validacion_id,
            valor_coincidencia,
            tipo_soporte,
            id_usuario: req.user.id,
            observaciones
        });

        res.status(201).json(resultado);

    } catch (error) {
        console.error('Error al anexar documento:', error);
        res.status(error.statusCode || 500).json({ msg: error.message });
    }
};

/**
 * Busca expedientes por coincidencia exacta en campos personalizados.
 * GET /api/expedientes/search-custom?id_campo=X&valor=Y
 */
exports.searchByCustomField = async (req, res) => {
    try {
        const { id_campo, valor } = req.query;

        if (!id_campo || !valor) {
            return res.status(400).json({ msg: 'Faltan parámetros de búsqueda (id_campo, valor).' });
        }

        const query = `
            SELECT e.id, e.nombre_expediente, e.codigo_expediente, e.estado, edp.valor
            FROM expedientes e
            JOIN expediente_datos_personalizados edp ON e.id = edp.id_expediente
            WHERE edp.id_campo = ? AND edp.valor = ? AND e.estado = 'En trámite'
            LIMIT 5
        `;

        const [rows] = await pool.query(query, [id_campo, valor]);

        res.json(rows);

    } catch (error) {
        console.error("Error al buscar expediente por campo personalizado:", error);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};