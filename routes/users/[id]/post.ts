import { Request, Response } from 'express';

// Todo type deps correctly
export default function(req:Request,res:Response,dependecies:any){
    console.log(dependecies.services.user.getAll())
    return res.json({message: "from users:/id"})
}