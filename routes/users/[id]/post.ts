import { Request, Response } from 'express';

export default function(req:Request,res:Response,{services}){
    console.log(services.user.getAll())
    return res.json({message: "from users:/id"})
}