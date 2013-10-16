var app, express, join, server;
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
var crypto = require('crypto');

var config = require('./config');

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : config.host,
  user     : config.user,
  password : config.password,
  database : config.database,
});

connection.connect(function(err) {
  console.log('MySQL message: '+ err);
 
});

//var courses = ['INFR08023', 'INFR08008' ];//'INFR08009', 'INFR08018', 'INFR08019'];

var users = [
    { id: 1, username: 'bob', password: 'secret', email: 'bob@example.com' }
  , { id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com' }
];

function getDigest(text){
  var md5sum = crypto.createHash('md5');
  md5sum.update(text);
  return md5sum.digest('hex');
}

function findById(id, fn) {
  connection.query('SELECT * FROM Users WHERE UID='+id+';', function(err, rows){
    
      return fn(null, rows[0]);
    
  });
  
}

function getCourses(uid, fn){
  connection.query('SELECT * FROM Taking, Schedule WHERE Taking.UID = '+uid+' AND Schedule.Code = Taking.Code AND startDate<=CURDATE() AND endDate>="2013-12-01" GROUP BY Taking.Code;', function(err, rows){
    return fn(rows);
  });
}
   
function getTimetable(courses, fn){

  for (var i = 0; i < courses.length; i++) {
      items = [];
      getTimes(courses[i].Code, function(data){

        

        for (var j = 0; j < data.length; j++) {
          var t = /(\d{2}):(\d{2}):\d{2}/i;
          var s = data[j].Start.toString().match(t);
          var e = data[j].End.toString().match(t);

          var startH = parseInt(s[1]) -8;
          var startM = parseInt(s[2])/60;

          var endH = parseInt(e[1]) - 8;
          var endM = parseInt(e[2])/60;

          var duration = (endH + endM) - (startH+startM);

          var type = 'btn-danger';

          if(data[j].Type == '*Lecture' || data[j].Type == 'Lecture')
            type = 'btn-success';

          if(data[j].Type == '*Tutorial' || data[j].Type == 'Tutorial')
            type = 'btn-primary';
          

          if(data[j].Type == '*Lab Session' || data[j].Type == 'Lab Session')
            type = 'btn-warning';

           items.push('<li onclick="moreInfo(this);" class="tt-event '+type+'" data-location="'+data[j].Building+' '+data[j].Room+'" data-code="'+data[j].Code+'" data-timeend="'+data[j].End+'" data-timestart="'+data[j].Start+'" data-type="'+data[j].Type+'" data-description="'+data[j].Description+'" data-id="'+(j*i).toString()+'" data-name="'+data[j].Name+'" data-day="'+data[j].Day.toString()+'" data-start="'+(startH+startM).toString()+'" data-duration="'+duration.toString()+'">'+data[j].Name+'<br />'+data[j].Start+' - '+data[j].End+'<br />'+data[j].Building+' '+data[j].Room+'</li>');
           
       
           
        };
          
          return fn(items.join(''));

        
      });

           

  };
 
}

function getTimes(course, fn){
  connection.query('SELECT * FROM Schedule, Taking WHERE Schedule.Code = Taking.Code AND Schedule.Code = "'+course+'" AND (Tutorial is NULL || ((Tutorial = SID AND Type="*Tutorial") || Type <> "*Tutorial")) GROUP BY SID;', function(err, rows){
    return fn(rows);
  })
}

function getTutorials(course, fn){
  connection.query("SELECT * FROM Schedule, Taking WHERE Taking.Code = Schedule.Code AND Type='*Tutorial' AND Schedule.Code = '"+course+"';", function(err,rows){
    return fn(rows);
  });
}

function search(text, fn){
  connection.query('SELECT * FROM Courses WHERE Description LIKE "%'+text+'%" OR AcademicDesc LIKE "%'+text+'%" OR Name LIKE "%'+text+'%";', function(err, rows){
    return fn(err, rows);
  });
}

function searchFilter(data, fn){
  var q = 'SELECT * FROM Courses, People WHERE';
  if(data.about != '')
    q+= '(Description LIKE "%'+data.about+'%" OR AcademicDesc LIKE "%'+data.about+'%" OR Name LIKE "%'+data.about+'%") AND';
  if(data.cred != '0');
    q+='Credits = '+data.cred+') AND';
  if(data.tb != '0')
    q+='(PID = Organizer AND Organizer = '+data.tb+')';
  if(data.school != '0')
    q+='';
      connection.query(q, function(err, rows){
        return fn(err, rows);
      });
}


function findByUsername(username, fn) {
  connection.query('SELECT UID, Email, Digest FROM Users WHERE Email="'+username+'";', function(err, rows){
    console.log(err);
    console.log(rows[0]);
      return fn(null, rows[0]);
    
  });

  //return fn(null, null);
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

passport.serializeUser(function(user, done) {
  done(null, user.UID);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        pass = getDigest(password);
        if (user.Digest != pass) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));

join = require('path').join;

express = require("express");



app = express();

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.engine('ejs', require('ejs-locals'));
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express["static"](__dirname));
});

