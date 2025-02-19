


import { Request, Response } from 'express';
import connection from '../db/connection';


 export const getPersonas = (req:Request,res:Response)=>{

    connection.query('select * from informacion_usuario', (err,data)=>{
        if(err) throw err;
        res.json(data)

    })

  
}

export const getPersona = (req:Request,res:Response) =>{


const { id } = req.params;

connection.query('SELECT * FROM informacion_usuario WHERE id_Documento=?',id, (err, data: any)=>{
    if(err) throw err;
    res.json(data[0])

})
}
export const deletePersona = (req:Request,res:Response) =>{
 
    const { id } = req.params;
    res.json({
        msg:"deletePersona",
        id: id
    })
    
    }

    export const postPersona = (req:Request,res:Response) =>{

        const { body } = req;
        
        connection.query('INSERT INTO informacion_usuario set ?',[body], (err, data: any)=>{
            if(err) throw err;
            res.json({
                msg: 'Persona creada con exito'
            })
        
        })
    }
        
    export const putPersona = (req:Request,res:Response) =>{
        
        const { body } =req;
        const { id } = req.params;

        
        res.json({
            msg:"putPersona",
            body : body,
            id: id
        })
        
        }