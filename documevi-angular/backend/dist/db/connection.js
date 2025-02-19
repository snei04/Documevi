"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql2_1 = __importDefault(require("mysql2"));
const key_1 = __importDefault(require("../key"));
const connection = mysql2_1.default.createConnection(key_1.default);
exports.default = connection;
