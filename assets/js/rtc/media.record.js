"use strict";
var canRecord = true;
var rootUrl = 'https://hcm-manager-dev.opthemateknoloji.com';
var rootUrlHttp = 'http://hcm-manager-dev.opthemateknoloji.com';

var serviceUrl = api.getApiRoot();
var resizefunc = [];
let interviewAutoStart = true;

var last;
var refToMediaStream;
var socket;
var hasRecordStart = false;
var recordVideoSeparately = !!navigator.webkitGetUserMedia;
navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.getUserMedia;
var connection;
var streams = [];
var multiStreamRecorder = null;
var streamSources = []; //{ "stream" = null, "streamId" = "", "socketId" = "", "userKey" = "", "onlyAudio" = false }

var isAdded = false;
var randomString = (Math.random() * 1000).toString().replace('.', '');

var chat;

var isRecording = false;
var mediaStream = null;
var mediaElements = [];
var chatContainer = document.querySelector('.chat-output');

var isStartedWithApplyer = false;
var isStartedWithListener = false;
var isStarted = false;

function getAuthenticationToken() {
    return api.getKey();
}

var InterviewNoteTypes = {
    Cv: 1,
    Qualification: 2,
    Message: 3,
    GeneralNote: 4
};

function addInterviewNote(interViewId, subQualificationId, content, noteType) {
    var contentData = $('#' + content).val();
    api.post(api.getApiRoot() + '/Conferance/AddInterviewNote', {
        JobApplyInterviewId: interViewId,
        SubQualificationId: subQualificationId,
        Content: contentData,
        Type: noteType
    }, function (response) {
        chat.server.addInterviewNote(window.credential.RoomKey, response.Data);
        $('#' + content).val('');
    });
}

function addQualificationVote(intId, qId, value) {
    api.post(api.getApiRoot() + '/Conferance/AddQualificationVote', {
        interviewId: intId,
        qualificationId: qId,
        vote: value
    }, function (response) {
        if (response.Code === "101") {
            //Todo
        }
    });
}

$(document).ready(function () {
    window.currentUsers = [];
    window.userVideos = [];
    window.mobileUsers = [];
    window.lastBoxLeft = 0;

    $('.logo').attr('href', 'check?r=' + api.getQueryString('r') + '&u=' + api.getQueryString('u'));
    $('#start-interview').on('click', function () {
        windowEvents.startInterview();
    });

    $('#start-record').on('click', function () {
        windowEvents.startRecord();
    });

    $('#pause-record').on('click', function () {
        if (window.credential.InterviewCredentialTypes === 2) {
            windowEvents.pauseOrResumeInterview();
        }
    });

    $('#btn-reconnect').on('click', function () {
        loadLocalStream(true);
        setTimeout(function () {
            var roomId = api.getQueryString('r');
            var name = api.getQueryString('u');
            join(roomId, name, function () {
                console.log("Join Completed");
            });
        }, 2000);
    });
    var dataToPost = {
        Roomkey: api.getQueryString('r'),
        Userkey: api.getQueryString('u')
    };

    $(window).resize(function () {
        windowEvents.calculateBoxesOnResize();
    });

    setInterval(function () {
        serverEvents.checkRoomUsers(window.currentUsers);
    }, 1000);

    api.post(serviceUrl + '/InterviewApi/CheckUser', dataToPost, function (response) {
        if (!response.Exists) {
            location.href = '/404' + window.location.search;
            window.credential = null;
        }
        if (response.HasDone) {
            location.href = '/completed' + window.location.search;
            window.credential = null;
        } else if (response.UserId > 0) {
            $('.record-area').show();
            $('.navbar-right').show();
            var credential = response;

            credential.Users.forEach(function (userpdf) {
                if (credential.UserId === userpdf.UserId) {
                    credential.Photo = userpdf.Photo;
                }
            });


            console.log('credential bilgisi alındı');
            window.credential = credential;
            console.log(window.credential);
            //Todo:sadece ilan sorumlusu görebilecek

            var connection = new signalR.HubConnectionBuilder().withUrl(serviceUrl + '/InterviewHub' /*, { accessTokenFactory: () => 'Bearer ' + api.getKey() }*/ ).build();

            connection.client = {};
            connection.server = {
                checkUser: (credential) => {
                    connection.invoke('CheckUser', credential).catch(err => console.error(err.toString()));
                },
                checkUsers: (roomKey) => {
                    connection.invoke('CheckUsers', roomKey).catch(err => console.error(err.toString()));
                },
                addInterviewNote: (roomkey, note) => {
                    connection.invoke('AddInterviewNote', roomkey, note).catch(err => console.error(err.toString()));
                },
                deleteInterviewNote: (roomkey, userId, nId) => {
                    connection.invoke('DeleteInterviewNote', roomkey, userId, nId).catch(err => console.error(err.toString()));
                },
                endInterview: (roomKey) => {
                    connection.invoke('EndInterview', roomKey).catch(err => console.error(err.toString()));
                },
                joinInterview: (roomKey) => {
                    connection.invoke('JoinInterview', roomKey).catch(err => console.error(err.toString()));
                },
                keyRequested: (roomKey, keys) => {
                    connection.invoke('KeyRequested', roomKey, keys).catch(err => console.error(err.toString()));
                },
                moveInterviewNote: (roomkey, note) => {
                    connection.invoke('MoveInterviewNote', roomkey, note).catch(err => console.error(err.toString()));
                },
                needReconnection: (roomKey, userKey) => {
                    connection.invoke('NeedReconnection', roomKey, userKey).catch(err => console.error(err.toString()));
                },
                pauseRecord: (roomKey) => {
                    connection.invoke('PauseRecord', roomKey).catch(err => console.error(err.toString()));
                },
                resumeRecording: (roomKey) => {
                    connection.invoke('ResumeRecording', roomKey).catch(err => console.error(err.toString()));
                },
                sendPrivate: (roomkey, userId, message) => {
                    connection.invoke('SendPrivate', roomkey, userId, message).catch(err => console.error(err.toString()));
                },
                sendPublic: (roomkey, userId, message) => {
                    connection.invoke('SendPublic', roomkey, userId, message).catch(err => console.error(err.toString()));
                },
                startRecord: (roomKey) => {
                    connection.invoke('StartRecord', roomKey).catch(err => console.error(err.toString()));
                },
                updateInterviewNote: (roomkey, userId, noteId, newText) => {
                    connection.invoke('UpdateInterviewNote', roomkey, userId, noteId, newText).catch(err => console.error(err.toString()));
                },
                updateRecordingStatus: (roomKey) => {
                    connection.invoke('UpdateRecordingStatus', roomKey).catch(err => console.error(err.toString()));
                },
                updateVideoId: (roomId, userId, videoId) => {
                    connection.invoke('UpdateVideoId', roomId, userId, videoId).catch(err => console.error(err.toString()));
                }
            };

            connection.connectionSlow = () => {};
            connection.reconnecting = () => {};
            connection.reconnected = () => {};
            connection.disconnected = () => {};
            connection.onclose = (error) => {
                connection.lastError = error;
                connection.disconnected(error);
            };

            $.connection = {
                hub: connection,
                interviewHub: connection
            };

            chat = $.connection.interviewHub;

            $.connection.hub.connectionSlow(function () {
                console.log(' #-> Connection slow');
                Messages.Alert('Uyarı', 'Yavaş bağlantı algılandı.');
            });
            $.connection.hub.reconnecting(function () {
                console.log(' #-> Connection reConnecting');
                Messages.Alert('Uyarı', 'Yeniden bağlanılıyor.');
            });
            $.connection.hub.reconnected(function () {
                console.log(' #-> Connection reConnected');
                Messages.Success('Uyarı', 'Bağlantı kuruldu.');
            });

            $.connection.hub.disconnected(function () {
                setTimeout(function () {
                    $.connection.hub.start();
                }, 5000);

                if ($.connection.hub.lastError) {
                    //alert("Disconnected. Reason: " + $.connection.hub.lastError.message);
                    Messages.Alert('Uyarı', 'Bağlantı kesildi.');
                }
            });

            connection.on('checkRoomUsers', serverEvents.checkRoomUsers);

            connection.on('checkRoomUsers', serverEvents.checkRoomUsers);
            connection.on('echoPrivateMessage', serverEvents.echoPrivateMessage);
            connection.on('echoPublicMessage', serverEvents.echoPublicMessage);

            connection.on('startRecord', serverEvents.startRecord);
            connection.on('joinInterview', serverEvents.joinInterview);
            connection.on('pauseRecord', serverEvents.pauseRecord);
            connection.on('resumeRecording', serverEvents.resumeRecording);
            connection.on('endInterview', serverEvents.endInterview);

            connection.on('updateVideoId', serverEvents.updateVideoId);

            connection.on('addInterviewNote', serverEvents.addInterviewNote);
            connection.on('deleteInterviewNote', serverEvents.deleteInterviewNote);
            connection.on('updateInterviewNote', serverEvents.updateInterviewNote);
            connection.on('moveInterviewNote', serverEvents.moveInterviewNote);
            connection.on('connectionUserAlive', function (roomKey, userKey) {
                if (roomKey !== window.credential.RoomKey) {
                    return;
                }
                var isUserFinded = false;
                window.mobileUsers.forEach(function (user, key) {
                    if (user.RefKey === userKey) {
                        isUserFinded = true;
                        user.isAlive = true;
                        user.isAliveTime = moment();
                        serverEvents.checkRoomUsers(window.currentUsers);
                    }
                });
                if (isUserFinded === false) {
                    window.credential.Users.forEach(function (user, key) {
                        if (user.RefKey === userKey) {
                            user.isAlive = true;
                            user.isAliveTime = moment();
                            window.mobileUsers.push(user);
                            serverEvents.checkRoomUsers(window.currentUsers);
                            Messages.Success('Bilgi', 'Mobil kullanıcı bağlandı(' + user.Name + ').');
                        }
                    });
                }
            });
            connection.on('connectionKeyRequested', function (roomKey, userKey, adminKey, applyerKey, listenerKey) {
                if (roomKey !== window.credential.RoomKey) {
                    return;
                }
                window.credential.Users.forEach(function (user, key) {
                    if (user.RefKey === userKey) {
                        switch (user.InterviewCredentialTypes) {
                            case 1:
                                window.credential.AdminSingleUseKey = adminKey;
                                window.credential.ApplyerSingleUseKey = applyerKey;
                                window.credential.ListenerSingleUseKey = listenerKey;
                                if (isStartedWithApplyer == true) {
                                    windowEvents.showApplyerVideo();
                                }
                                break;
                            case 3:
                                window.credential.AdminSingleUseKey = adminKey;
                                window.credential.ListenerSingleUseKey = listenerKey;
                                if (isStartedWithApplyer == true) {
                                    windowEvents.showApplyerVideoForListener();
                                }
                                break;
                        }
                        user.isAlive = true;
                        user.isAliveTime = moment();
                        window.mobileUsers.push(user);
                        serverEvents.checkRoomUsers(window.currentUsers);
                        Messages.Success('Bilgi', 'Mobil kullanıcı bağlandı(' + user.Name + ').');
                    }
                });
            });

            connection.on('updateRecordingStatus', function () {
                console.log('Recording!');
            });
            window.chatHub = chat;
            //
            $.connection.hub.disconnected(function () {
                socketEvents.disconnected();
            });
            $('#spnTitle').text(response.Advert.Title);
            async function start() {
                try {
                    await connection.start();
                } catch (err) {
                    console.log(err);
                    setTimeout(() => start(), 5000);
                }
            };

            connection.onclose(async () => {
                await start();
            });
            connection.start().then(() => {
                windowEvents.drawUsers();
                windowEvents.drawBoxes();

                chat.server.checkUser(window.credential);
                chat.server.checkUsers(window.credential.RoomKey);
            });
            // $.connection.hub.start().done(function () {
            //     windowEvents.drawUsers();
            //     windowEvents.drawBoxes();

            //     chat.server.checkUser(window.credential);
            //     chat.server.checkUsers(window.credential.RoomKey);
            //     //socketEvents.startSocket();
            // });

            windowEvents.initialInterview();
        } else {
            window.credential = null;
        }
    });
});

