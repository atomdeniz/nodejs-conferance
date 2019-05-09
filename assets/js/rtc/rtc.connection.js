let localStream = null;
let friends = null;
let me = null; //{socketId, name}

var peerConnections = {}; //map of {socketId: socket.io id, RTCPeerConnection}

var configuration = {
    "iceServers": [{
        "url": "stun:stun.l.google.com:19302"
    },
    {
        "url": "stun:stun1.l.google.com:19302"
    },
    {
        "url": "stun:stun2.l.google.com:19302"
    },
    {
        "url": "stun:stun3.l.google.com:19302"
    },
    {
        "url": "stun:stun4.l.google.com:19302"
    },
    {
        "url": "stun:stun.l.google.com:19302"
    },
    {
        url: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
    },
    {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    },
    {
        url: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    },
    {
        url: 'turn:turn.bistri.com:80',
        credential: 'homeo',
        username: 'homeo'
     },
     {
        url: 'turn:turn.anyfirewall.com:443?transport=tcp',
        credential: 'webrtc',
        username: 'webrtc'
    }]
};

var socketEvents = {
    startSocket: function () {
        socket = io();

        socket.on('exchange', function (data) {
            exchange(data);
        });

        socket.on('leave', function (socketId) {
            leave(socketId);
        });

        socket.on('connect', function (data) {
            console.log('connect');
        });

        socket.on("join", function (friend) {
            //new friend:
            friends.push(friend);
            console.log("New friend joint conversation: ", friend);
        });


        var remoteViewContainer = document.getElementById("remoteViewContainer");
        localStream = null;
        friends = null; //list of {socketId, name}
        me = null; //{socketId, name}

        //Load selfView
        socketEvents.loadLocalStream(true); //muted

        //Count number of sockets in room and change join label
        socketEvents.countFriends((count) => {
            let joinLabel = "Join this conversation with " + count + " other" + (count > 1 ? "s" : "");
            console.log(joinLabel);
        });
    },
    join: function (callback) {
        var roomId = api.getQueryString('r');
        var name = api.getQueryString('u');

        socket.emit('join', {
            roomId,
            name
        }, function (result) {
            friends = result;
            console.log('Joins', friends);
            friends.forEach((friend) => {
                createPeerConnection(friend, true);
            });
            if (callback != null) {
                me = {
                    socketId: socket.id,
                    name: name
                }
                callback();
            }
        });
    },
    countFriends: function (callback) {
        var roomId = api.getQueryString('r');
        socket.emit("count", roomId, (count) => {
            console.log("Count friends result: ", count);
            callback(count);
        });
    },
    loadLocalStream: function (muted) {
        navigator.getUserMedia({
            "audio": true,
            "video": true
        }, function (stream) {
            windowEvents.showMyVideo(stream, muted);
            localStream = stream;
        }, socketEvents.logError);
    },
    
    logError: function (error) {
        console.log("logError", error);
    },
    leave: function (socketId) {
        console.log('leave', socketId);
        var pc = peerConnections[socketId];
        pc.close();
        delete peerConnections[socketId];
        if (window.onFriendLeft) {
            window.onFriendLeft(socketId);
        }
    },

    onFriendCallback: function(socketId, stream) {
        let friend = friends.filter(friend => friend.socketId == socketId)[0];
        console.log("OnFriendCallback: ", friends);
        
        windowEvents.showUserVideo(friend.name, stream, socketId);
        return;

        let thumbnailElement = document.createElement("div");
        thumbnailElement.className = "video-thumbnail";
        thumbnailElement.style = "width: 30%";
        thumbnailElement.id = "friend-" + socketId;
    
        let videoElement = document.createElement('video');
        videoElement.className = "video thumbnail";
        videoElement.autoplay = 'autoplay';
        videoElement.src = URL.createObjectURL(stream);
        thumbnailElement.appendChild(videoElement);
    
        let nameElement = document.createElement("div");
        nameElement.className = "name";
        nameElement.innerText = (friend != null ? friend.name : "");
        thumbnailElement.appendChild(nameElement);
    
        document.getElementsByClassName("videos-container")[0].appendChild(thumbnailElement);
    }
};

function exchange(data){ //: function (data) {
    var fromId = data.from;
    var pc;
    if (fromId in peerConnections) {
        pc = peerConnections[fromId];
    } else {
        let friend = friends.filter((friend) => friend.socketId == fromId)[0];
        if (friend == null) {
            friend = {
                socketId: fromId,
                name: ""
            }
        }
        pc = createPeerConnection(friend, false);
    }

    debugger;

    if (data.sdp) {
        console.log('exchange sdp', data);
        pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            if (pc.remoteDescription.type == "offer")
                pc.createAnswer(function (desc) {
                    console.log('createAnswer', desc);
                    pc.setLocalDescription(desc, function () {
                        console.log('setLocalDescription', pc.localDescription);
                        socket.emit('exchange', {
                            'to': fromId,
                            'sdp': pc.localDescription
                        });
                    }, serverEvents.logError);
                }, serverEvents.logError);
        }, serverEvents.logError);
    } else {
        console.log('exchange candidate', data);
        pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
}
//Join conversation
// let handleJoinConversationClick = () => {
//     let name = $(".join-container .name").val();
//     if (name == null || name == "") {
//         alert("Name cannot be empty");
//         return;
//     }
//     //ELSE:
//     join(VIDEO_CONFERENCE_ROOM, name, () => {
//         $(".join-container").hide();
//         $(".videos-container").show();
//         $(".chat-container").show();
//     });
// }

window.onFriendLeft = (socketId) => {
    debugger;
    $("#friend-" + socketId).remove();
}


// function join(roomId, name, callback) {

// }

function createPeerConnection(friend, isOffer) {
    console.log('offer status:', isOffer);

    let socketId = friend.socketId;
    var retVal = new RTCPeerConnection(configuration);

    peerConnections[socketId] = retVal;

    retVal.onicecandidate = function (event) {
        console.log('onicecandidate', event);
        if (event.candidate) {
            socket.emit('exchange', {
                'to': socketId,
                'candidate': event.candidate
            });
        }
    };

    function createOffer() {
        retVal.createOffer(function (desc) {
            console.log('createOffer', desc);
            retVal.setLocalDescription(desc, function () {
                console.log('setLocalDescription', retVal.localDescription);
                socket.emit('exchange', {
                    'to': socketId,
                    'sdp': retVal.localDescription
                });
            }, socketEvents.logError);
        }, socketEvents.logError);
    }

    retVal.onnegotiationneeded = function () {
        console.log('onnegotiationneeded');
        if (isOffer) {
            createOffer();
        }
    }

    retVal.oniceconnectionstatechange = function (event) {
        console.log('oniceconnectionstatechange', event);
        if (event.target.iceConnectionState === 'connected') {
            createDataChannel();
        }
    };

    retVal.onsignalingstatechange = function (event) {
        console.log('onsignalingstatechange', event);
    };

    retVal.onaddstream = function (event) {
        console.log('onaddstream', event);
        //var element = document.createElement('video');
        //element.id = "remoteView" + socketId;
        //element.autoplay = 'autoplay';
        //element.src = URL.createObjectURL(event.stream);
        //remoteViewContainer.appendChild(element);
        if (socketEvents.onFriendCallback != null) {
            socketEvents.onFriendCallback(socketId, event.stream);
        }
    };

    debugger;
    if(localStream == null)
        console.log(localStream);
    retVal.addStream(localStream);

    return retVal;
}