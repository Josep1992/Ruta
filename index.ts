import { NextFunction } from 'connect';
import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import fs,{constants} from "fs";
import path from "path";

dotenv.config();

const ROUTES = "routes";
const SERVICES = "services";

/*
  TODO
  * file based cron jobs
  * [DONE] file based middleware
     * router subfolder level
     * router root level
  * file based error handler
     * router subfolder level
     * router root level
  * Routes documentation based on file structure
  * create file-based-api cli
  * * file based error handling 
*/

const isDirectory= (p:string) => fs.lstatSync(p).isDirectory();

interface Route {
  path: string;
  hasDynamicSegments: boolean;
  RequestHandler: any;
  name: string;
  base: string;
  dynamicRouteSegments: Array<string>
}

function injectServices(directory:string){
  const services:any = {}; // this should be a new Map
  if(!fs.existsSync(directory)) return;
  fs.readdir(directory,async (err,files) => {
    if(err) {
      console.log(err);
      throw new Error("Error registering services");
    }

    for(const v of files){
      const f = path.join(directory,v);
      const name = path.parse(path.basename(f)).name;

      if(isDirectory(f)){ continue;
      }else{
          // TODO handle named exports
          const ServiceHandler = await import(path.join(process.cwd(), f));
          const isServiceArray: Boolean = Array.isArray(ServiceHandler.default);
          const isFunction: Boolean = typeof ServiceHandler.default === "function";
          if(!ServiceHandler.default && isFunction) return;

          console.log(ServiceHandler)

          if(!(name in services)){
            // TODO handle names exports
            // Only register named exports and user the file name as the service namespace
            services[name] = {
              ...(Object.entries(ServiceHandler).reduce((obj:any,[key,value]) => {
                if(key !== "default"){
                  obj[key] = value;
                }
                return obj;
              },{}))
            };
          }
        }
      };
  });

  return services;
}

function middleware(directory:string,app:Express){
  fs.readdir(directory,async (err,files) => {
    if(err) {
      console.log(err);
      throw new Error("Error registering middleware");
    }

    for(const v of files){
      const f = path.join(directory,v);
      const name = path.parse(path.basename(f)).name
      // TODO is this the correct name we ¿want?
      const isMiddleWare = name.toLowerCase() === "use"; // we could also name it middleware

      if(isDirectory(f)){
        middleware(f,app);
      }else{
        if(isMiddleWare){
          const MiddlewareHandler = await import(path.join(process.cwd(), f));
          const isMiddleWareArray: Boolean = Array.isArray(MiddlewareHandler.default);
          const isFunction: Boolean = typeof MiddlewareHandler.default === "function";
          if(!MiddlewareHandler.default) return;
          // TODO handle case with @MiddlewareHandler.default function that returns a Array of functions
          if(isMiddleWareArray && MiddlewareHandler.default.length){
            for (const fn of MiddlewareHandler.default)
            {
              if(fn){
                app.use(await fn);
              };
            }
            return;
          }
          
          if(MiddlewareHandler.default && isFunction){
            // Executes the middleware's only on their folder, this works like @router.use
            app.use(await MiddlewareHandler?.default);
          }
        }
      };
    } 
  })
}

// TODO Routes folder should be configurable
function RegisterRoutes(directory:string, register: (p:Route) => void){
  fs.readdir(directory,(err,files) => {
    if(err) throw new Error("Error registering routes");

    for(const v of files){
      const file = path.join(directory,v);
      const base = path.basename(file);
      const name = path.parse(base).name;
      if(name === "use") continue; // we skip middleware's
      const RequestHandler = path.join(process.cwd(), file);
      const _path = file.replace(/\[/g, ":").replace(/\]/g, "")
      .replace("routes","").replace(base,"");

      // get dynamic segments [<some name>]
      let re = /\[(.*?)\]/g, match;
      const dynamicRouteSegments = []; // convert to a new Map()

      while((match = re.exec(file)) !== null){
        dynamicRouteSegments.push(match[1]);
        continue;
      }

      const hasDynamicSegments = dynamicRouteSegments.length > 0;

      if(isDirectory(file)){
        RegisterRoutes(file,register);
      }else{
        // allows for overriding the filename to any of the supported http methods
        // this give the ability of naming the without the http verbs convention
        // !Adding /<some regex></some>/gi makes the regex stateful and it won't match the catch groups we are looking for
        const re = /"use *?(?<http>delete|post|put|get|options|patch)"/i;
        const content = fs.readFileSync(file,"utf-8").trim();
        const m = content.match(re);
        // TODO add validation to http and name
        const {http} = m?.groups || {};

        // TODO for validation
        // * if we have a custom name but not the use <http verb> we should trow a error
        // * and log it the console

        register({
          base, 
          dynamicRouteSegments,
          hasDynamicSegments,
          name: (http || name).toLowerCase(),
          path: _path,
          RequestHandler,
        });
      }
    }
  })
}

if (!fs.existsSync("routes")) fs.mkdirSync("routes");

const app: Express = express();
const port = process.env.PORT;

// default middleware
app.use(express.json());

// Register middleware
middleware(ROUTES,app);


RegisterRoutes(ROUTES, async function({...route}){
  const RequestHandler = await import(route.RequestHandler);
  const services = injectServices(SERVICES);

  if(route.name in app){

    (app as any)[route.name](route.path, async (req: Request, res: Response,next:NextFunction) => {
      if(typeof RequestHandler.default !== "function"){
        return console.log("route -> @ %s ",route.path,"is missing default export");
      }
      
      await RequestHandler.default(
        req as Request, 
        res as Response,
        {
          services, 
          dynamicRouteSegments: route.dynamicRouteSegments, 
          hasDynamicSegments: route.hasDynamicSegments
        }
      );
    })
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});