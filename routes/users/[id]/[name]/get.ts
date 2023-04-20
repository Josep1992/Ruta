import { Request, Response } from 'express';

export default function(req: Request,res: Response,{dynamicRouteSegments}){
    console.log(dynamicRouteSegments);
    res.json({message:dynamicRouteSegments})
}