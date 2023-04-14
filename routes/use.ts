import { Request, Response, NextFunction } from 'express';

export default async function(req:Request, res:Response, next:NextFunction){
    console.log("this middleware runs on every route");
    next()
}
