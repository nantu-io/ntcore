import { Routes } from "./routes/endpoints";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as path from "path";
import fileUpload = require('express-fileupload');

class App {
    public app: express.Application;
    public routes: Routes = new Routes();

    constructor() {
      this.app = express();
      this.config();
      this.routes.routes(this.app);
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
      this.configStatic();
      // Listen to port
      const PORT = 8180;
      this.app.listen(PORT, () => console.log('Server is running'));
    }

    private configStatic(): void {
      this.app.use(express.static(path.join(__dirname, '/../webapp/build')));
      this.app.get('/dsp/console/*', (req, res, next) => {
        res.sendFile(path.join(__dirname, '/../webapp/build/index.html'));
      });
    }
}

export default new App().app;