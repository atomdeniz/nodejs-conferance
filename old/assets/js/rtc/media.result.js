'use strict';

var InterviewNoteTypes = {
    Cv: 1,
    Qualification: 2,
    Message: 3,
    GeneralNote: 4
};

function getAuthenticationToken() {
    return "";
}

$(document).ready(function () {
    windowEvents.drawBoxes();
    windowEvents.drawUsers();
    $('.stars > a.star').removeAttr('data-qualid').removeAttr('title');
    window.videoIsBig = false;
    $(window).resize(function (e) {
        windowEvents.calculateBoxesOnResize();
    });
});

var windowEvents = {
    drawBoxes: function () {
        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        window.w = w;
        window.h = h;

        var w0 = 500,
            w1 = ((w - 500 - 100) / 2) > 450 ? 450 : ((w - 500 - 100) / 2),
            w2 = ((w - 500 - 100) / 2) > 450 ? w - 500 - 100 - 450 : ((w - 500 - 100) / 2);

        var l05 = 35;
        var l30 = 550;
        var l60 = l30 + 15 + w1;

        var t0 = 90;
        var t1 = 160;
        var hNotes = 150;
        var hChat = 200;
        var hBigBox = 680;
        var hMidBox = 455;

        var userHeight = 434;
        $('.record-area').css('width', w0).css('margin-top', '-20px');

        windowEvents.getDialogWindow($('#divUsers'), windowEvents.getInterviewUserDetail().Name, w0, userHeight, '', function () {
            $('[aria-describedby="divUsers"] span.ui-dialog-title').html('<span class="fa fa-group"></span>&nbsp;&nbsp;&nbsp;&nbsp' + windowEvents.getInterviewUserDetail().Name + '&nbsp;&nbsp;&nbsp;&nbsp<span class="video-title"><span class="video-title-current"></span>/<span class="video-title-max"></span></span>');
            //$('[aria-describedby="divUsers"] span.ui-dialog-title').css('width', '85%');
            $('[aria-describedby="divUsers"] span.ui-dialog-title').after('<div class="ui-state-default video-resize location"><span onclick="windowEvents.videoResize();" class="ui-icon ui-icon-extlink location-resize-image" style="cursor: pointer; float: right;">minimize</span></div>');
        }, t1, l05);
        if (h - (userHeight + 135) > hNotes) {
            hNotes = h - (userHeight + 135);
        }

        if (h - 630 < hChat) {
            hChat = h - 630;
        }

        if (hMidBox + hChat + t0 + 10 > h) {
            hMidBox = h - t0 - 10 - hChat - 70;
        }

        hBigBox = h - t1;

        var elemenst = $("#divTabCvNotlar img");
        for (var i = 0; i < elemenst.length; i++) {
            var obj = elemenst[i];
            if (obj.src.indexOf("https://localhost") > -1) {
                obj.src = obj.src.replace("https://localhost", api.getApiRoot());
                console.log(obj);
            }
        }

        $('#qualGenel').rating(function (vote, g) {
            var rr = $(this);
            var qId = $(g.target).data('qualid');

            $('#vote_' + qId).val(vote);
        });
        $.each(window.credential.SubQuals, function () {

            console.log(this);
            console.log('#qual_' + this.Id);
            $('#qual_' + this.Id).rating(function (vote, g) {
                var rr = $(this);
                var qId = $(g.target).data('qualid');

                $('#vote_' + qId).val(vote).attr("readonly", "readonly");
            });

        });

        var tt = new TodoApp(0);
        $.each(window.credential.UserNotes, function () {
            if (this.Type === 2 && this.SubQualificationId == null) {
                tt.addTodo(this.Id, this.Content);
            }

        });
        tt.init(0);
        $.each(window.credential.SubQuals, function () {
            var tt = new TodoApp(this.Id);
            var qualId = this.Id;
            $.each(credential.UserNotes, function () {
                if (this.Type === 2 && this.SubQualificationId === qualId) {
                    tt.addTodo(this.Id, this.Content);
                }
            });
            tt.init(this.Id);
        });

        var lSelect = h > 750 ? l05 : l30;
        var wSelect = h > 750 ? w0 : w1;
        hBigBox = h > 750 ? hBigBox : hBigBox - 215;
        var hSelect = h > 750 ? 630 : hBigBox + t0 + 15;
        var hei = h > 750 ? h - 700 : 200;

        if (window.credential.InterviewCredentialTypes !== 1) {
            windowEvents.getDialogWindow($('#tabQual'), "Yetkinlikler", w1, hBigBox, '', function () {
                $('[aria-describedby="tabQual"] span.ui-dialog-title').html('<span class="fa fa-star"></span>&nbsp;&nbsp;&nbsp;&nbsp;Yetkinlikler');
            }, t0, l30);
        }



        windowEvents.getDialogWindow($('#userList'), "Katılımcılar", wSelect, hei, '', function () {
            $('[aria-describedby="userList"] span.ui-dialog-title').html('<span class="fa fa-group"></span>&nbsp;&nbsp;&nbsp;&nbsp;Katılımcılar');
        }, hSelect, lSelect, 300);

        hBigBox = h > 750 ? hBigBox : hBigBox + 215;

        windowEvents.getDialogWindow($('#tabcv'), "Aday Bilgileri", w2, hBigBox, '', function (obj) {
            var url = window.credential.UserCv.Path;

            window.credential.userCv = url;
            $('#divcvtab').html('<div class="pdf-zoom-controls">\
            <div class="pdf-button-padding"></div><button class="pdf-button" id="pdf-button-reset-zoom"><i class="fa fa-arrows-alt"></i></button>\
            <button class="pdf-button" id="pdf-button-add-zoom"><i class="fa fa-plus"></i></button>\
            <button class="pdf-button" id="pdf-button-remove-zoom"><i class="fa fa-minus"></i></button>\
            </div><div class="pdf-click-container" id="pdf-click-container" style="display:none;"></div><div class="pdf-container" id="pdf-container"></div>\
            <div class="pdf-pin-container"><div class="pin-area" style="display: none;"><input type="text" class="pin-data" name="pin-data" value="" /><button class="pin-save-button">Kaydet</button></div></div>');
            pdfJsRenderer.render(window.credential.userCv, {
                scale: 1.5
            }, function (e) {
                if (e) {
                    // $('.pin-area').show();
                } else {
                    $('.pin-area').hide();
                }
            }, windowEvents.drawNewPin, windowEvents.zoomChanged);

            window.credential.UserNotes.forEach(function (userNote) {
                if (userNote.Type === InterviewNoteTypes.Cv) {
                    windowEvents.drawPin(userNote);
                }
            }, this);
            $('.pdf-pin-container').css('position', 'absolute');
            windowEvents.zoomChanged();
            $('[aria-describedby="tabcv"] span.ui-dialog-title').html('<span class="fa fa-user"></span>&nbsp;&nbsp;&nbsp;&nbsp;Aday Bilgileri');
            //
        }, t0, l60);
        if (window.credential.InterviewCredentialTypes !== 1) {
            windowEvents.getDialogWindow($('#tabAdvert'), "Pozisyon", w1, hBigBox, 'minimize', function (obj) {
                $('[aria-describedby="tabAdvert"] span.ui-dialog-title').html('<span class="fa fa-briefcase"></span>&nbsp;&nbsp;&nbsp;&nbsp;Pozisyon');
            }, t0, l60 - 100);

        } else {
            windowEvents.getDialogWindow($('#tabAdvert'), "Pozisyon", w1, hMidBox, '', function (obj) {
                $('[aria-describedby="tabAdvert"] span.ui-dialog-title').html('<span class="fa fa-briefcase"></span>&nbsp;&nbsp;&nbsp;&nbsp;Pozisyon');
            }, t0, l30);

        }

        windowEvents.calculateBoxesOnResize(true);
    },
    calculateBoxesOnResize: function (force) {
        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        if (w === window.w && h === window.h && force !== true) return;

        var w0 = 500,
            w1 = ((w - 500 - 100) / 2) > 450 ? 450 : ((w - 500 - 100) / 2),
            w2 = ((w - 500 - 100) / 2) > 450 ? w - 500 - 100 - 450 : ((w - 500 - 100) / 2);

        var l05 = 35;
        var l30 = 550;
        var l60 = l30 + 15 + w1;

        var t0 = 90;
        var t1 = 160;
        var hNotes = 150;
        var hChat = 200;
        var hBigBox = 680;
        var hMidBox = 455;

        var userHeight = 434;
        $('.record-area').css('width', w0).css('margin-top', '-20px');

        windowEvents.getDialogWindow($('#divUsers'), windowEvents.getInterviewUserDetail().Name, w0, userHeight, '', function () {
            $('[aria-describedby="divUsers"] span.ui-dialog-title').html('<span class="fa fa-group"></span>&nbsp;&nbsp;&nbsp;&nbsp' + windowEvents.getInterviewUserDetail().Name + '&nbsp;&nbsp;&nbsp;&nbsp<span class="video-title"><span class="video-title-current"></span>/<span class="video-title-max"></span></span>');
            //$('[aria-describedby="divUsers"] span.ui-dialog-title').css('width', '85%');
            $('[aria-describedby="divUsers"] span.ui-dialog-title').after('<div class="ui-state-default video-resize location"><span onclick="windowEvents.videoResize();" class="ui-icon ui-icon-extlink location-resize-image" style="cursor: pointer; float: right;">minimize</span></div>');
        }, t1, l05);
        if (h - (userHeight + 135) > hNotes) {
            hNotes = h - (userHeight + 135);
        }
        if (h - 630 < hChat) {
            hChat = h - 630;
        }
        if (hMidBox + hChat + t0 + 10 > h) {
            hMidBox = h - t0 - 10 - hChat - 70;
        }

        hBigBox = h - t1;
        
        var lSelect = h > 750 ? l05 : l30;
        var wSelect = h > 750 ? w0 : w1;
        hBigBox = h > 750 ? hBigBox : hBigBox - 215;
        var hSelect = h > 750 ? 630 : hBigBox + t0 + 15;
        var hei = h > 750 ? h - 700 : 200;

        if (window.credential.InterviewCredentialTypes !== 1) {
            windowEvents.getDialogWindow($('#tabQual'), "Yetkinlikler", w1, hBigBox, '', function () {
                $('[aria-describedby="tabQual"] span.ui-dialog-title').html('<span class="fa fa-star"></span>&nbsp;&nbsp;&nbsp;&nbsp;Yetkinlikler');
            }, t0, l30);
        }

        windowEvents.getDialogWindow($('#userList'), "Katılımcılar", wSelect, hei, '', function () {
            $('[aria-describedby="userList"] span.ui-dialog-title').html('<span class="fa fa-group"></span>&nbsp;&nbsp;&nbsp;&nbsp;Katılımcılar');
        }, hSelect, lSelect, 300);

        hBigBox = h > 750 ? hBigBox : hBigBox + 215;

        windowEvents.getDialogWindow($('#tabcv'), "Aday Bilgileri", w2, hBigBox, '', function (obj) {
            $('.pdf-pin-container').css('position', 'absolute');
            windowEvents.zoomChanged();
            $('[aria-describedby="tabcv"] span.ui-dialog-title').html('<span class="fa fa-user"></span>&nbsp;&nbsp;&nbsp;&nbsp;Aday Bilgileri');
            //
        }, t0, l60);
        if (window.credential.InterviewCredentialTypes !== 1) {
            windowEvents.getDialogWindow($('#tabAdvert'), "Pozisyon", w1, hBigBox, 'minimize', function (obj) {
                $('[aria-describedby="tabAdvert"] span.ui-dialog-title').html('<span class="fa fa-briefcase"></span>&nbsp;&nbsp;&nbsp;&nbsp;Pozisyon');
            }, t0, l60 - 100);

        } else {
            windowEvents.getDialogWindow($('#tabAdvert'), "Pozisyon", w1, hMidBox, '', function (obj) {
                $('[aria-describedby="tabAdvert"] span.ui-dialog-title').html('<span class="fa fa-briefcase"></span>&nbsp;&nbsp;&nbsp;&nbsp;Pozisyon');
            }, t0, l30);
        }
        return;
        window.w = w;
        window.h = h;

        var w0 = Math.floor(w / 100 * 29);
        var w1 = w0 + 20;

        var l05 = 35;
        var l30 = (w / 2) - ((w1 + 15) / 2);
        var l60 = w - w0 - 60;

        var t0 = 90;
        var t1 = 160;
        var hNotes = 150;
        var hChat = 200;
        var hBigBox = 680;
        var hMidBox = 455;

        var userHeight = 434;
        $('.record-area').css('width', w0).css('margin-top', '-20px');


        if (h - (userHeight + 220) > hNotes) {
            hNotes = h - (userHeight + 220);
        }
        if (h - (userHeight + 220) > hChat) {
            hChat = h - (userHeight + 220);
        }
        hBigBox = h - 140;


        if (h < 875) {
            if (hMidBox + hChat + t0 + 10 > h) {
                hMidBox = hMidBox - (hChat) + 42;
            }
            userHeight -= 13;
            windowEvents.getDialogWindow($('#divUsers'), windowEvents.getInterviewUserDetail().Name, w0, userHeight, '', function () { }, t1, l05);
            if (window.credential.InterviewCredentialTypes !== 1) {
                windowEvents.getDialogWindow($('#tabQual'), "Yetkinlikler", w1, hMidBox, '', function () {
                    $('[aria-describedby="tabQual"] span.ui-dialog-title').html('<span class="fa fa-star"></span>&nbsp;&nbsp;&nbsp;&nbsp;Yetkinlikler');
                }, t0, l30);
            }
            windowEvents.getDialogWindow($('#userList'), "Katılımcılar", w1, hChat, '', function () {
                $('[aria-describedby="userList"] span.ui-dialog-title').html('<span class="fa fa-group"></span>&nbsp;&nbsp;&nbsp;&nbsp;Katılımcılar');
            }, hMidBox + t0 + 10, l30, 300);
        } else {
            windowEvents.getDialogWindow($('#divUsers'), windowEvents.getInterviewUserDetail().Name, w0, userHeight, '', function () { }, t1, l05);
            if (window.credential.InterviewCredentialTypes !== 1) {
                windowEvents.getDialogWindow($('#tabQual'), "Yetkinlikler", w1, hBigBox, '', function () {
                    $('[aria-describedby="tabQual"] span.ui-dialog-title').html('<span class="fa fa-star"></span>&nbsp;&nbsp;&nbsp;&nbsp;Yetkinlikler');
                }, t0, l30);
            }
            windowEvents.getDialogWindow($('#userList'), "Katılımcılar", w0, hChat, '', function () {
                $('[aria-describedby="userList"] span.ui-dialog-title').html('<span class="fa fa-group"></span>&nbsp;&nbsp;&nbsp;&nbsp;Katılımcılar');
            }, userHeight + t1 + 10, l05, 300);
        }


        windowEvents.getDialogWindow($('#tabcv'), "Aday Bilgileri", w1, hBigBox, '', function (obj) {
            $('[aria-describedby="tabcv"] span.ui-dialog-title').html('<span class="fa fa-user"></span>&nbsp;&nbsp;&nbsp;&nbsp;Aday Bilgileri');
        }, t0, l60);
        if (window.credential.InterviewCredentialTypes !== 1) {
            windowEvents.getDialogWindow($('#tabAdvert'), "Pozisyon", w1, hBigBox, 'minimize', function (obj) {
                $('[aria-describedby="tabAdvert"] span.ui-dialog-title').html('<span class="fa fa-briefcase"></span>&nbsp;&nbsp;&nbsp;&nbsp;Pozisyon');
            }, t0, l60 - 100);

        } else {
            windowEvents.getDialogWindow($('#tabAdvert'), "Pozisyon", w1, hMidBox, '', function (obj) {
                $('[aria-describedby="tabAdvert"] span.ui-dialog-title').html('<span class="fa fa-briefcase"></span>&nbsp;&nbsp;&nbsp;&nbsp;Pozisyon');
            }, t0, l30);
        }
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
    drawUsers: function () {

        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        w = parseInt(w) - 80;
        var hh = Math.floor(((h - 200) / 4));
        var ww = Math.floor((w / 100) * 34);
        var ww2 = Math.floor((w / 100) * 69);
        var lw = Math.floor((w / 100) * 30);
        var www = 70;

        var userText =
            '<div class="card card-small">\
                <div class="card-image" style="background-image: url(@userPhoto@);"></div>\
                <h2 class="card-title">@UserName@</h2>\
                <span class="card-subtitle">@UserType@</span>\
                <div class="card-action-bar">\
                </div>\
                <div class="card-usercolor" style="background-color: @color@;"></div>\
            </div>';

        var userwidget = '<div class="inbox-widget" id="userWidget" tabindex="5000" style="overflow: hidden; outline: none;"></div>';
        $("#userList").append(userwidget);

        $.each(credential.Users,
            function () {
                var uText;
                if (this.Photo === null && credential.EmptyUserPhoto === null) {
                    uText = userText.replace("@userPhoto@", '/Content/images/empy-user.png');
                } else if (this.Photo === null) {
                    uText = userText.replace("@userPhoto@", credential.EmptyUserPhoto);
                } else {
                    uText = userText.replace("@userPhoto@", this.Photo);
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
                uText = uText.replace("@Statue@", "Gelmedi");
                uText = uText.replace("@faIsCome@", "fa-remove");
                uText = uText.replace("@faIsComeColor@", "rgb(255, 104, 64);");
                uText = uText.replace("@color@", windowEvents.calculateColor(this.UserColor));
                uText = uText.replace("@color@", windowEvents.calculateColor(this.UserColor));
                $("#userWidget").append(uText);
            });
    },
    videoResize: function () {
        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        var w0;


        var l05 = 35;

        var t1 = 160;
        var userHeight = 0;

        if (window.videoIsBig) {
            userHeight = 434;
            w0 = 500;
        } else {
            userHeight = Math.floor(h / 100 * 80);
            w0 = Math.floor(w / 100 * 60);
        }
        windowEvents.getDialogWindow($('#divUsers'), windowEvents.getInterviewUserDetail().Name, w0, userHeight, '', function () {
            $('[aria-describedby="divUsers"] span.ui-dialog-title').html('<span class="fa fa-group"></span>&nbsp;&nbsp;&nbsp;&nbsp' + windowEvents.getInterviewUserDetail().Name + '&nbsp;&nbsp;&nbsp;&nbsp<span class="video-title"><span class="video-title-current"></span>/<span class="video-title-max"></span></span>');
            $('[aria-describedby="divUsers"] span.ui-dialog-title').css('width', '85%');
        }, t1, l05);
        window.videoIsBig = !window.videoIsBig;
        $(".ui-state-default.video-resize.location").toggleClass("opened");
    },
    getInterviewUserDetail: function () {
        var rUser = null;
        window.credential.Users.forEach(function (user) {
            if (user.InterviewCredentialTypes === 1) {
                rUser = user;
            }
        });
        return rUser;
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
            commentDataLeft = ((20 + parseInt(clickEvent.Left) - 100) * -1) + 25;
        } else if (parseInt(clickEvent.Left) > maxWidth - 100) {
            commentDataLeft = -1 * (parseInt(clickEvent.Left) - (20 + parseInt(clickEvent.Left) - 100) - 10);
        }
        $('.pdf-pin-container').prepend('<div class="fa fa-commenting pin-content" id="pin-result-' + clickEvent.NoteId + '" aria-hidden="true">\
        <div class="pin-comment-area">\
        <span class="fa fa-remove pin-comment-remove"></span><label type="text" class="pin-comment-data" name="pin-data" style="border: 2px solid ' + color + ';"><div class="comment-photo" style="background-image: url(/assets/picture/foto_12.jpg);"></div>' + clickEvent.Content + '</label>\
        </div></div>');
        $('#pin-result-' + clickEvent.NoteId).css({
            'left': clickEvent.Left + 'px',
            'top': clickEvent.Top + 'px',
            'color': color
        });
    },
    //<div class="pin-comment-area" style= "left: ' + commentDataLeft + 'px;" >\
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
    getUserName: function (userId) {
        var userName = '';
        window.credential.Users.forEach(function (user) {
            if (user.UserId === userId) {
                userName = user.Name;
            }
        });
        return userName;
    },
    zoomChanged: function () {
        $('.pin-content').remove();
        window.credential.UserNotes.forEach(function (userNote) {
            if (userNote.Type === InterviewNoteTypes.Cv) {
                windowEvents.drawPin(userNote);
            }
        }, this);
    }
};