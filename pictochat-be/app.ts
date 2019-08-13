import process from 'process';
import path from 'path';
import createError from 'http-errors';
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
//import indexRouter from './routes/index';
import { apiRouter } from './routes/api-route';
import { makeFrontEndRouter } from './routes/front-end-route';
//import usersRouter from './routes/users-route';
//import testAPIRouter from './routes/testAPI';

// CONSTANTS
const PORT = process.env.PICTOCHAT_BACKEND_PORT || 443;
// Default path is relative to the compiled app.js file's location in the build directory
const WEB_CONTENT_DIR = process.env.PICTOCHAT_FRONTEND_DIR || path.join(__dirname, '../pictochat-fe');
const FRONTEND_REQUEST_ORIGIN = process.env.PICTOCHAT_FRONTEND_REQUEST_ORIGIN || '';
console.log('WEB_CONTENT_DIR: ' + WEB_CONTENT_DIR);

const app = express();

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', FRONTEND_REQUEST_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  // FIXME: Typescript complains that res.header only takes 2 args
  // @ts-ignore
  res.header('Access-Control-Allow-Headers', 'Content-Type', 'Authorization');

  if (req.method.toUpperCase() == "OPTIONS") {
    res.status(200).send();
    return;
  }
  next();
});

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// FRONTEND ROUTE
const frontEndRouter = makeFrontEndRouter(WEB_CONTENT_DIR);
app.use('/', frontEndRouter);


// API ROUTE
app.use('/api', apiRouter);


//app.use('/', indexRouter);
// app.use('/user', usersRouter);
// app.use('/testAPI', testAPIRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

app.listen(PORT, () => console.log(`Pictochat server is listening on ${PORT}`));