var serverEvents = {
    startRecord: function () {
        //Kayıt işemine başla kullanıcıyı uyar.
        if (window.credential.InterviewCredentialTypes === 2) {
            // if (windowEvents.checkStart() === true) {

            //     setTimeout(() => {
            //         windowEvents.recorderStart();
            //     }, 5000);
            // }
            let timerInterval;
            Swal.fire({
                title: 'Kayıt <strong></strong> saniye içerisinde başlayacaktır.',
                text: 'Tam ekranda devam etmek ister misiniz?',
                html: 'Kayıt <strong></strong> saniye içerisinde başlayacaktır',
                showConfirmButton: true,
                confirmButtonColor: '#BB54D3',
                confirmButtonText: 'Evet',
                showCancelButton: true,
                cancelButtonText: 'Hayır',
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                timer: 10000,
                onBeforeOpen: () =>{
                    timerInterval = setInterval(() => {
                        Swal.getContent().querySelector('strong')
                      .textContent = (Swal.getTimerLeft() / 1000).toFixed(0)
                  }, 100)}
            }).then(
                function (dismiss) {
                    if (dismiss === 'cancel') {} else {
                        document.getElementById("btn-fullscreen").click();
                        // var elem = document.getElementById('interview-join-btn');
                        // if (elem.requestFullscreen) {
                        //     elem.requestFullscreen();
                        // } else if (elem.msRequestFullscreen) {
                        //     elem.msRequestFullscreen();
                        // } else if (elem.mozRequestFullScreen) {
                        //     elem.mozRequestFullScreen();
                        // } else if (elem.webkitRequestFullscreen) {
                        //     elem.webkitRequestFullscreen();
                        // }
                    }
                }
            );
        } else {
            let timerInterval;
            Swal.fire({
                title: 'Kayıt hazırlanıyor',
                html: 'Kayıt <strong></strong> saniye içerisinde başlayacaktır',
                showConfirmButton: false,
                showCancelButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                timer: 5000,
                onBeforeOpen:() => {
                    Swal.showLoading();
                    timerInterval = setInterval(() => {
                        Swal.getContent().querySelector('strong').textContent = (Swal.getTimerLeft() / 1000)
                        .toFixed(0)
                  }, 100)}
            });
        }

        isRecording = true;
        windowEvents.updateRecordStatus(isRecording);
    },
    joinInterview: function () {
        isStarted = true;
        var credentialData = window.credential;
        $('#btn-reconnect').show();
        loadLocalStream(true);
        //windowEvents.showMyVideo()
        $('div[aria-describedby="divUsers"]').hide();
        if (credentialData.InterviewCredentialTypes === 2) {
            setTimeout(function () {
                // socketEvents.startSocket();
                //setTimeout(() => {

                var roomId = api.getQueryString('r');
                var name = api.getQueryString('u');

                join(roomId, name, function () {
                    console.log("Join Completed");
                });
            }, 1000);
        }
        if (isStarted) {
            if (credentialData.InterviewCredentialTypes !== 2) {
                // socketEvents.startSocket();
                setTimeout(() => {
                    var roomId = api.getQueryString('r');
                    var name = api.getQueryString('u');

                    join(roomId, name, function () {
                        console.log("Join Completed");
                    });
                }, 2000);
            }
            windowEvents.showVideo();
        } else {
            swal({
                title: 'Mülakat başlıyor lütfen bekleyin!',
                text: '',
                timer: 5000,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                showConfirmButton: false,
                showCancelButton: false,
                onOpen: function () {
                    swal.showLoading();
                }
            }).then(
                function () {},
                // handling the promise rejection
                function (dismiss) {
                    if (credentialData.InterviewCredentialTypes !== 2) {
                        // socketEvents.startSocket();
                        setTimeout(() => {
                            var roomId = api.getQueryString('r');
                            var name = api.getQueryString('u');

                            join(roomId, name, function () {
                                console.log("Join Completed");
                            });
                        }, 2000);
                    }
                    windowEvents.showVideo();
                }
            );
        }

    },
    pauseRecord: function () {
        console.log('chat.client.pauseRecord');
        if (window.credential.InterviewCredentialTypes === 2) {
            if (canRecord) {
                console.log('RecorderHelper.paused :' + isRecording);
                if (isRecording === false) {
                    $('#recordStatus').data('saving', '1');

                    windowEvents.recorderStart();
                    isRecording = true;
                } else {
                    $('#recordStatus').data('saving', '0');
                    isRecording = false;
                    multiStreamRecorder.stop();

                }
                windowEvents.updateRecordStatus(isRecording);
            }
        } else {
            isRecording = !isRecording;
            windowEvents.updateRecordStatus(isRecording);
        }
    },
    resumeRecording: function () {
        if (window.credential.InterviewCredentialTypes === 2) {
            if (canRecord) {
                console.log(RecorderHelper);
                windowEvents.recorderStart();
                isRecording = true;
            }
        }
    },
    endInterview: function () {
        isStarted = false;
        if (window.credential.InterviewCredentialTypes === 2 && isRecording) {
            if (multiStreamRecorder == null) {
                multiStreamRecorder.stop();
            }
        }
        try {
            connection.closeEntireSession();
        } catch (e) {

        }

        setTimeout(function () {
            location.href = '/completed' + window.location.search;
        }, 1000);
        $('.ui-dialog').hide();
        $('.navbar-right').hide();
        $('.content .container').html('<div class="end-interview-result"><div class="col-md-6"><img class="img-responsive" src="/assets/images/end-icon2.png"></div><div class="col-md-6"><h2>Mülakat tamamlandı.</h2><h4>Katıldığınız için teşekkür ederiz...</h4></div></div>');
    },
    echoPrivateMessage: function (userPhotoBase64, date, name, message) {
        console.log('Private message not completed');
    },
    echoPublicMessage: function (userPhotoBase64, date, name, message) {
        $.ChatApp.addMessage(message, name, api.getApiRoot() + userPhotoBase64, date);
        $('.conversation-list').scrollTo('100%', '100%', {
            easing: 'swing'
        });
        windowEvents.playNotify();
    },
    checkRoomUsers: function (userList) {

        var applyer = windowEvents.getUserByType(1);
        if (applyer === null) return;
        let applyerFromUserList = userList.filter(user => user == applyer.UserId)[0];

        //Eğer mülakat başlamışsa ve yeni bir kullanıcı gelmişse onu mülakata kat.
        if (window.currentUsers.length < userList.length &&
            isStarted &&
            window.credential.InterviewCredentialTypes === 2 &&
            userList.length > 1 &&
            applyerFromUserList === applyer.UserId) {
            setTimeout(() => {
                windowEvents.startInterview();
            }, 1000);
        }


        $.each(window.credential.Users,
            function () {
                var onlineArea = $('#user-' + this.UserId + '-is-online');
                var offlineArea = $('#user-' + this.UserId + '-is-offline');
                onlineArea.hide();
                offlineArea.show();
            });
        window.currentUsers = userList;
        $.each(userList,
            function () {
                //var userLineArea = '.user-@UserId@'.replace('@UserId@', this);
                //var activityArea = $(userLineArea);
                //var onlineArea = activityArea.find('#user-' + this + '-is-online');
                //var offlineArea = activityArea.find('#user-' + this + '-is-offline');
                var onlineArea = $('#user-' + this + '-is-online');
                var offlineArea = $('#user-' + this + '-is-offline');
                onlineArea.show();
                offlineArea.hide();
            });

        $.each(window.mobileUsers,
            function () {
                if (this.isAliveTime > moment().add(-10, 'seconds')) {
                    var onlineArea = $('#user-' + this.UserId + '-is-online');
                    var offlineArea = $('#user-' + this.UserId + '-is-offline');
                    onlineArea.show();
                    offlineArea.hide();
                    if (window.currentUsers.indexOf(this.UserId) == -1) {
                        window.currentUsers.push(this.UserId);
                    }
                } else {
                    var index = window.currentUsers.indexOf(this.UserId);
                    if (index > -1) {
                        window.currentUsers.splice(index, 1);
                    }
                }
            });


        if (interviewAutoStart === true && isStarted === false && window.currentUsers.length > 1) {
            windowEvents.startInterview();
            serverEvents.joinInterview();
        }
    },
    updateVideoId: function (response) {
        window.lastBoxLeft = 0;
        var interviewCredentialType = null;
        var userName = '';
        window.credential.Users.forEach(function (user) {
            if (user.UserId === response.UserId) {
                interviewCredentialType = user.InterviewCredentialTypes;
                userName = user.Name;
            }
        });

        //Daha önceden eklenen veri varsa sil
        var removeIndex = -1;
        window.userVideos.forEach(function (userVideo, i) {
            if (userVideo.userId === response.UserId) {
                removeIndex = i;
            }
        });

        if (removeIndex > -1) {
            window.userVideos.splice(removeIndex, 1);
        }
        //Silme tamamlandı ise

        //Listeye ekle ve güncelle.
        window.userVideos.push({
            userId: response.UserId,
            videoId: response.VideoId,
            interviewCredentialType,
            userName
        });
        windowEvents.updateVideoContainers();
    },
    addInterviewNote: function (photo, response) {
        windowEvents.addNote(response, photo);
        window.credential.UserNotes.push(response);
        if (response.Type === InterviewNoteTypes.Cv) {
            windowEvents.drawPin(response);
        } else {
            windowEvents.addQualificationNote(response);
        }
    },
    deleteInterviewNote: function (noteId) {
        $('.qualification-row[data-id="' + noteId + '"]').remove();
        $('#note_' + noteId).remove();

        var noteCount = $('.inbox-item').length;
        $('.tab-badge').html(parseInt(noteCount));
    },
    updateInterviewNote: function (response) {
        if (response.Code === 101) {
            windowEvents.updateNoteText(response.Data.NoteId, response.Data.Content);
        }
    },
    moveInterviewNote: function (photo, clickEvent) {
        var maxWidth = parseFloat($('#pdf-click-container').width());
        var maxHeight = parseFloat($('#pdf-click-container').height());

        if (maxWidth !== parseFloat(clickEvent.Width) || maxHeight !== parseFloat(clickEvent.Height)) {
            var newLeft = parseFloat(clickEvent.Left) / parseFloat(clickEvent.Width) * maxWidth;
            var newTop = parseFloat(clickEvent.Top) / parseFloat(clickEvent.Height) * maxHeight;
            if (maxHeight !== 0) {
                clickEvent.Top = newTop;
                clickEvent.Height = maxHeight;
            }

            clickEvent.Left = newLeft;
            clickEvent.Width = maxWidth;
        }

        clickEvent.Left = (clickEvent.Width - clickEvent.Left) < 20 ? clickEvent.Width - 20 : clickEvent.Left;

        $('#pin-result-' + clickEvent.NoteId).css({
            'left': clickEvent.Left + 'px',
            'top': clickEvent.Top + 'px'
        });
    }
};

