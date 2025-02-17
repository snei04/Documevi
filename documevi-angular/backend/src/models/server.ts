import express, {  Application } from 'express';
import routesPersona from '../routes/persona.routes'
import connection from '../db/connection';

class Server {
    private app: Application;
    private port: string;               


    constructor() {
        this.app = express();
        this.port = process.env.PORT || '4000';
        this.middlewares()
        this.routes();
        this.conectarDB();
    }
    listen() {
        this.app.listen(this.port, () => {
            console.log('Aplicacion corriendo por el puerto', this.port);
        })
    }
    middlewares(){

        //Parseo del body
        this.app.use(express.json());

    }
  
   
    routes() {
        this.app.use('/api/personas', routesPersona);
    }
    conectarDB(){
        connection.connect((err)=> {
            

        })
    }
}
    



export default Server;



