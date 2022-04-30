import { Routes } from "./routes/endpoints";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as path from "path";
import { appConfig } from './libs/config/AppConfigProvider';
import fileUpload = require('express-fileupload');
import { initialize } from "./libs/config/AppModule";

export class App 
{
    public app: express.Application;
    private _routes: Routes;

    constructor() {
      this.app = express();
      this.config();
      this._routes = new Routes();
      this._routes.routes(this.app);
    }

    private config(): void {
      // support application/json type post data
      this.app.use(bodyParser.json({limit: '500mb'}));
      // support application/x-www-form-urlencoded post data
      this.app.use(bodyParser.urlencoded({ limit: '500mb', extended: false }));
      // support file upload from client
      this.app.use(fileUpload({
        useTempFiles : true,
        tempFileDir : '/tmp/'
      }));
      // config js/css route
      this.app.use('/dsp/public', express.static(path.join(__dirname, '/../webapp/build')));
      // config html route
      this.app.get('/dsp/console/*', (req, res, next) => {
        res.sendFile(path.join(__dirname, '/../webapp/build/index.html'));
      });
      // Listen to port
      const PORT = 8180;
      initialize().then(() => {
        this.app.listen(PORT, () => console.log(`NTCore is running with ${appConfig.container.provider} provider`));
      });
    }
}

export default new App().app;