var socketEvents = {
    disconnected: function () {
        chat.server.checkUsers(window.credential.RoomKey);
    },
};

var windowEvents = {
    playNotify: function () {
        document.getElementById('notify').play();
    },
    listenerIsConnected: function () {
        var listenerConnected = false;
        window.credential.Users.forEach(function (user, key) {
            if (user.InterviewCredentialTypes === 3) {
                window.currentUsers.forEach(function (currentUser, key2) {
                    if (currentUser == user.UserId) {
                        listenerConnected = true;
                    }
                });
            }
        });
        return listenerConnected;
    },
    sendPublicMessage: function (chatText) {
        chat.server.sendPublic(window.credential.RoomKey, window.credential.UserId, chatText);
        var chatTime = moment().format('h:mm');
        var user = window.credential;

        $('<li class="clearfix odd"><div class="chat-avatar"><img src="' + api.getApiRoot() + user.Photo + '" alt=""><i>' + chatTime + '</i></div><div class="conversation-text"><div class="ctext-wrap"><i>' + user.UserName + '</i><p>' + chatText + '</p></div></div></li>').appendTo('.conversation-list');
    },
    initialInterview: function () {
        var roomid = window.credential.RoomKey;
        if (localStorage.getItem('rmc-room-id')) {
            roomid = localStorage.getItem('rmc-room-id');
        } else {
            roomid = window.credential.RoomKey;
        }
        $('.username').text(window.credential.UserName);
        $('.user-imgP').attr('src', api.getApiRoot() + window.credential.Photo);

        localStorage.setItem('rmc-room-id', window.credential.RoomKey);
    },
    drawUsers: function () {

        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        w = parseInt(w) - 80;
        var hh = Math.floor(((h - 200) / 4));
        var ww = Math.floor((w / 100) * 34);
        var ww2 = Math.floor((w / 100) * 69);
        var lw = Math.floor((w / 100) * 30);
        var www = 70;
        windowEvents.updateRecordPanel(credential.InterviewCredentialTypes);

        var userText =
            '<div class="row user-row-line">\
                <div>\
                    <div class="user-photo-area">\
                        <div class="user-photo" style="background-image: url(@userPhoto@);border: 2px solid @color@; box-shadow: 0px 0px 40px -12px @color@;">\
                        </div>\
                    </div>\
                    <div class="user-line-area">\
                        <div class="user-line">@UserName@</div>\
                        <div class="user-type-line">@UserType@</div>\
                        <div class="user-status-line user user-@UserId@">\
                            <div id="user-@UserId@-is-online" style="display: none;">\
                                <div class="status-badge badge-green"><i class="fa fa-check"></i></div>\
                            </div>\
                            <div id="user-@UserId@-is-offline">\
                                <span class="user-waiting">Bekleniyor</span>\
                                <div class="status-badge badge-red"><i class="fa fa-remove"></i></div>\
                            </div>\
                        </div>\
                </div>\
            </div>';

        userText =
            '<div class="card card-small">\
                <div class="card-image" style="background-image: url(@userPhoto@);"></div>\
                <h2 class="card-title">@UserName@</h2>\
                <span class="card-subtitle">@UserType@</span>\
                <div class="card-action-bar">\
                    <p id="user-@UserId@-is-online" style="display: none;"><i class="fa fa-check" style="color: rgb(118, 203, 0);"></i></p>\
                    <p id="user-@UserId@-is-offline"><i class="fa fa-clock-o"></i>BEKLENİYOR</p>\
                </div>\
                <div class="card-usercolor" style="background-color: @color@;"></div>\
            </div>';

        $.each(credential.Users,
            function () {
                var uText = userText;
                if (this.Photo === null) {
                    uText = userText.replace("@userPhoto@", api.getApiRoot() + credential.EmptyUserPhoto);
                } else {
                    uText = userText.replace("@userPhoto@", api.getApiRoot() + this.Photo);

                }


                uText = uText.replace("@UserName@", this.Name);
                if (this.InterviewCredentialTypes === 1) {
                    uText = uText.replace("@UserType@", "Aday");
                } else if (this.InterviewCredentialTypes === 2) {
                    uText = uText.replace("@UserType@", "Mülakat Sorumlusu");
                } else if (this.InterviewCredentialTypes === 3) {
                    uText = uText.replace("@UserType@", "Katılımcı");
                } else {
                    uText = uText.replace("@UserType@", "");
                }
                uText = uText.replace("@UserId@", this.UserId);
                uText = uText.replace("@UserId@", this.UserId);
                uText = uText.replace("@color@", windowEvents.calculateColor(this.UserColor));
                $("#divUsers").append(uText);

            });

        chat.server.checkUser(window.credential);
        chat.server.checkUsers(window.credential.RoomKey);
    },
    startInterview: function () {
        //Bu method sadece manager tarafında interview durumunu güncellemek için ve mobil uygulamaya bilgi vermek için açık tutuluyor.
        //Callback tarafına ihtiyacımız yok.
        window.chatHub.server.joinInterview(window.credential.RoomKey);
    },
    startRecord: function () {
        window.chatHub.server.startRecord(window.credential.RoomKey);
    },
    pauseOrResumeInterview: function () {
        window.chatHub.server.pauseRecord(window.credential.RoomKey);
        //window.chatHub.server.resumeRecording(window.credential.RoomKey);
    },
    endInterview: function () {
        window.chatHub.server.endInterview(window.credential.RoomKey);
    },
    leaveInterview: function () {
        if (connection.isInitiator) {
            connection.closeEntireSession(function () {
                document.querySelector('h1').innerHTML = 'Entire session has been closed.';
            });
        } else {
            connection.leave();
        }
    },
    checkStart: function () {
        var adminIsConnected = false;
        var candidateIsConnected = false;

        window.currentUsers.forEach(function (userId) {
            window.credential.Users.forEach(function (user) {
                if (user.UserId === userId) {
                    switch (user.InterviewCredentialTypes) {
                        case 1:
                            candidateIsConnected = true;
                            break;
                        case 2:
                            adminIsConnected = true;
                            break;
                    }
                }
            });
        });

        return (adminIsConnected && candidateIsConnected);
    },
    showVideo: function () {
        var credentialData = window.credential;
        $("#divStart").remove();
        //$("#videos-container").show();

        if (credentialData.InterviewCredentialTypes !== 2) {
            $("#divLoading").show();
            $("#divRecord").remove();
            $('#loading-info').html('Kaydın Başlatılması Bekleniyor');
        } else {
            $("#divLoading").remove();
            $("#divRecord").show();
        }
    },
    drawBoxes: function () {
        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        window.w = w;
        window.h = h;

        var w0 = 320,
            w1 = 320,
            w2 = ((w - 320 - 100) / 2) > 450 ? 450 : ((w - 320 - 100) / 2),
            w3 = ((w - 320 - 100) / 2) > 450 ? w - 320 - 100 - 450 : ((w - 320 - 100) / 2);

        //var lPadding = Math.floor(w / 100 * 5);
        var l05 = 35;
        var l30 = 370;
        var l60 = l30 + 15 + w2;

        var t0 = 90;
        var t1 = 160;
        var tTopPadding = 10;
        var hNotes = 150;
        var hChat = 200;
        var hBigBox = 680;
        var hMidBox = 455;

        var userHeight = h - t1 - 65;

        var datas = {
            r: api.getQueryString("r"),
            u: api.getQueryString("u")
        };

        $('.record-area').css('width', w0);
        // $('.record-area').css('margin-top', '-20px');
        windowEvents.getDialogWindow($('#divUsers'), 'Katılımcılar', w0, userHeight, '', function () {
            $('[aria-describedby="divUsers"] span.ui-dialog-title').html('<span class="fa fa-group"></span>&nbsp;&nbsp;&nbsp;&nbspKatılımcılar');
        }, t1, l05);

        api.loadWithAuthentication($("#boxescontainer"), serviceUrl + "/Conferance/GetInterviewBoxes", datas, function () {

            if (h - (userHeight + 235) > hNotes) {
                hNotes = h - (userHeight + 235);
            }

            if (h - (hMidBox + 170) > hChat) {
                hChat = h - (hMidBox + 170);
            }

            if (hMidBox + hChat + t0 + 10 > h) {
                hMidBox = h - t0 - 10 - hChat - 70;
            }



            hBigBox = h - t1 - 55;

            var imgElements = $('.img-circle.img-notes-profile');
            for (var i = 0; i < imgElements.length; i++) {
                var obj = imgElements[i];
                if (obj.style["backgroundImage"].indexOf(rootUrl + ":81/") > -1) {
                    obj.style["backgroundImage"] = obj.style["backgroundImage"].replace(rootUrl + ":81/", api.getApiRoot());
                }
            }
            var elemenst = $("#divTabCvNotlar img");
            for (var i = 0; i < elemenst.length; i++) {
                var obj = elemenst[i];
                if (obj.src.indexOf("https://10.10.0.121") > -1) {
                    obj.src = obj.src.replace("https://10.10.0.121", api.getApiRoot());
                }
                if (obj.src.indexOf(rootUrlHttp + ":81/") > -1) {
                    obj.src = obj.src.replace(rootUrlHttp + ":81/", api.getApiRoot());
                }
            }
            $('.chat-input').keypress(function (e) {
                if (e.which == 13) {
                    var msg = $('.chat-input').val();
                    windowEvents.sendPublicMessage(msg);
                    $('.chat-input').val('');
                    $('.chat-input').focus();
                    $('.conversation-list').scrollTo('100%', '100%', {
                        easing: 'swing'
                    });
                    $('#conversationPublic').scrollTo('100%', '100%', {
                        easing: 'swing'
                    });
                    return false;
                }
            });

            // windowEvents.getDialogWindow($('#tabNotes'), 'Notlar', w0, hNotes, '', function () {
            //     $('[aria-describedby="tabNotes"] span.ui-dialog-title').html('<span class=\"fa fa-pencil\"></span>&nbsp;&nbsp;&nbsp;&nbsp;Notlar');
            // }, t1 + tTopPadding + userHeight, l05);

            /* Yekinlikler - Yıldızlar*/
            $('#qualGenel').rating(function (vote, g) {
                var evaluationType = parseInt($('input[name="generalApplyerEvaluation"]:checked').val());
                var dataToPost = {
                    candidateId: window.credential.CandidateId,
                    generalEvaluation: evaluationType === 1 ? 2 : evaluationType === 2 ? 3 : 4, //2 Olumlu, 3 Olumsuz
                    point: evaluationType === 1 ? $('#qualGenelEvaluation .stars .fullStar').length : null
                }

                api.post(api.getApiRoot() + '/InterviewVideo/SaveGeneralApplyerEvaluation/', dataToPost, function (r) {
                    console.log('Kayıt', r);
                });
            });

            $('#qualGenelEvaluation').rating(function (vote, g) {
                var qId = $(g.target).data('qualid');
                $('#vote_' + qId).val(vote);
                addQualificationVote(window.credential.InterviewId, qId, vote);
            });

            $('#evaluationInterview').rating(function (vote, g) {
                var qId = $(g.target).data('qualid');
                $('#evaluationInterviewScore').val(vote);
                addQualificationVote(window.credential.InterviewId, qId, vote);
            });

            $.each(window.credential.JobAdverts, function (a, b) {
                $('#job-advert-evaluation-' + this.Id).rating(function (vote, g) {
                    //var qId = $(g.target).data('qualid');
                    //$('#vote_' + qId).val(vote);
                    //addQualificationVote(window.credential.InterviewId, qId, vote);
                    var obj = $(g.target).parent().parent();
                    var jobId = obj.attr('data-jobAdvertId');

                    var evaluationType = parseInt($('input[data-id="54"]:checked').val());
                    var dataToPost = {
                        candidateId: window.credential.CandidateId,
                        evaluation: evaluationType === 1 ? 3 : 2, //3 Olumlu, 2 Olumsuz
                        jobAdvertId: jobId,
                        point: evaluationType === 1 ? $('#job-advert-evaluation-54 .stars .fullStar').length : null
                    }

                    api.post(api.getApiRoot() + '/InterviewVideo/SaveJobAdvertCandidateEvaluation/', dataToPost, function (r) {
                        console.log('Kayıt', r);
                    });
                });
            });

            $.each(window.credential.SubQuals, function (a, b) {
                $('#qual-' + this.Id + '-' + this.RefKey).rating(function (vote, g) {
                    var obj = $(g.target).parent().parent();
                    var qId = obj.attr('data-qualificationId');
                    var jobId = obj.attr('data-jobAdvertId');
                    $('#vote-' + qId + '-' + jobId).val(vote);

                    addQualificationVote(window.credential.InterviewId, qId, vote);
                    for (var i = 1; i <= vote; i++) {
                        var star = $('span[data-qualificationId="' + qId + '"] a.star[title="' + i + '"]');
                        star.addClass('fullStar');
                    }
                });
            });

            /* Yekinlikler - Notlar*/
            //qualification-body-general
            $.each(window.credential.UserNotes, function () {
                if (this.Type === 2 && this.SubQualificationId == null) {
                    var dataTemp = '<div class="qualification-row" data-id="' + this.NoteId + '">\
                        <button class="btn btn-primary btn-xs" data-id="' + this.NoteId + '"><i class="fa fa-edit" onclick="windowEvents.editNote(\'' + this.NoteId + '\', true);"></i></button>\
                        <button class="btn btn-danger btn-xs" data-id="' + this.NoteId + '"><i class="fa fa-trash" onclick="windowEvents.deleteNote(\'' + this.NoteId + '\');"></i></button>\
                        <label class="editable-qualification" data-id="' + this.NoteId + '">' + this.Content + '</label></div>';
                    $('#qualification-row-general-interview').append(dataTemp);
                } else if (this.Type === 4 && this.SubQualificationId == null) {
                    var dataTemp = '<div class="qualification-row" data-id="' + this.NoteId + '">\
                        <button class="btn btn-primary btn-xs" data-id="' + this.NoteId + '"><i class="fa fa-edit" onclick="windowEvents.editNote(\'' + this.NoteId + '\', true);"></i></button>\
                        <button class="btn btn-danger btn-xs" data-id="' + this.NoteId + '"><i class="fa fa-trash" onclick="windowEvents.deleteNote(\'' + this.NoteId + '\');"></i></button>\
                        <label class="editable-qualification" data-id="' + this.NoteId + '">' + this.Content + '</label></div>';
                    $('#qualification-row-general').append(dataTemp);
                }
            });

            //qualification-row-id
            $.each(window.credential.SubQuals, function () {
                var qualId = this.Id;
                var jobAdvertId = this.RefKey;
                $.each(credential.UserNotes, function () {
                    if (this.Type === 2 && this.SubQualificationId === qualId) {
                        var dataTemp = '<div class="qualification-row" data-id="' + this.NoteId + '">\
                        <button class="btn btn-primary btn-xs" data-id="' + this.NoteId + '"><i class="fa fa-edit" onclick="windowEvents.editNote(\'' + this.NoteId + '\', true);"></i></button>\
                        <button class="btn btn-danger btn-xs" data-id="' + this.NoteId + '"><i class="fa fa-trash" onclick="windowEvents.deleteNote(\'' + this.NoteId + '\');"></i></button>\
                        <label class="editable-qualification" data-id="' + this.NoteId + '">' + this.Content + '</label></div>';
                        $('#qualification-row-' + jobAdvertId + '_' + qualId).append(dataTemp);
                    }
                });
            });

            $('.qualification-new-input').keydown(function (evt) {
                if (evt.keyCode === 13) {
                    $(evt.currentTarget.nextElementSibling).click();
                }
            });

            if (window.credential.InterviewCredentialTypes !== 1) {
                windowEvents.getDialogWindow($('#tabQual'), "Aday Değerlendirme", w2, hMidBox, '', function () {
                    $('[aria-describedby="tabQual"] span.ui-dialog-title').html('<span class="fa fa-star"></span>&nbsp;&nbsp;&nbsp;&nbsp;Aday Değerlendirme');
                }, t0, l30);
            }

            windowEvents.getDialogWindow($('#conversationPublic'), "Sohbet", w2, hChat + 5, '', function () {
                $('[aria-describedby="conversationPublic"] span.ui-dialog-title').html('<span class="tas tas-comment"></span>&nbsp;&nbsp;&nbsp;&nbsp;Sohbet');
                $('.conversation-list').css('min-height', hChat - 90);
                $('.conversation-list').css('max-height', hChat - 90);
                $('#conversationPublic').resize(function (e) {
                    var hei = $(this).height();
                    $('.conversation-list').css('min-height', hei - 81);
                    $('.conversation-list').css('max-height', hei - 81);
                });
            }, hMidBox + t0 + 10, l30, 300);


            windowEvents.getDialogWindow($('#tabcv'), "Aday Bilgileri", w3, hBigBox, '', function (obj) {
                $("#tabcv").before($("#nav-cv"));
                var url = rootUrl + "/Domain/GetFileFromMinio/?id=" + window.credential.UserCv.Path;

                window.credential.userCv = url;
                if (window.credential.UserNotes != null) {
                    $('#divcvtab').html('<div class="pdf-zoom-controls">\
                    <button class="pdf-button" id="pdf-button-tag-marking"><i class="fa fa-commenting"></i></button>\
                    <button class="pdf-button" id="pdf-button-reset-zoom"><i class="fa fa-arrows-alt"></i></button>\
                    <button class="pdf-button" id="pdf-button-add-zoom"><i class="fa fa-plus"></i></button>\
                    <button class="pdf-button" id="pdf-button-remove-zoom"><i class="fa fa-minus"></i></button>\
                    </div><div class="pdf-click-container" id="pdf-click-container" style="display:none;"></div><div class="pdf-container" id="pdf-container"></div>\
                    <div class="pdf-pin-container"><div class="pin-area" style="display: none;"><input type="text" class="pin-data" name="pin-data" value="" /><button class="pin-save-button">Kaydet</button></div></div>');
                } else {
                    $('#divcvtab').html('<div class="pdf-zoom-controls">\
                        <button class="pdf-button" id="pdf-button-reset-zoom"><i class="fa fa-arrows-alt"></i></button>\
                        <button class="pdf-button" id="pdf-button-add-zoom"><i class="fa fa-plus"></i></button>\
                        <button class="pdf-button" id="pdf-button-remove-zoom"><i class="fa fa-minus"></i></button>\
                        </div><div class="pdf-click-container" id="pdf-click-container" style="display:none;"></div><div class="pdf-container" id="pdf-container"></div>\
                        <div class="pdf-pin-container"><div class="pin-area" style="display: none;"><input type="text" class="pin-data" name="pin-data" value="" /><button class="pin-save-button">Kaydet</button></div></div>');
                }
                pdfJsRenderer.render(window.credential.userCv, {
                    scale: 1.5
                }, function (e) {
                    if (e) {
                        // $('.pin-area').show();
                    } else {
                        $('.pin-area').hide();
                    }
                    $('#pdf-button-reset-zoom').click();
                    $('#pdf-button-add-zoom').click();
                    $('#pdf-button-remove-zoom').click();
                }, windowEvents.drawNewPin, windowEvents.zoomChanged);

                if (window.credential.UserNotes != null) {
                    window.credential.UserNotes.forEach(function (userNote) {
                        if (userNote.Type === InterviewNoteTypes.Cv) {
                            windowEvents.drawPin(userNote);
                        }
                    }, this);
                    windowEvents.zoomChanged();
                }

                $('.pin-comment-data,.pin-comment-remove,.comment-photo').on('click', function (e) {
                    $('.pin-content').removeClass('pin-active');
                });
                $('.pin-save-button').on('click', function (e) {
                    var pinInputElement = $('.pin-data');
                    var pinText = pinInputElement.val();

                    if (pinText === undefined || pinText === '') {
                        return;
                    }

                    var pinDetails = JSON.parse(pinInputElement.data('state'));

                    api.post(api.getApiRoot() + '/Conferance/AddInterviewNote', {
                        JobApplyInterviewId: window.credential.InterviewId,
                        Content: pinText,
                        Top: parseFloat(pinDetails.realY),
                        Left: parseFloat(pinDetails.realX),
                        Width: parseFloat(pinDetails.minWidth),
                        Height: parseFloat(pinDetails.minHeight),
                        Type: 1
                    }, function (response) {
                        if (response.Code === 101) {
                            $('.pin-data').val('');
                            $('.pin-area').hide();
                            windowEvents.drawPin(response.Data);
                            chat.server.addInterviewNote(window.credential.RoomKey, response.Data);
                        }
                    });
                });

                $('#datauserCv').css('height', '100%');
                $('.note-search-input').on('keyup', function (e) {
                    windowEvents.searchNotes(e.currentTarget.value);
                });
                $('[aria-describedby="tabcv"] span.ui-dialog-title').html('<span class="fa fa-user"></span>&nbsp;&nbsp;&nbsp;&nbsp;Aday Bilgileri');
                setTimeout(function () {
                    $('.pre-con').hide();
                }, 5000);
            }, t0, l60);
            if (window.credential.InterviewCredentialTypes !== 1) {
                windowEvents.getDialogWindow($('#tabAdvert'), "Pozisyon", w2, hBigBox, 'minimize', function (obj) {
                    $('[aria-describedby="tabAdvert"] span.ui-dialog-title').html('<span class="fa fa-briefcase"></span>&nbsp;&nbsp;&nbsp;&nbsp;Pozisyon');
                }, t0, l60 - 100);

            } else {
                windowEvents.getDialogWindow($('#tabAdvert'), "Pozisyon", w2, hMidBox, '', function (obj) {
                    $('[aria-describedby="tabAdvert"] span.ui-dialog-title').html('<span class="fa fa-briefcase"></span>&nbsp;&nbsp;&nbsp;&nbsp;Pozisyon');
                }, t0, l30);

            }
        });
    },
    calculateBoxesOnResize: function () {
        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        if (w === window.w && h === window.h) return;

        var w0 = 320,
            w1 = 320,
            w2 = ((w - 320 - 100) / 2) > 450 ? 450 : ((w - 320 - 100) / 2),
            w3 = ((w - 320 - 100) / 2) > 450 ? w - 320 - 100 - 450 : ((w - 320 - 100) / 2);

        //var lPadding = Math.floor(w / 100 * 5);
        var l05 = 35;
        var l30 = 370;
        var l60 = l30 + 15 + w2;

        var t0 = 90;
        var t1 = 160;
        var tTopPadding = 10;
        var hNotes = 150;
        var hChat = 200;
        var hBigBox = 680;
        var hMidBox = 455;

        var userHeight = h - t1 - 65;

        $('.record-area').css('width', w0);
        // $('.record-area').css('margin-top', '-20px');
        windowEvents.getDialogWindow($('#divUsers'), 'Katılımcılar', w0, userHeight, '', function () {
            $('[aria-describedby="divUsers"] span.ui-dialog-title').html('<span class="fa fa-group"></span>&nbsp;&nbsp;&nbsp;&nbspKatılımcılar');
        }, t1, l05);


        if (h - (userHeight + 235) > hNotes) {
            hNotes = h - (userHeight + 235);
        }

        if (h - (hMidBox + 170) > hChat) {
            hChat = h - (hMidBox + 170);
        }

        if (hMidBox + hChat + t0 + 10 > h) {
            hMidBox = h - t0 - 10 - hChat - 70;
        }

        //hBigBox = h - 155;
        hBigBox = h - t0 - 65;


        if (window.credential.InterviewCredentialTypes !== 1) {
            windowEvents.getDialogWindow($('#tabQual'), "Aday Değerlendirme", w2, hMidBox, '', function () {
                $('[aria-describedby="tabQual"] span.ui-dialog-title').html('<span class="fa fa-star"></span>&nbsp;&nbsp;&nbsp;&nbsp;Aday Değerlendirme');
            }, t0, l30);
        }
        windowEvents.getDialogWindow($('#conversationPublic'), "Sohbet", w2, hChat + 5, '', function () {
            $('[aria-describedby="conversationPublic"] span.ui-dialog-title').html('<span class="tas tas-comment"></span>&nbsp;&nbsp;&nbsp;&nbsp;Sohbet');
        }, hMidBox + t0 + 10, l30, 300);
        windowEvents.getDialogWindow($('#tabcv'), "Aday Bilgileri", w3, hBigBox, '', function (obj) {
            $('[aria-describedby="tabcv"] span.ui-dialog-title').html('<span class="fa fa-user"></span>&nbsp;&nbsp;&nbsp;&nbsp;Aday Bilgileri');
        }, t0, l60);
        if (window.credential.InterviewCredentialTypes !== 1) {
            windowEvents.getDialogWindow($('#tabAdvert'), "Pozisyon", w2, hBigBox, 'minimize', function (obj) {
                $('[aria-describedby="tabAdvert"] span.ui-dialog-title').html('<span class="fa fa-briefcase"></span>&nbsp;&nbsp;&nbsp;&nbsp;Pozisyon');
            }, t0, l60 - 100);

        } else {
            windowEvents.getDialogWindow($('#tabAdvert'), "Pozisyon", w2, hMidBox, '', function (obj) {
                $('[aria-describedby="tabAdvert"] span.ui-dialog-title').html('<span class="fa fa-briefcase"></span>&nbsp;&nbsp;&nbsp;&nbsp;Pozisyon');
            }, t0, l30);

        }

        setTimeout(() => {
            windowEvents.setWindowOrder();
        }, 1000);
    },
    setWindowOrder: function () {
        var index_highest = parseInt($('[aria-describedby="big-video-area"]').css("z-Index"), 0);
        index_highest += 50;
        $('[aria-describedby="big-video-area"]').css('z-index', index_highest);
        index_highest += 5;
        $('[aria-describedby="my-video-area"]').css('z-index', index_highest);
        friends.forEach(connection => {
            index_highest = index_highest + 5;
            $('[aria-describedby="listener-container-' + connection.socketId + '"]').css('z-index', );
        });
    },
    getDialogWindow: function ($obj, title, w, h, type, callback, dtop, dleft, mw) {
        if (mw == null) {
            mw = 200;
        }
        var dialogOptions = {
            title: title,
            width: w,
            height: h,
            modal: false,
            resizable: true,
            draggable: true,
            close: function () {
                // $(this).remove();
            }
        };

        // dialog-extend options
        var dialogExtendOptions = {
            closable: false,
            maximizable: false,

            minimizable: true,
            position: {
                my: "left top",
                at: "left top"
            },
            minimizeLocation: "right",
            collapsable: true,
            dblclick: "minimize",
            load: function (evt, dlg) {
                // console.log("d");
                // console.log(evt);
            },
            minimize: function (evt, dlg) {
                // console.log($('*[aria-describedby="' + evt.target.id + '"]'));
                $('*[aria-describedby="' + evt.target.id + '"]').css('width', mw);


            },
            beforeMinimize: function (evt, dlg) {
                var dd = $('*[aria-describedby="' + evt.target.id + '"]');
                var ww = dd.css('width');

                // console.log(ww);
                dd.data("beforem", ww);

            },
            beforeMaximize: function (evt, dlg) {

            },
            maximize: function (evt, dlg) {
                var dd = $('*[aria-describedby="' + evt.target.id + '"]');

                var ww = dd.data("beforem");
                $('*[aria-describedby="' + evt.target.id + '"]').css("width", ww);
            },
            restore: function (evt, dlg) {

                var dd = $('*[aria-describedby="' + evt.target.id + '"]');
                var ww = dd.data("beforem");
                dd.css("width", ww);
            }
        };


        $obj.data("minimize-w", mw);
        var dialog = $obj.dialog(dialogOptions).dialogExtend(dialogExtendOptions);
        $(".ui-widget-content").css("height", "100%!important");
        $(".ui-widget-content").css("width", "100%!important");

        if (callback != undefined) {
            callback($obj);
        }
        if (type === "minimize") {
            $obj.dialogExtend("minimize");
        } else if (type === "maximize") {
            $obj.dialogExtend("maximize");
        }

        if (dtop > 0 && dleft > 0) {
            $obj.parent().css({
                top: dtop,
                left: dleft
            });

        }
    },
    getUser: function (userKey) {
        var userObj = null;
        window.credential.Users.forEach(function (user) {
            if (user.RefKey === userKey) {
                userObj = user;
            }
        });
        return userObj;
    },
    showMyVideo: function (stream, muted) {

        if (window.credential.InterviewCredentialTypes == 2) {
            streamSources.forEach(streamSource => {
                if (streamSource.onlyAudio === true && streamSource.streamId === "me" && streamSource.closed === false) {
                    streamSource.closed = true;
                    streamSource.audioContext.close();
                    streamSource.audioContext = null;
                    streamSource.stream = null;
                }
            });
            var obj = {
                stream: stream,
                streamId: "me", //me.socketId,
                userKey: window.credential.UserKey,
                onlyAudio: true,
                audioContext: null,
                closed: false,
                audioStream: null
            };

            if (obj.onlyAudio === true) {
                try {
                    obj.audioContext = new AudioContext();
                    var audioContext = obj.audioContext;
                    var audioTracks = stream.getAudioTracks();
                    var audioSources = [];

                    if (audioTracks.length != null && audioTracks.length > 0) {
                        audioSources.push(audioContext.createMediaStreamSource(stream));

                        var audioDestination = audioContext.createMediaStreamDestination();
                        audioSources.forEach(function (audioSource) {
                            audioSource.connect(audioDestination);
                        });
                        obj.audioStream = audioDestination.stream;
                    }
                } catch (error) {
                    debugger;
                    obj.audioContext.close();
                    obj.closed = true;
                }
            }
            streamSources.push(obj);
        }


        var t = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 305,
            l = 35,

            w = 320,

            h = 240;

        $('#my-video').show();

        windowEvents.getDialogWindow($('#my-video-area'),

            window.credential.UserName,

            w, h, '',

            function (obj) {
                $('[aria-describedby="my-video-area"] span.ui-dialog-title').html('<span><i class="fa fa-camera"></i>&nbsp&nbsp' + window.credential.UserName + '<span>')
                if (navigator.getUserMedia) {
                    var video = document.getElementById('my-video');
                    video.srcObject = stream;
                    video.muted = muted;
                    video.onloadedmetadata = function (e) {
                        video.play();
                        $('#my-video-area').css('overflow', 'hidden');
                        $('#my-video-area').css('height', 'unset');
                    };

                } else {
                    console.log("getUserMedia not supported");
                }

            }, t, l, 300);
    },
    showUserVideo: function (userKey, stream, streamId) {

        var obj = {
            stream: stream,
            streamId: streamId,
            userKey: userKey,
            onlyAudio: true,
            audioContext: new AudioContext(),
            closed: false,
            audioStream: null
        };

        var user = windowEvents.getUser(userKey);

        if (user.InterviewCredentialTypes === 1) {
            obj.onlyAudio = false;
            obj.audioContext.close();
            obj.closed = false;
        }

        if (obj.onlyAudio === true) {

            try {
                var audioContext = obj.audioContext;
                var audioTracks = stream.getAudioTracks();
                var audioSources = [];

                if (audioTracks.length != null && audioTracks.length > 0) {
                    audioSources.push(audioContext.createMediaStreamSource(stream));

                    var audioDestination = audioContext.createMediaStreamDestination();
                    audioSources.forEach(function (audioSource) {
                        audioSource.connect(audioDestination);
                    });
                    obj.audioStream = audioDestination.stream;
                }
            } catch (error) {
                obj.audioContext.close();
                obj.closed = true;
            }
        }

        windowEvents.showBigVideo(user, stream, streamId);

        //Duruma göre büyük küçük kaldırıldı
        // if (user.InterviewCredentialTypes === 1 && (window.credential.InterviewCredentialTypes === 2 || window.credential.InterviewCredentialTypes === 3)) {
        //     //Eğer ben mülakat sorumlusu veya dinleyiciysem aday büyük olmalı.
        //     windowEvents.showBigVideo(user, stream, streamId);
        // } else if (user.InterviewCredentialTypes === 2 && window.credential.InterviewCredentialTypes === 1) {
        //     //Eğer ben adaysam ve gelen görüntü mülakat sorumlusuysa mülakat sorumlusu büyük olmalı.
        //     windowEvents.showBigVideo(user, stream, streamId);
        // } else {
        //     //Diğer kullanıcı durumları için bu kutucuk kullanılacak.
        //     console.log('Küçük geldi.')

        //     windowEvents.showMiniVideo(user, stream, streamId);
        // }

        streamSources.push(obj);
    },
    recorderStart: function () {
        if (multiStreamRecorder != null) {
            multiStreamRecorder.stop();
            multiStreamRecorder = null;
        }

        function postRecord(fileName, blob) {
            var fileType = 'video'; // or "audio"
            var formData = new FormData();
            formData.append(fileType + '-filename', fileName);
            formData.append(fileType + '-filename', fileName);
            formData.append('roomKey', window.credential.RoomKey);
            formData.append('userKey', window.credential.UserKey);
            formData.append(fileType + '-blob', blob);

            xhr('/record', formData, function (fName) {
                //Burada uygulamaya haber ver.
                window.chatHub.server.updateRecordingStatus(window.credential.RoomKey);
            });
        }

        function xhr(url, data, callback) {
            var request = new XMLHttpRequest();
            request.onreadystatechange = function () {
                if (request.readyState == 4 && request.status == 200) {
                    callback(location.href + request.responseText);
                }
            };
            request.open('POST', url);
            request.send(data);
        }

        var arrayOfStreams = [];
        streamSources.forEach(source => {
            if (source.closed === false) {
                if (source.onlyAudio === true) {
                    arrayOfStreams.push(source.audioStream);
                } else {
                    arrayOfStreams.push(source.stream);
                }
            }
        });

        $("#tabQual").append('<video id="test-record" autoplay></video>')
        multiStreamRecorder = new MultiStreamRecorder(arrayOfStreams);
        multiStreamRecorder.ondataavailable = function (blob) {
            // POST/PUT "Blob" using FormData/XHR2
            postRecord("file.webm", blob);
        };
        multiStreamRecorder.start(3000);
    },
    showBigVideo: function (user, stream, streamId) {
        debugger;
        var t = 165,
            l = 35,
            w = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 490,
            h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 490;

        windowEvents.getDialogWindow($('#big-video-area'),
            user.Name,
            w, h, '',
            function (obj) {
                $('[aria-describedby="big-video-area"] span.ui-dialog-title').html('<span><i class="fa fa-camera"></i>&nbsp&nbsp' + user.Name + '<span>')

                var videoContainer = document.getElementById('big-video-area');

                var thumbnailElement = document.createElement('div');
                thumbnailElement.id = 'user-video-container-' + streamId;

                let videoElement = document.createElement('video');
                videoElement.className = "video thumbnail";
                videoElement.autoplay = 'autoplay';
                videoElement.id = 'user-video-' + streamId;
                try {
                    videoElement.srcObject = stream;
                } catch (error) {
                    videoElement.src = URL.createObjectURL(stream);
                }

                thumbnailElement.appendChild(videoElement);

                videoContainer.appendChild(thumbnailElement);
                $('#big-video-area').css('height', 'unset');

                setTimeout(() => {
                    h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                    var videoH = $('#user-video-' + streamId).height();
                    var videoW = $('#user-video-' + streamId).width();
                    console.log(videoH, videoW);

                    $('[aria-describedby="big-video-area"]').css("height", videoH + 80);
                    $('#big-video-area').css("height", videoH + 60);
                    $('#big-video-area').css("overflow", "hidden");

                    var total_big = $('[aria-describedby="big-video-area"]').height() + 230 + 295;
                    var total_video = $('[aria-describedby="big-video-area"]').height() + 230;
                    var big = $('[aria-describedby="big-video-area"]').height();
                        $('[aria-describedby="my-video-area"]').css('top', big + 190);
                        friends.forEach(connection => {
                            $('[aria-describedby="listener-container-' + connection.socketId + '"]').css('top', big + 190);
                            $('[aria-describedby="listener-container-' + connection.socketId + '"]').click();
                    });
                    // if (total_big > h && total_video > h) {
                    //     console.log("Video full sağda diğerleri");
                    //     $('[aria-describedby="big-video-area"]').css("height", h - 230);
                    //     $('#big-video-area').css("height", h - 230);

                    //     $('[aria-describedby="my-video-area"]').css('top', h - 355);
                    //     $('[aria-describedby="my-video-area"]').css('left', videoW + 90);
                    //     var left = videoW + 90 + 260;
                    //     friends.forEach(connection => {
                    //         $('[aria-describedby="listener-container-' + connection.socketId + '"]').css('top', h - 355);
                    //         $('[aria-describedby="listener-container-' + connection.socketId + '"]').css('left', left);
                    //         $('[aria-describedby="listener-container-' + connection.socketId + '"]').click();
                    //         left += 260;
                    //     });
                    // } else if (total_video > h) {
                    //     console.log("videoyu küçült alta diğerlerini koy");
                    // } else {
                    //     var big = $('[aria-describedby="big-video-area"]').height();
                    //     $('[aria-describedby="my-video-area"]').css('top', big + 190);
                    //     friends.forEach(connection => {
                    //         $('[aria-describedby="listener-container-' + connection.socketId + '"]').css('top', big + 190);
                    //         $('[aria-describedby="listener-container-' + connection.socketId + '"]').click();
                    //     });
                    // }

                    windowEvents.setWindowOrder();
                }, 5000);

            }, t, l, 300);
    },
    onUserLeft: function (streamId, user) {
        debugger;
        //streamSources
        let streamSource = streamSources.filter(streamSource => streamSource.userKey == user)[0];

        if (streamSource.audioContext != null) {
            streamSource.audioContext.close();
            streamSource.closed = true;
        }

        if (window.credential.InterviewCredentialTypes === 1 && windowEvents.getUser(user).InterviewCredentialTypes === 2) {
            //Büyük
            $('[aria-describedby="big-video-area"]').remove();
            //$('#big-video-area').hide();
            $('#user-video-container-' + streamId).remove();
            var bigBox = document.createElement('div');
            bigBox.Id = 'big-video-area';
            document.getElementsByClassName('record-area')[0].append(bigBox);
        } else if ((window.credential.InterviewCredentialTypes === 2 || window.credential.InterviewCredentialTypes === 3) && windowEvents.getUser(user).InterviewCredentialTypes === 1) {
            //Büyük
            $('[aria-describedby="big-video-area"]').remove();
            //$('#big-video-area').hide();
            $('#user-video-container-' + streamId).remove();
            var bigBox = document.createElement('div');
            bigBox.Id = 'big-video-area';
            document.getElementsByClassName('record-area')[0].append(bigBox);
        }
        $('#listener-container-' + streamId).remove();
        Messages.Alert('Uyarı', windowEvents.getUser(user).Name + ' mülakattan ayrıldı.');

        if (isRecording) {
            Messages.Alert('Uyarı', windowEvents.getUser(user).Name + ' mülakattan ayrıldığı için kayıt durduruldu.');
            swal('Uyarı', windowEvents.getUser(user).Name + ' mülakattan ayrıldığı için kayıt durduruldu.');
            if (window.credential.InterviewCredentialTypes === 2) {
                windowEvents.pauseOrResumeInterview();
                windowEvents.updateRecordStatus(isRecording);
            }
        }
    },

    showMiniVideo: function (user, stream, streamId) {
        debugger;
        var t = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 305,
            l = 370,
            w = 320,
            h = 240;

        $('#listener-video-area').show();

        var firstContainer = document.getElementById('listener-video-area');
        var listenerVideoContainer = document.createElement('div');
        listenerVideoContainer.id = 'listener-container-' + streamId;

        var listenerVideoArea = document.createElement('div');
        listenerVideoArea.id = 'listener-video-area-' + streamId;

        listenerVideoContainer.appendChild(listenerVideoArea);

        firstContainer.appendChild(listenerVideoContainer);

        windowEvents.getDialogWindow($('#' + 'listener-container-' + streamId),
            user.Name,
            w, h, '',
            function (obj) {
                $('[aria-describedby="' + 'listener-container-' + streamId + '"] span.ui-dialog-title').html('<span><i class="fa fa-camera"></i>&nbsp&nbsp' + user.Name + '<span>')
                var videoContainer = document.getElementById('listener-video-area-' + streamId);

                var thumbnailElement = document.createElement('div');
                thumbnailElement.id = 'user-video-container-' + streamId;

                let videoElement = document.createElement('video');
                videoElement.className = "video";
                videoElement.autoplay = 'autoplay';
                videoElement.id = 'user-video-' + streamId;
                try {
                    videoElement.srcObject = stream;
                } catch (error) {
                    videoElement.src = URL.createObjectURL(stream);
                }
                thumbnailElement.appendChild(videoElement);

                videoContainer.appendChild(thumbnailElement);
                $('#user-video-container-' + streamId).css('height', 'unset');
                $('#listener-container-' + streamId).css('height', 'unset');
            }, t, l, 300);
    },
    updateVideoContainers: function () {
        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        w = parseInt(w) - 80;

        window.lastBoxLeft += 35;

        var w0 = Math.floor(w / 100 * 29);
        var w1 = w0 + 20;
        var w2 = Math.floor(w1 / 2);

        window.userVideos.forEach(function (userVideo) {
            //Geçerli kullanıcı adaysa mülakat sorumlusu büyük olmalı.
            //Geçerli kullanıcı mülakat sorumlusu ise aday büyük olmalı.
            if (
                (window.credential.InterviewCredentialTypes === 1 && userVideo.interviewCredentialType === 2) ||
                (window.credential.InterviewCredentialTypes === 2 && userVideo.interviewCredentialType === 1)
            ) {
                $('#' + userVideo.videoId).show();
                windowEvents.getDialogWindow($('#' + userVideo.videoId),
                    userVideo.userName,
                    w1,
                    w1,
                    '',
                    function (obj) {
                        $('[aria-describedby="' + userVideo.videoId + '"] span.ui-dialog-title').html('<span><i class="fa fa-camera"></i>&nbsp&nbsp' + userVideo.userName + '<span>');
                    },
                    160,
                    35,
                    300);
            }

            //Diğer katılımcılar küçük olmalı.
            else {
                $('#' + userVideo.videoId).show();
                windowEvents.getDialogWindow($('#' + userVideo.videoId),
                    userVideo.userName,
                    w2,
                    w2,
                    '',
                    function (obj) {
                        $('[aria-describedby="' + userVideo.videoId + '"] span.ui-dialog-title').html('<span><i class="fa fa-camera"></i>&nbsp&nbsp' + userVideo.userName + '<span>');
                    },
                    160 + w1 + 20,
                    window.lastBoxLeft,
                    300);
                window.lastBoxLeft += (20 + w2);
            }

        });

    },

    updateRecordStatus: function (recordStatus) {
        $("#divRecord").remove();
        $("#record-icon").show().css("display", "unset");
        if (window.credential.InterviewCredentialTypes === 2) {
            $("#record-status-text").html(recordStatus ? "Duraklat" : "Kaydı Başlat");
            $("#divStartStop").show();
        } else {
            $("#divStartStop").remove();
        }


        $("#start-interview").hide();
        if (recordStatus) {
            //Aday ve Katılımcı ekranı güncellemeleri.
            $("#record-icon").show().css("display", "unset");
            $("#spnCam").show().css("display", "unset");
            $("#loading-info").html("Kaydediliyor");
        } else {
            //Mülakat sorumlusu ekranı güncellemeleri.
            $("#record-icon").hide();
            $("#spnCam").hide();
            $("#loading-info").html("Kayıt Duraklatıldı");
        }
    },

    updateRecordPanel: function (credentialType) {
        if (credentialType === 2) {
            $('#divStart').show();
            $('#divLoading').remove();
        }
        if (credentialType !== 2) {
            $('#divStart').remove();
            $('#liMenu').hide();
        }
    },
    drawNewPin: function (clickEvent) {
        var moveLeft = 110,
            showLeft = clickEvent.X,
            moveTop = 69,
            showTop = clickEvent.Y;

        if (moveLeft > clickEvent.X) {
            showLeft = moveLeft;
        } else if (moveLeft + clickEvent.X > clickEvent.width) {
            showLeft = clickEvent.width - moveLeft;
        }

        if (moveTop > clickEvent.Y) {
            showTop = moveTop;
        } else if (38 + clickEvent.Y > clickEvent.height) {
            showTop = clickEvent.height - 38;
        }

        var color = windowEvents.calculateColorByUserId(window.credential.UserId);

        $('.pin-area').show().css({
            'left': showLeft + 'px',
            'top': showTop + 'px'
        });
        $('.pin-data').val('').css({
            'box-shadow': '0 5px 5px ' + color + ', 0 0px 5px ' + color
        }).data('state', JSON.stringify(clickEvent)).focus();
        $('.pin-save-button').css({
            'background-color': color,
            'box-shadow': '0 5px 5px ' + color + ', 0 0px 5px ' + color
        });
    },
    drawPin: function (clickEvent) {
        var maxWidth = parseFloat($('#pdf-click-container').width());
        var maxHeight = parseFloat($('#pdf-click-container').height());

        if (maxWidth !== parseFloat(clickEvent.Width) || maxHeight !== parseFloat(clickEvent.Height)) {
            var newLeft = parseFloat(clickEvent.Left) / parseFloat(clickEvent.Width) * maxWidth;
            var newTop = parseFloat(clickEvent.Top) / parseFloat(clickEvent.Height) * maxHeight;
            if (maxHeight !== 0) {
                clickEvent.Top = newTop;
                clickEvent.Height = maxHeight;
            }

            clickEvent.Left = newLeft;
            clickEvent.Width = maxWidth;
        }

        clickEvent.Left = (clickEvent.Width - clickEvent.Left) < 20 ? clickEvent.Width - 20 : clickEvent.Left;
        var color = windowEvents.calculateColorByUserId(clickEvent.AddedById);
        var commentDataLeft = 20;
        if (clickEvent.Left < 100) {
            commentDataLeft = ((20 + parseInt(clickEvent.Left) - 100) * -1) + 10;
        } else if (parseInt(clickEvent.Left) > maxWidth - 100) {
            commentDataLeft = -1 * (parseInt(clickEvent.Left) - (20 + parseInt(clickEvent.Left) - 100) - 10);
        }
        $('.pdf-pin-container').prepend('<div class="fa fa-commenting pin-content" id="pin-result-' + clickEvent.NoteId + '" aria-hidden="true">\
        <div class="pin-comment-area" style="/*left: ' + commentDataLeft + 'px;*/">\
        <span class="fa fa-remove pin-comment-remove"></span>\
            <label type="text" class="pin-comment-data" name="pin-data" style="border: 2px solid ' + color + ';" onclick="$(\'.pin-content\').removeClass(\'pin-active\');">\
            <div class="comment-photo" style="background-image: url(' + api.getApiRoot() + windowEvents.getUserPhoto(clickEvent.AddedById) + ');"></div><span>' + clickEvent.Content + '</span></label>\
        <label class="pin-comment-owner" style="background-color: ' + color + '; display:none;">' + windowEvents.getUserName(clickEvent.AddedById) + '</label></div></div>');
        $('#pin-result-' + clickEvent.NoteId).css({
            'left': clickEvent.Left + 'px',
            'top': clickEvent.Top + 'px',
            'color': color
        });
    },
    addNote: function (noteDto, userPhoto) {
        var noteCount = $('.inbox-item').length;
        $('.tab-badge').html(parseInt(noteCount) + 1);

        var notesContainer = $('#divTabCvNotlar');
        // var stringNotContent = '<div class="inbox-item" style="cursor:default" id="note_$NoteId"> $content$ </div>';
        // var innerContent = ' <div class="inbox-item-img"> <img src="' + api.getApiRoot() + '$Photo" class="img-circle" alt=""></div><p class="inbox-item-author">$UserName $qtitle</p><p class="inbox-item-text" style="cursor:pointer;" onclick="getUpdateNote(this, "$NoteId");">$Content</p><p class="inbox-item-date">$CreateDate<br /><button class="btn btn-danger btn-xs" style="float:right;margin-top:10px" onclick="windowEvents.deleteNote("$NoteId","$qualId","$todoId");"><i class="fa fa-remove"></i></button></p>';
        var stringNoteContent = '<div class="inbox-item" style="cursor: default" id="note_$NoteId">\
        <div class="inbox-item-img">\
            <img src="$Photo" class="img-circle" alt="">\
        </div>\
        <p class="inbox-item-author">$UserName $Title</p>\
        <p class="inbox-item-text $HasUpdateClass" onclick="$HasUpdate">$Content</p>\
        <p class="inbox-item-date">$CreateDate\
            $HasDelete\
            $HasUpdate\
        </p>\
        </div>';
        stringNoteContent = stringNoteContent.replace('$Photo', api.getApiRoot() + userPhoto);
        stringNoteContent = stringNoteContent.replace('$CreateDate', moment(noteDto.CreateDate).format('DD/MM/YYYY'));
        stringNoteContent = stringNoteContent.replace('$Content', noteDto.Content);
        stringNoteContent = stringNoteContent.replace('$UserName', windowEvents.getUserName(noteDto.AddedById));
        stringNoteContent = stringNoteContent.replace('$Title', windowEvents.getSubQuals(noteDto.SubQualificationId, noteDto.Type));
        stringNoteContent = stringNoteContent.replace('$HasDelete', window.credential.UserId === noteDto.AddedById ? '<br/><button class="btn btn-danger btn-xs" style="float: right; margin-top: 5px" onclick="windowEvents.deleteNote($NoteId);"><i class="fa fa-trash"></i></button>' : '');
        stringNoteContent = stringNoteContent.replace('$HasUpdateClass', window.credential.UserId === noteDto.AddedById ? 'note-update' : '');
        stringNoteContent = stringNoteContent.replace('$HasUpdate', window.credential.UserId === noteDto.AddedById ? 'windowEvents.focusToPin($NoteId, ' + noteDto.Type + ');' : '');
        stringNoteContent = stringNoteContent.replace('$HasUpdate', window.credential.UserId === noteDto.AddedById ? '<button class="btn btn-primary btn-xs" style="float: right;margin-top: 5px;margin-right: 5px;" onclick="windowEvents.editNote($NoteId, $NoteIsQual);"><i class="fa fa-edit"></i></button>' : '');
        stringNoteContent = stringNoteContent.replace('$NoteId', noteDto.NoteId);
        stringNoteContent = stringNoteContent.replace('$NoteId', noteDto.NoteId);
        stringNoteContent = stringNoteContent.replace('$NoteId', noteDto.NoteId);
        stringNoteContent = stringNoteContent.replace('$NoteId', noteDto.NoteId);
        stringNoteContent = stringNoteContent.replace('$NoteId', noteDto.NoteId);
        stringNoteContent = stringNoteContent.replace('$NoteIsQual', noteDto.Type === 2);

        notesContainer.append(stringNoteContent);
    },
    deleteNote: function (noteId, qualId, todoId) {

        chat.server.deleteInterviewNote(window.credential.RoomKey, window.credential.UserId, noteId);
    },
    calculateColorByUserId: function (userId) {
        var userColor = '';
        window.credential.Users.forEach(function (user) {
            if (user.UserId === userId) {
                userColor = user.UserColor;
            }
        });
        return windowEvents.calculateColor(userColor);
    },
    calculateColor: function (colorText) {
        switch (colorText) {
            case "bg-info":
                return "#29b6f6";
            case "bg-warning":
                return "#ffd740";
            case "bg-danger":
                return "#ef5350";
            case "bg-muted":
                return "#d0d0d0";
            case "bg-purple":
                return "#7e57c2";
            case "bg-primary":
                return "#317eeb";
            case "bg-success":
                return "#33b86c";
        }
        return "#7e57c2";
    },
    getUserNameByType: function (userType) {
        var userName = "";
        window.credential.Users.forEach(function (user, key) {
            if (user.InterviewCredentialTypes == userType) {
                userName = user.Name;
            }
        });
        return userName;
    },
    getUserByType: function (userType) {
        var userObj = null;
        if (typeof (window.credential) === 'undefined') return null;

        window.credential.Users.forEach(function (user, key) {
            if (user.InterviewCredentialTypes == userType) {
                userObj = user;
            }
        });
        return userObj;
    },
    getUserName: function (userId) {
        var userName = '';
        window.credential.Users.forEach(function (user) {
            if (user.UserId === userId) {
                userName = user.Name;
            }
        });
        return userName;
    },
    getUserPhoto: function (userId) {
        var photo = '';
        window.credential.Users.forEach(function (user) {
            if (user.UserId === userId) {
                photo = user.Photo;
            }
        });
        return photo;
    },
    getSubQuals: function (id, noteType) {
        if (id === null) {
            return noteType == InterviewNoteTypes.Cv ? ' - CV Notu' : ' - Genel Not';
        } else {
            var qualName = '';
            window.credential.SubQuals.forEach(function (qual) {
                if (qual.Id === id) {
                    qualName = qual.Name;
                }
            });
            return ' - ' + qualName;
        }
    },
    zoomChanged: function () {
        $('.pin-content').remove();
        window.credential.UserNotes.forEach(function (userNote) {
            if (userNote.Type === InterviewNoteTypes.Cv) {
                windowEvents.drawPin(userNote);
            }
        }, this);
    },

    focusToPin: function (pinId, type) {
        if (type !== 1) return;
        $('.pin-content').removeClass('pin-active');
        $('#pin-result-' + pinId).addClass('pin-active');
        $('#nav-cv > li:nth-child(1) > a').click();
        $('#tabcv').animate({
            scrollTop: $('#pin-result-' + pinId).offset().top - 300
        });
    },

    searchNotes(text) {
        $('.inbox-item').remove();
        var note = null;
        var userPhoto = "";
        if (text === "") {
            for (var j = 0; j < window.credential.UserNotes.length; j++) {
                note = window.credential.UserNotes[j];
                userPhoto = windowEvents.getUserPhoto(note.AddedById);
                windowEvents.addNote(note, userPhoto);
            }
        } else {
            var noteList = [];
            for (var i = 0; i < window.credential.UserNotes.length; i++) {
                var data = window.credential.UserNotes[i];

                var lowContent = data.Content.toLowerCase();
                var lowText = text.toLowerCase();
                var result = lowContent.includes(lowText);
                if (result) {
                    noteList.push(data);
                }
            }

            for (var l = 0; l < noteList.length; l++) {
                note = noteList[l];
                userPhoto = windowEvents.getUserPhoto(note.AddedById);
                windowEvents.addNote(note, userPhoto);
            }
        }
    },
    editNote: function (noteId, isQualification) {
        var baseSelector = '',
            isEditing = false,
            elementW = null,
            elementT = null,
            value = null;

        if (isQualification === true) {
            //Yetkinlikler.
            baseSelector = '.qualification-row[data-id="' + noteId + '"]';
            isEditing = $(baseSelector + ' > button:first').attr('editing');

            if (isEditing === 'true') {
                $(baseSelector + ' > button:last').removeAttr('disabled');
                $(baseSelector + ' > button:first').removeAttr('editing');
                $(baseSelector + ' > label').show();

                value = $('#note-update-text-' + noteId).val();
                chat.server.updateInterviewNote(window.credential.RoomKey, window.credential.UserId, noteId, value);

                $(baseSelector + ' > textarea').remove();
            } else {
                $(baseSelector + ' > button:last').removeAttr('disabled').attr('disabled', 'disabled');
                $(baseSelector + ' > button:first').attr('editing', 'true');

                elementT = $('.editable-qualification[data-id="' + noteId + '"]').text();
                $(baseSelector + ' > label').hide();
                $(baseSelector).append('<textarea class="form-control" id="note-update-text-' + noteId + '" style="width: 100%; height: 102px;">' + elementT + '</textarea>');
            }
        } else {
            //Notlar.
            baseSelector = '#note_' + noteId;
            isEditing = $(baseSelector + ' > p.inbox-item-date button[editing="true"]').attr('editing');

            if (isEditing === 'true') {
                $(baseSelector + ' > p.inbox-item-date button.note-move').remove();
                $(baseSelector + ' > p.inbox-item-date button:first').removeAttr('disabled');
                $(baseSelector + ' > p.inbox-item-date button:last').removeAttr('editing');
                $(baseSelector + ' > p.inbox-item-text.note-update').show();


                value = $('#note-update-text-' + noteId).val();
                chat.server.updateInterviewNote(window.credential.RoomKey, window.credential.UserId, noteId, value);

                $(baseSelector + ' > textarea').remove();
            } else {
                $(baseSelector + ' > p.inbox-item-date button:first').removeAttr('disabled').attr('disabled', 'disabled');
                $(baseSelector + ' > p.inbox-item-date button:last').attr('editing', 'true');

                var breakException = {};
                try {
                    window.credential.UserNotes.forEach(function (noteDto) {
                        if (parseInt(noteId) === noteDto.NoteId) {
                            if (noteDto.Type !== 2) {
                                $(baseSelector + ' > p.inbox-item-date').append('<button class="btn btn-success btn-xs note-move" style="float: right;margin-top: 5px;margin-right: 5px;" onclick="windowEvents.moveNote(\'' + noteId + '\');"><i class="fa fa-arrows-alt"></i></button>');
                                throw breakException;
                            }
                        }
                    });
                } catch (e) {
                    if (e !== breakException) throw e;
                }

                elementW = $(baseSelector + ' > p.inbox-item-text.note-update').width();
                elementT = $(baseSelector + ' > p.inbox-item-text.note-update').text();
                $(baseSelector + ' > p.inbox-item-text.note-update').hide();
                $(baseSelector).append('<textarea class="form-control" id="note-update-text-' + noteId + '" style="width: ' + elementW + 'px; height: 102px;">' + elementT + '</textarea>');
            }
        }
    },
    moveNote: function (noteId) {
        $('#pin-result-' + noteId).addClass('pin-comment-move');
        $('.pdf-click-container').addClass('pin-comment-area-move');
        $('.pin-area').addClass('pin-comment-area-move');
        $('.pdf-click-container.pin-comment-area-move').on('click', function (e) {
            $('.pin-comment-move').css('left', e.offsetX + 'px').css('top', e.offsetY);
            $('.pdf-click-container.pin-comment-area-move').off('click');

            $('.pin-content').removeClass('pin-comment-move').removeClass('pin-active');
            $('.pdf-click-container').removeClass('pin-comment-area-move');
            $('.pin-area').removeClass('pin-comment-area-move').hide();


            var minWidth = $(this).css('min-width').replace('px', '');
            var minHeight = $(this).css('min-height').replace('px', '');
            var width = $(this).css('width').replace('px', '');
            var height = $(this).css('height').replace('px', '');

            var realX = minWidth / width * e.originalEvent.layerX;
            var realY = minHeight / height * e.originalEvent.layerY;

            var eventData = {
                JobApplyInterviewId: window.credential.InterviewId,
                Top: parseFloat(realY),
                Left: parseFloat(realX),
                Width: parseFloat(minWidth),
                Height: parseFloat(minHeight),
                noteId: noteId
            };

            chat.server.moveInterviewNote(window.credential.RoomKey, eventData);
        });
        windowEvents.focusToPin(noteId, 1);
    },
    updateNoteText: function (noteId, text) {
        var baseSelector = '#note_' + noteId,
            color = $('#pin-result-' + noteId + ' > div > label.pin-comment-owner').css('background-color');
        $('.editable-qualification[data-id="' + noteId + '"]').html(text);
        $(baseSelector + ' > p.inbox-item-text.note-update').html(text);
        $('#pin-result-' + noteId + ' > div > label.pin-comment-data span').html(text);
    },
    addQualificationNote: function (data) {
        var dataTemp = '';
        if (data.Type === 2 && data.SubQualificationId == null) {
            dataTemp = '<div class="qualification-row" data-id="' + data.NoteId + '">\
                        <button class="btn btn-primary btn-xs" data-id="' + data.NoteId + '"><i class="fa fa-edit" onclick="windowEvents.editNote(\'' + data.NoteId + '\', true);"></i></button>\
                        <button class="btn btn-danger btn-xs" data-id="' + data.NoteId + '"><i class="fa fa-trash" onclick="windowEvents.deleteNote(\'' + data.NoteId + '\');"></i></button>\
                        <label class="editable-qualification" data-id="' + data.NoteId + '">' + data.Content + '</label></div>';
            $('#qualification-row-general').append(dataTemp);
        } else if (data.Type === 2) {
            dataTemp = '<div class="qualification-row" data-id="' + data.NoteId + '">\
                        <button class="btn btn-primary btn-xs" data-id="' + data.NoteId + '"><i class="fa fa-edit" onclick="windowEvents.editNote(\'' + data.NoteId + '\', true);"></i></button>\
                        <button class="btn btn-danger btn-xs" data-id="' + data.NoteId + '"><i class="fa fa-trash" onclick="windowEvents.deleteNote(\'' + data.NoteId + '\');"></i></button>\
                        <label class="editable-qualification" data-id="' + data.NoteId + '">' + data.Content + '</label></div>';
            $('#qualification-row-' + data.SubQualificationId).append(dataTemp);
        }
    },
    updateStreamsForRecording: function () {
        //Start Recording.
        streams = [];
        debugger;
        streamSources.push(); //{ "stream" = null, "streamId" = "", "socketId" = "", "userKey" = "", "onlyAudio" = false }


        streams.push(windowEvents.getApplyerRTC().remoteVideo_.srcObject);

        windowEvents.addLocalAudioStreamForRecording();

        if (windowEvents.listenerIsConnected() == false) {
            return;
        }
        var audioContext = new AudioContext();
        var isRecord = true;
        var audioSources = [];

        var audioTracksLength = 0;

        if (!windowEvents.getListenerRTC().remoteVideo_.srcObject.getAudioTracks().length) {
            isRecord = false;
        }

        audioTracksLength++;

        audioSources.push(audioContext.createMediaStreamSource(windowEvents.getListenerRTC().remoteVideo_.srcObject));

        if (!audioTracksLength) {
            isRecord = false;
        }

        var audioDestination = audioContext.createMediaStreamDestination();
        audioSources.forEach(function (audioSource) {
            audioSource.connect(audioDestination);
        });
        if (isRecord)
            streams.push(audioDestination.stream);
    },
    addLocalAudioStreamForRecording: function () {
        var audioContext = new AudioContext();
        var isRecord = true;
        var audioSources = [];

        var audioTracksLength = 0;

        if (windowEvents.getApplyerRTC().localStream_.getAudioTracks().length == 0) {
            isRecord = false;
        }

        audioTracksLength++;

        audioSources.push(audioContext.createMediaStreamSource(windowEvents.getApplyerRTC().localStream_));

        if (!audioTracksLength) {
            isRecord = false;
        }

        var audioDestination = audioContext.createMediaStreamDestination();
        audioSources.forEach(function (audioSource) {
            audioSource.connect(audioDestination);
        });
        if (isRecord)
            streams.push(audioDestination.stream);
    }
};

