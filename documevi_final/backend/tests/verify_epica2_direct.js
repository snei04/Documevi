const carpetaController = require('../src/controllers/carpeta.controller');
const documentoController = require('../src/controllers/documento.controller');
const pool = require('../src/config/db');

// Mock Request and Response
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

const runVerification = async () => {
    console.log("=== Iniciando Verificación Refactorizacion Carpetas ===");
    let id_oficina = 1;
    let carpetaId = null;

    try {
        // 1. Crear Carpeta con Ubicacion (Refactor)
        console.log("\n1. Creando Carpeta con Ubicacion Refactorizada...");
        let req = {
            body: {
                id_oficina: id_oficina,
                descripcion: "Carpeta con Ubicacion Refactorizada",
                capacidad_maxima: 50,
                paquete: "Paquete Refactor 1",
                estante: "Estante Refactor A",
                otro: "Caja Refactor X"
            }
        };
        let res = mockRes();
        await carpetaController.createCarpeta(req, res);

        if (res.statusCode !== 201) {
            console.error("❌ FAILED: Error al crear carpeta", res.body);
            process.exit(1);
        }
        console.log("✅ Carpeta creada:", res.body.codigo_carpeta);
        carpetaId = res.body.id;

        // 2. Crear Documento (Solo id_carpeta, sin ubicacion extra)
        console.log("\n2. Creando Documento en Carpeta Refactorizada...");
        req = {
            body: {
                asunto: "Doc en Carpeta Refactorizada",
                tipo_soporte: "Físico",
                id_oficina_productora: id_oficina,
                id_serie: 1,
                id_subserie: 1,
                remitente_nombre: "Tester",
                id_carpeta: carpetaId
            },
            user: { id: 5 }
        };
        res = mockRes();
        await documentoController.createDocumento(req, res);

        if (res.statusCode !== 201) {
            console.error("❌ FAILED: Error al crear nodo", res.body);
            process.exit(1);
        }
        console.log("✅ Documento creado:", res.body.radicado);

        console.log("\n=== Verificación Exitosa ===");

    } catch (error) {
        console.error("Global Error:", error);
    } finally {
        process.exit(0);
    }
};

runVerification();
