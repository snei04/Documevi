"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.putPersona = exports.postPersona = exports.deletePersona = exports.getPersona = exports.getPersonas = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const getPersonas = (req, res) => {
    connection_1.default.query('select * from informacion_usuario', (err, data) => {
        if (err)
            throw err;
        res.json(data);
    });
};
exports.getPersonas = getPersonas;
const getPersona = (req, res) => {
    const { id } = req.params;
    connection_1.default.query('SELECT * FROM informacion_usuario WHERE id_Documento=?', id, (err, data) => {
        if (err)
            throw err;
        res.json(data[0]);
    });
};
exports.getPersona = getPersona;
const deletePersona = (req, res) => {
    const { id } = req.params;
    res.json({
        msg: "deletePersona",
        id: id
    });
};
exports.deletePersona = deletePersona;
const postPersona = (req, res) => {
    const { body } = req;
    connection_1.default.query('INSERT INTO informacion_usuario set ?', [body], (err, data) => {
        if (err)
            throw err;
        res.json({
            msg: 'Persona creada con exito'
        });
    });
};
exports.postPersona = postPersona;
const putPersona = (req, res) => {
    const { body } = req;
    const { id } = req.params;
    res.json({
        msg: "putPersona",
        body: body,
        id: id
    });
};
exports.putPersona = putPersona;
