import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import * as path from 'path';

import setRoutes from './routes';

const app = express();
dotenv.load({ path: '.env' });
app.set('port', 3000);

app.use('/', express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// pick monogdb url based on environment
let mongodbURI;
if (process.env.NODE_ENV === 'test') {
  mongodbURI = process.env.MONGODB_TEST_URI;
} else if (process.env.NODE_ENV === 'easy') {
  mongodbURI = process.env.MONGODB_EASY_URI;
  app.use(morgan('dev'));
} else {
  mongodbURI = process.env.MONGODB_URI;
  app.use(morgan('dev'));
}

mongoose.Promise = global.Promise;
const mongodb = mongoose.connect(mongodbURI, { useMongoClient: true });

mongodb
  .then((db) => {
    console.log('Connected to MongoDB on', db.host + ':' + db.port);

    setRoutes(app);

    app.get('/*', function(req, res) {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    if (!module.parent) {
      app.listen(app.get('port'), () => {
        console.log('JSON api listening on port ' + app.get('port'));
      });
    }

  })
  .catch((err) => {
    console.error(err);
});

export { app };