app.get('/', function(req, res){
  res.render('index', {user: req.user, pageName: 'Home' });

});

app.get('/tutorials', ensureAuthenticated, function (req, res, next){
  getTutorials(req.user.UID, function (courses){
    if(typeof courses != 'undefined')
    {
     
    var items = [];
    getTimetable(courses, function (data){
          items.push(data);
          console.log('\n\n\n'+items.length);
          if(items.length==courses.length)
            res.render('timetable', {user: req.user, pageName: 'Timetable', timetable: items[items.length-1]});
    
    });
  }
  else
    res.render('timetable', {user: req.user, pageName: 'Timetable', timetable: ''});

  });
});

app.get('/timetable',ensureAuthenticated, function(req, res, next){
  getCourses(req.user.UID, function (courses){
    if(typeof courses != 'undefined')
    {
     
    var items = [];
    getTimetable(courses, function (data){
          items.push(data);
          console.log('\n\n\n'+items.length);
          if(items.length==courses.length)
            res.render('timetable', {user: req.user, pageName: 'Timetable', timetable: items[items.length-1]});
    
    });
  }
  else
    res.render('timetable', {user: req.user, pageName: 'Timetable', timetable: ''});

  });
});


app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.session.messages , pageName: 'Login'});
});

app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }
    if (!user) {
      req.session.messages =  [info.message];
      return res.redirect('/login')
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/');
    });
  })(req, res, next);
});

app.get('/register', function(req, res){
  res.render('register', {user: req.user, message: req.session.messages, pageName: 'Register'});
});

app.post('/register', function(req, res, next){
  if(req.body.password != req.body.password2)
  {
    req.session.messages = "Passwords don't match!";
    return res.redirect('/register');
  }
  else
  {

    var post = {digest: getDigest(req.body.password), Name: req.body.name, email: req.body.email};
    var query = connection.query('INSERT INTO Users SET ?', post, function(er, result) {

      passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }
    if (!user) {      
      req.session.messages =  [info.message];
      return res.redirect('/login')
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/');
    });
  })(req, res, next);

      console.log(er);
      connection.query('SELECT LAST_INSERT_ID() AS ID;', function(e, r){
        insertSpecialities(req.body.tags, r[0].ID);
      });
    });



  }
});


app.post('/add', ensureAuthenticated, function(req, res, next){
    var post = {Problem: req.body.problem, Tags: req.body.tags, UID: req.user.UID, Points: 30, Done: false};
    var query = connection.query('INSERT INTO Posts SET ?, Date=Now()', post, function(err, result) {
      console.log(err);
    });
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/search/:tag', ensureAuthenticated, function(req, res, next){
  res.render('index', {user: req.user, pageName: 'Home - '+req.params.tag, search: req.params.tag});
});


server = require('http').createServer(app).listen(8082);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket){
  socket.on('search', function (data){
    search(data.text, function (err, rows){
      socket.emit('search', {data: rows});
    });
  });

  socket.on('searchFilter', function (data){
    searchFilter(data, function (err, rows){
      socket.emit('search', {data: rows});
    });
  });

});



console.log('Server running on port 80822');


