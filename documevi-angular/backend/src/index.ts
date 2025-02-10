import  dotenv  from 'dotenv';

// Configurar dot-env
 

dotenv.config();




import Server from './models/server'; // Si hiciste `module.exports = Server`
const server = new Server();

server.listen();