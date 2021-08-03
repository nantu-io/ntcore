import { Routes } from "./routes/endpoints";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as path from "path";
import { appConfig } from './libs/config/AppConfigProvider';
import fileUpload = require('express-fileupload');

export class App {
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
      this.app.use(bodyParser.json());
      // support application/x-www-form-urlencoded post data
      this.app.use(bodyParser.urlencoded({ extended: false }));
      // support file upload from client
      this.app.use(fileUpload({
        useTempFiles : true,
        tempFileDir : '/tmp/'
      }));
      // config static assets
      this.app.use(express.static(path.join(__dirname, '/../webapp/build')));
      this.app.get('/dsp/console/*', (req, res, next) => {
        res.sendFile(path.join(__dirname, '/../webapp/build/index.html'));
      });
      // Listen to port
      const PORT = 8180;
      this.app.listen(PORT, () => console.log(`Server is running with ${appConfig.container.provider} provider`));
    }
}

export default new App().app;