var positiveAdvertCount = 2;

function changeInterviewEvaluation(obj) {
    var selectedValue = parseInt($(obj).val());
    var styleArea = $(obj).parent().parent();
    switch (selectedValue) {
        case 2:
            $('#evaluationInterview').hide(200);
            styleArea.css('margin-right', '0px');
            styleArea.css('width', '85px');
            break;
        case 1:
            $('#evaluationInterview').show(200);
            styleArea.css('margin-right', '120px');
            styleArea.css('width', '125px');
            break;
    }
}

function changeGeneralEvaluation(obj) {
    var selectedValue = parseInt($(obj).val());
    var styleArea = $(obj).parent().parent();
    switch (selectedValue) {
        case 3:
            $('#qualGenelEvaluation').hide(200);
            styleArea.css('margin-right', '0px');
            break;
        case 2:
            $('#qualGenelEvaluation').hide(200);
            styleArea.css('margin-right', '0px');
            break;
        case 1:
            $('#qualGenelEvaluation').show(200);
            styleArea.css('margin-right', '120px');
            break;
    }

    var evaluationType = parseInt($('input[name="generalApplyerEvaluation"]:checked').val());
    var dataToPost = {
        candidateId: window.credential.CandidateId,
        generalEvaluation: evaluationType === 1 ? 2 : evaluationType === 2 ? 3 : 4, //2 Olumlu, 3 Olumsuz
        point: evaluationType === 1 ? $('#qualGenelEvaluation .stars .fullStar').length : null
    }

    api.post(api.getApiRoot() + '/InterviewVideo/SaveGeneralApplyerEvaluation/', dataToPost, function (r) {
        console.log('Kayıt', r);
    });

    var disableRadio = $('#interviewApplyerEvaluation-2,#interviewApplyerEvaluation-1,input[data-code="jobAdvertRadioFalse"],input[data-code="jobAdvertRadioTrue"]');
    if (selectedValue > 1) {
        $('input[data-code="jobAdvertRadioFalse"],#interviewApplyerEvaluation-2').prop('checked', true).change();
        disableRadio.prop('disabled', true);
        positiveAdvertCount = 0;
    } else {
        $('input[data-code="jobAdvertRadioTrue"],#interviewApplyerEvaluation-1').prop('checked', true).change();
        disableRadio.prop('disabled', false);
        positiveAdvertCount = 2;
    }
}

