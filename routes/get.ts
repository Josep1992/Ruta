import { Request, Response } from 'express';

export default async function(req: Request, res: Response){
    return res.status(200).json({message:'File Based API with Express + TypeScript Server'});
}

const HTTP_METHOD = 'GET';

export {HTTP_METHOD};