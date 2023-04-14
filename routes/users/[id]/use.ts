import { Request, Response,NextFunction } from 'express';

// export default function(req:Request, res:Response, next:NextFunction){
//     console.log("middleware function invoked",req.url);
//     next();
// }


export default [
    function(req:Request, res:Response, next:NextFunction){
        console.log("middleware function 1",req.url);
        next();
    },
    function(req:Request, res:Response, next:NextFunction){
        console.log("middleware function 2",req.url);
        next();
    },
    function(req:Request, res:Response, next:NextFunction){
        console.log("middleware function 3",req.url);
        next();
    }
];