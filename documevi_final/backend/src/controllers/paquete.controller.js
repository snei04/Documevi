const paqueteService = require('../services/paquete.service');

// GET /api/paquetes?page=1&limit=20
const getAllPaquetes = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        // Listar paquetes globales (sin filtro de oficina)
        const result = await paqueteService.listarPaquetes(
            null,
            parseInt(page),
            parseInt(limit),
            search
        );
        res.json(result);
    } catch (error) {
        console.error('Error al listar paquetes:', error);
        res.status(500).json({ msg: 'Error interno del servidor.' });
    }
};

// GET /api/paquetes/activo
const getPaqueteActivo = async (req, res) => {
    try {
        // Ya no requiere id de oficina
        const paquete = await paqueteService.obtenerPaqueteActivo();
        res.json(paquete);
    } catch (error) {
        console.error('Error al obtener paquete activo:', error);
        const status = error.statusCode || 500;
        res.status(status).json({ msg: error.message || 'Error interno del servidor.' });
    }
};

// POST /api/paquetes/asignar-expediente
const asignarExpediente = async (req, res) => {
    try {
        const { id_expediente, id_paquete, marcar_paquete_lleno, observaciones } = req.body;

        if (!id_expediente || !id_paquete) {
            return res.status(400).json({ msg: 'id_expediente e id_paquete son obligatorios.' });
        }

        const result = await paqueteService.asignarExpediente(
            parseInt(id_expediente),
            parseInt(id_paquete),
            marcar_paquete_lleno || false,
            observaciones || null
        );

        res.json(result);
    } catch (error) {
        console.error('Error al asignar expediente:', error);
        const status = error.statusCode || 500;
        res.status(status).json({ msg: error.message || 'Error interno del servidor.' });
    }
};

// POST /api/paquetes/:id/marcar-lleno
const marcarLleno = async (req, res) => {
    try {
        const { id } = req.params;
        const { observaciones } = req.body;
        const id_usuario = req.user ? req.user.id : null;

        const result = await paqueteService.marcarLleno(
            parseInt(id),
            observaciones || null,
            id_usuario
        );

        res.json(result);
    } catch (error) {
        console.error('Error al marcar paquete lleno:', error);
        const status = error.statusCode || 500;
        res.status(status).json({ msg: error.message || 'Error interno del servidor.' });
    }
};

// POST /api/paquetes/:id/reabrir
const reabrirPaquete = async (req, res) => {
    try {
        const { id } = req.params;
        const id_usuario = req.user ? req.user.id : null;

        const result = await paqueteService.reabrirPaquete(parseInt(id), id_usuario);
        res.json(result);
    } catch (error) {
        console.error('Error al reabrir paquete:', error);
        const status = error.statusCode || 500;
        res.status(status).json({ msg: error.message || 'Error interno del servidor.' });
    }
};

// GET /api/paquetes/:id/expedientes
const getExpedientesPaquete = async (req, res) => {
    try {
        const { id } = req.params;
        const expedientes = await paqueteService.obtenerExpedientesPaquete(parseInt(id));
        res.json(expedientes);
    } catch (error) {
        console.error('Error al obtener expedientes del paquete:', error);
        res.status(500).json({ msg: 'Error interno del servidor.' });
    }
};

module.exports = {
    getAllPaquetes,
    getPaqueteActivo,
    asignarExpediente,
    marcarLleno,
    reabrirPaquete,
    getExpedientesPaquete
};
