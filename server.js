/**
 * rewebrtc-server project
 *
 * Tho Q Luong <thoqbk@gmail.com>
 * Feb 12, 2017
 */

var converterServerAddress = '10.10.0.63';
var converterServerPort = 4455; 
var uploadDir = 'C:\\inetpub\\tas-conference-demo\\ups\\';

var socket2 = null;

var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var open = require('open');
var httpsOptions = {
  key: fs.readFileSync('./fake-keys/privatekey.pem'),
  cert: fs.readFileSync('./fake-keys/certificate.pem')
};

var formidable = require('formidable');
const crypto = require("crypto");

let isLocal = process.env.PORT == null;
var serverPort = (process.env.PORT  || 83);
var server = null;
if (isLocal) {
  server = require('https').createServer(httpsOptions, app);
} else {
  server = require('http').createServer(app);
}
var io = require('socket.io')(server);
//server = require('http').createServer(app);


// var serverPort = 8080;
// var server = require('http').createServer(app);


var io = require('socket.io')(server);

let socketIdToNames = {};
//------------------------------------------------------------------------------
//  Serving static files
app.get('/conferance', function (req, res) {
  res.sendFile(__dirname + '/html/conferance.html');
});
app.get('/check', function (req, res) {
  res.sendFile(__dirname + '/html/check.html');
});
app.get('/check.html', function (req, res) {
  res.sendFile(__dirname + '/html/check.html');
});
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/html/check.html');
});
app.get('/login', function (req, res) {
  res.sendFile(__dirname + '/html/login.html');
});
app.get('/public', function (req, res) {
  res.sendFile(__dirname + '/html/public.html');
});
app.get('/completed', function (req, res) {
  res.sendFile(__dirname + '/html/completed.html');
});

app.get('/old', function (req, res) {
  res.sendFile(__dirname + '/html/old.html');
});
app.get('/draw', function (req, res) {
  res.sendFile(__dirname + '/html/draw.html');
});

app.post('/record', function (req, res) {

  var form = new formidable.IncomingForm();
  form.multiples = true;
  form.keepExtensions = true;
  form.uploadDir = uploadDir;
  var fileName = '';
  var dataKey = crypto.randomBytes(16).toString("hex");
  form.parse(req, (err, fields, files) => {

    if (err) {
      return res.status(500).json({
        error: err
      })
    } else {
      file = files["video-blob"];

      //      formData.append('roomKey', window.credential.RoomKey);
      //      formData.append('userKey', window.credential.UserKey);

      var movePath = path.join(uploadDir, fields.roomKey + '-' + fields.userKey + '_' + fields["video-filename"]);

      fs.rename(file.path, movePath, function (err) {
        if (err) console.log('ERROR: ' + err);


        var fileString = base64_encode(movePath);

        var socketFile = {
          data: {
            contents: fileString,
            name: "user-" + fields.userKey + "-" + dataKey + ".webm",
            roomId: "room-" + fields.roomKey,
            userId: "user-" + fields.userKey
          },
          roomId: "room-" + fields.roomKey,
          userId: "user-" + fields.userKey
        };
        socket2.emit('postFile', socketFile);
      });
    }
    res.status(200).json({
      uploaded: true
    })
  })
  form.on('fileBegin', function (name, file) {
    file.path = path.join(uploadDir, dataKey); //`${fileName}.${fileExt}`)
  })
});

app.use('/style', express.static(path.join(__dirname, '/assets/style')));
app.use('/script', express.static(path.join(__dirname, '/assets/script')));
app.use('/image', express.static(path.join(__dirname, '/assets/image')));
app.use('/assets', express.static(path.join(__dirname, '/assets')));

server.listen(serverPort, function () {
  console.log('Rewebrtc-server is up and running at %s port', serverPort);
  // Connect to server
  var io2 = require('socket.io-client');
  socket2 = io2.connect('http://' + converterServerAddress + ':' + converterServerPort, {
    reconnect: true
  });

  // Add a connect listener
  socket2.on('connect', function (socket) {
    console.log('Connected record server!');
  });
  socket2.connect();
});

//------------------------------------------------------------------------------
//  WebRTC Signaling
function socketIdsInRoom(roomId) {
  var socketIds = io.nsps['/'].adapter.rooms[roomId];
  if (socketIds) {
    var collection = [];
    for (var key in socketIds) {
      collection.push(key);
    }
    return collection;
  } else {
    return [];
  }
}

io.on('connection', function (socket) {
  console.log('Connection');
  socket.on('disconnect', function () {
    console.log('Disconnect');
    delete socketIdToNames[socket.id];
    if (socket.room) {
      var room = socket.room;
      io.to(room).emit('leave', socket.id);
      socket.leave(room);
    }
  });

  /**
   * Callback: list of {socketId, name: name of user}
   */
  socket.on('join', function (joinData, callback) { //Join room
    let roomId = joinData.roomId;
    let name = joinData.name;
    socket.join(roomId);
    socket.room = roomId;
    socketIdToNames[socket.id] = name;
    var socketIds = socketIdsInRoom(roomId);
    let friends = socketIds.map((socketId) => {
      return {
        socketId: socketId,
        name: socketIdToNames[socketId]
      }
    }).filter((friend) => friend.socketId != socket.id);
    callback(friends);
    //broadcast
    friends.forEach((friend) => {
      io.sockets.connected[friend.socketId].emit("join", {
        socketId: socket.id,name
      });
    });
    console.log('Join: ', joinData);
  });

  socket.on('exchange', function (data) {
    console.log('exchange', data);
    data.from = socket.id;
    var to = io.sockets.connected[data.to];
    to.emit('exchange', data);
  });

  socket.on("count", function (roomId, callback) {
    var socketIds = socketIdsInRoom(roomId);
    callback(socketIds.length);
  });

});
// function to encode file data to base64 encoded string
function base64_encode(file) {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap).toString('base64');
}