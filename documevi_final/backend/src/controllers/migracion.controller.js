const pool = require('../config/db');
const XLSX = require('xlsx');
const { generarRadicadoExpediente } = require('../utils/radicado.util');

/**
 * Genera la plantilla Excel de ejemplo para carga masiva.
 * Las columnas son dinámicas según la oficina seleccionada y sus campos personalizados.
 */
exports.generarPlantillaEjemplo = async (req, res) => {
    const { id_oficina } = req.params;

    try {
        // Obtener campos personalizados de la oficina
        const [campos] = await pool.query(
            'SELECT id, nombre_campo, tipo_campo, es_obligatorio FROM oficina_campos_personalizados WHERE id_oficina = ? ORDER BY id ASC',
            [id_oficina]
        );

        // Obtener info de la oficina
        const [oficina] = await pool.query('SELECT nombre_oficina, codigo_oficina FROM oficinas_productoras WHERE id = ?', [id_oficina]);
        const nombreOficina = oficina.length > 0 ? oficina[0].nombre_oficina : 'Oficina';

        // Construir columnas base
        const headers = [
            'id_serie (*)',
            'id_subserie',
            'descriptor_1',
            'descriptor_2',
            'fecha_apertura (*)',
            'fecha_cierre',
            'estado_expediente'
        ];

        // Agregar columnas de campos personalizados
        campos.forEach(c => {
            const obligatorio = c.es_obligatorio ? ' (*)' : '';
            headers.push(`CP_${c.id}_${c.nombre_campo}${obligatorio}`);
        });

        // Columnas de ubicación física (opcionales)
        headers.push('numero_paquete');
        headers.push('codigo_carpeta');

        // Columnas de documento (opcionales)
        headers.push('DOC_radicado');
        headers.push('DOC_asunto');
        headers.push('DOC_tipo_documental');
        headers.push('DOC_soporte');
        headers.push('DOC_folios');

        // Crear fila de ejemplo
        const exampleRow = {
            'id_serie (*)': '1',
            'id_subserie': '1',
            'descriptor_1': 'Ejemplo descriptor',
            'descriptor_2': '',
            'fecha_apertura (*)': '2024-01-15',
            'fecha_cierre': '2025-06-30',
            'estado_expediente': 'Cerrado en Gestión',
        };

        campos.forEach(c => {
            const obligatorio = c.es_obligatorio ? ' (*)' : '';
            const key = `CP_${c.id}_${c.nombre_campo}${obligatorio}`;
            if (c.tipo_campo === 'numero') {
                exampleRow[key] = '12345';
            } else if (c.tipo_campo === 'fecha') {
                exampleRow[key] = '2025-01-15';
            } else {
                exampleRow[key] = 'Valor ejemplo';
            }
        });

        exampleRow['numero_paquete'] = 'PKT-001';
        exampleRow['codigo_carpeta'] = '';
        exampleRow['DOC_radicado'] = '';
        exampleRow['DOC_asunto'] = 'Documento ejemplo';
        exampleRow['DOC_tipo_documental'] = 'Oficio';
        exampleRow['DOC_soporte'] = 'Físico';
        exampleRow['DOC_folios'] = '5';

        // Crear hoja de instrucciones
        const instrucciones = [
            ['=== INSTRUCCIONES DE CARGA MASIVA ==='],
            [''],
            [`Oficina: ${nombreOficina}`],
            [''],
            ['COLUMNAS BASE:'],
            ['id_serie (*)', 'ID numérico de la serie TRD. OBLIGATORIO.'],
            ['id_subserie', 'ID numérico de la subserie TRD. Opcional.'],
            ['descriptor_1', 'Descriptor opcional del expediente.'],
            ['descriptor_2', 'Segundo descriptor opcional.'],
            [''],
            ['FECHAS Y ESTADO DEL EXPEDIENTE:'],
            ['fecha_apertura (*)', 'Fecha de apertura del expediente. Formato: AAAA-MM-DD. OBLIGATORIO.'],
            ['fecha_cierre', 'Fecha de cierre del expediente. Formato: AAAA-MM-DD. Dejar vacío si aún está abierto.'],
            ['estado_expediente', 'Estado del expediente. Valores permitidos: En trámite, Cerrado en Gestión, Cerrado en Central. Si se deja vacío, se asigna "En trámite".'],
            [''],
            ['CAMPOS PERSONALIZADOS:'],
            ['Las columnas que empiezan con CP_ son campos personalizados.'],
            ['Formato: CP_{id}_{nombre}. Los marcados con (*) son obligatorios.'],
            [''],
            ['UBICACIÓN FÍSICA (opcional):'],
            ['numero_paquete', 'Número del paquete existente donde asignar el expediente.'],
            ['codigo_carpeta', 'Código de carpeta. Si no se indica, se genera automáticamente.'],
            [''],
            ['DOCUMENTO ADJUNTO (opcional):'],
            ['DOC_radicado', 'Radicado del documento. Si no se indica, se genera automáticamente.'],
            ['DOC_asunto', 'Asunto/descripción del documento.'],
            ['DOC_tipo_documental', 'Tipo de documento (Oficio, Resolución, etc).'],
            ['DOC_soporte', 'Soporte: Físico, Digital.'],
            ['DOC_folios', 'Número de folios.'],
            [''],
            ['NOTAS:'],
            ['- Cada fila = 1 expediente.'],
            ['- Los campos con (*) son obligatorios.'],
            ['- Los IDs de serie y subserie se pueden consultar desde Parametrización > Series.'],
            ['- Si no se indican columnas DOC_, el expediente se crea sin documento.'],
            ['- El estado "Cerrado en Gestión" indica que el expediente está en archivo de gestión.'],
            ['- El estado "Cerrado en Central" indica que el expediente fue transferido a archivo central.'],
        ];

        // Crear workbook
        const wb = XLSX.utils.book_new();

        // Hoja de datos
        const wsData = XLSX.utils.json_to_sheet([exampleRow], { header: headers });
        XLSX.utils.book_append_sheet(wb, wsData, 'Datos');

        // Hoja de instrucciones
        const wsInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
        wsInstrucciones['!cols'] = [{ wch: 30 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones');

        // Generar buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=plantilla_carga_masiva_${id_oficina}.xlsx`);
        res.send(buffer);

    } catch (error) {
        console.error('Error al generar plantilla:', error);
        res.status(500).json({ msg: 'Error al generar la plantilla de ejemplo.', error: error.message });
    }
};

/**
 * Procesa el archivo Excel de carga masiva y crea expedientes.
 */
exports.cargarMasivo = async (req, res) => {
    const { id_oficina } = req.params;

    if (!req.file) {
        return res.status(400).json({ msg: 'No se subió ningún archivo.' });
    }

    try {
        // Leer el archivo Excel
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
            return res.status(400).json({ msg: 'El archivo no contiene datos.' });
        }

        // Obtener campos personalizados de la oficina
        const [camposDB] = await pool.query(
            'SELECT id, nombre_campo, es_obligatorio FROM oficina_campos_personalizados WHERE id_oficina = ?',
            [id_oficina]
        );

        const resultados = [];
        let exitosos = 0;
        let fallidos = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const fila = i + 2; // +2 por header + index 0

            try {
                // Validar serie obligatoria
                const id_serie = parseInt(row['id_serie (*)']);
                if (!id_serie) {
                    throw new Error('Campo id_serie es obligatorio.');
                }

                const id_subserie = row['id_subserie'] ? parseInt(row['id_subserie']) : null;

                // Validar y procesar fecha_apertura (obligatorio)
                const fechaAperturaRaw = String(row['fecha_apertura (*)'] || '').trim();
                if (!fechaAperturaRaw) {
                    throw new Error('Campo fecha_apertura es obligatorio.');
                }
                const fechaApertura = new Date(fechaAperturaRaw);
                if (isNaN(fechaApertura.getTime())) {
                    throw new Error(`Fecha de apertura inválida: "${fechaAperturaRaw}". Use formato AAAA-MM-DD.`);
                }

                // Procesar fecha_cierre (opcional)
                const fechaCierreRaw = String(row['fecha_cierre'] || '').trim();
                let fechaCierre = null;
                if (fechaCierreRaw) {
                    fechaCierre = new Date(fechaCierreRaw);
                    if (isNaN(fechaCierre.getTime())) {
                        throw new Error(`Fecha de cierre inválida: "${fechaCierreRaw}". Use formato AAAA-MM-DD.`);
                    }
                    if (fechaCierre < fechaApertura) {
                        throw new Error('La fecha de cierre no puede ser anterior a la fecha de apertura.');
                    }
                }

                // Procesar estado del expediente
                const estadosValidos = ['En trámite', 'Cerrado en Gestión', 'Cerrado en Central', 'Histórico', 'Eliminable'];
                let estadoExpediente = String(row['estado_expediente'] || '').trim();
                if (!estadoExpediente) {
                    estadoExpediente = 'En trámite';
                }
                if (!estadosValidos.includes(estadoExpediente)) {
                    throw new Error(`Estado inválido: "${estadoExpediente}". Valores permitidos: ${estadosValidos.join(', ')}.`);
                }

                // Extraer campos personalizados
                const customData = {};
                for (const campo of camposDB) {
                    // Buscar la columna que coincida con el campo
                    const colKey = Object.keys(row).find(k => k.startsWith(`CP_${campo.id}_`));
                    const valor = colKey ? String(row[colKey]).trim() : '';

                    if (campo.es_obligatorio && !valor) {
                        throw new Error(`Campo personalizado obligatorio "${campo.nombre_campo}" está vacío.`);
                    }

                    if (valor) {
                        customData[campo.id] = valor;
                    }
                }

                // Crear expediente
                const connection = await pool.getConnection();
                try {
                    await connection.beginTransaction();

                    const radicado = await generarRadicadoExpediente(connection);

                    const [expResult] = await connection.query(
                        `INSERT INTO expedientes (nombre_expediente, id_serie, id_subserie, descriptor_1, descriptor_2, fecha_apertura, fecha_cierre, estado, id_usuario_responsable)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            radicado,
                            id_serie,
                            id_subserie,
                            row['descriptor_1'] || null,
                            row['descriptor_2'] || null,
                            fechaApertura,
                            fechaCierre,
                            estadoExpediente,
                            req.user.id
                        ]
                    );
                    const expedienteId = expResult.insertId;

                    // Guardar datos personalizados
                    if (Object.keys(customData).length > 0) {
                        const values = Object.entries(customData).map(([id_campo, valor]) => [expedienteId, id_campo, valor]);
                        await connection.query(
                            'INSERT INTO expediente_datos_personalizados (id_expediente, id_campo, valor) VALUES ?',
                            [values]
                        );
                    }

                    // Asignar a paquete si se indicó
                    const numeroPaquete = String(row['numero_paquete'] || '').trim();
                    if (numeroPaquete) {
                        const [paquetes] = await connection.query(
                            'SELECT id FROM paquetes WHERE numero_paquete = ? AND id_oficina = ?',
                            [numeroPaquete, id_oficina]
                        );
                        if (paquetes.length > 0) {
                            await connection.query(
                                'INSERT INTO paquete_expedientes (id_paquete, id_expediente) VALUES (?, ?) ON DUPLICATE KEY UPDATE id_paquete = id_paquete',
                                [paquetes[0].id, expedienteId]
                            );
                        }
                    }

                    // Crear documento si hay datos DOC_
                    const docAsunto = String(row['DOC_asunto'] || '').trim();
                    if (docAsunto) {
                        const { generarRadicado } = require('../utils/radicado.util');
                        let docRadicado = String(row['DOC_radicado'] || '').trim();
                        if (!docRadicado) {
                            docRadicado = await generarRadicado(connection);
                        }

                        await connection.query(
                            `INSERT INTO documentos (radicado, asunto, tipo_documental, soporte, folios, id_expediente, id_usuario_radicador)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [
                                docRadicado,
                                docAsunto,
                                row['DOC_tipo_documental'] || 'Otro',
                                row['DOC_soporte'] || 'Físico',
                                parseInt(row['DOC_folios']) || 0,
                                expedienteId,
                                req.user.id
                            ]
                        );
                    }

                    await connection.commit();
                    exitosos++;
                    resultados.push({ fila, estado: 'OK', radicado, id: expedienteId });
                } catch (err) {
                    await connection.rollback();
                    throw err;
                } finally {
                    connection.release();
                }
            } catch (error) {
                fallidos++;
                resultados.push({ fila, estado: 'ERROR', error: error.message });
            }
        }

        res.json({
            msg: `Carga completada. ${exitosos} exitosos, ${fallidos} fallidos de ${rows.length} filas.`,
            exitosos,
            fallidos,
            total: rows.length,
            detalle: resultados
        });

    } catch (error) {
        console.error('Error en carga masiva:', error);
        res.status(500).json({ msg: 'Error al procesar el archivo.', error: error.message });
    }
};