function changeJobAdvertEvaluation(obj) {
    var selectedValue = parseInt($(obj).val());
    var styleData = parseInt($(obj).data('id'));
    var styleArea = $(obj).parent().parent();
    switch (selectedValue) {
        case 3:
            $('span[data-jobadvertid="' + styleData + '"]').hide(200);
            styleArea.css('margin-right', '0px');
            styleArea.css('width', '85px');
            positiveAdvertCount -= 1;
            break;
        case 2:
            $('span[data-jobadvertid="' + styleData + '"]').hide(200);
            styleArea.css('margin-right', '0px');
            styleArea.css('width', '85px');
            positiveAdvertCount -= 1;
            break;
        case 1:
            $('span[data-jobadvertid="' + styleData + '"]').show(200);
            styleArea.css('margin-right', '120px');
            styleArea.css('width', '125px');
            positiveAdvertCount += 1;
            break;
    }

    var disableRadio = $('#interviewApplyerEvaluation-2,#interviewApplyerEvaluation-1');
    if (positiveAdvertCount <= 0) {
        $('#interviewApplyerEvaluation-2').prop('checked', true).change();
        disableRadio.prop('disabled', true);
    } else {
        $('#interviewApplyerEvaluation-1').prop('checked', true).change();
        disableRadio.prop('disabled', false);
    }
}

function saveJobAdvertEvaluation(obj) {
    var selectedValue = parseInt($(obj).val());
    var jobAdvertId = parseInt($(obj).data('id'));

    var evaluationType = selectedValue;
    var dataToPost = {
        candidateId: window.credential.CandidateId,
        evaluation: evaluationType === 1 ? 3 : 2, //3 Olumlu, 2 Olumsuz
        jobAdvertId: jobAdvertId,
        point: evaluationType === 1 ? $('#job-advert-evaluation-' + jobAdvertId + ' .stars .fullStar').length : null
    }

    api.post(api.getApiRoot() + '/InterviewVideo/SaveJobAdvertCandidateEvaluation/', dataToPost, function (r) {
        console.log('Kayıt', r);
    });
}