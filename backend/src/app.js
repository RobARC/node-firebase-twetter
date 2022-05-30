
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const app = express();
require('dotenv').config();
const exphbs = require('express-handlebars')

//settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, './views'));

app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main.hbs',
    extname: '.hbs'
}));

app.set('view engine', '.hbs');
app.set('json spaces', 2);

//middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(require('cors')());
app.use(require('body-parser').json());

//routes
app.use(require('./routes/index'));

//static files
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
