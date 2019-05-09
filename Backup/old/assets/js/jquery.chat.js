/**
* Theme: Velonic Admin Template
* Author: Coderthemes
* Chat application 
*/

!function ($) {
    "use strict";

    var ChatApp = function () {
        this.$body = $("body"),
            this.$chatInput = $('.chat-input'),
            this.$chatList = $('.conversation-list'),
            this.$chatSendBtn = $('.chat-send .btn')
    };

    //saves chat entry - You should send ajax call to server in order to save chat enrty
    ChatApp.prototype.save = function () {
        var chatText = this.$chatInput.val();
        var chatTime = moment().format("h:mm");
        if (chatText == "") {

            this.$chatInput.focus();
        } else {
            var user = window.credential
            // console.log(window.chatHub);
            // console.log(user);
            window.chatHub.server.sendPublic(user.RoomKey, user.UserId, chatText);


            $('<li class="clearfix odd"><div class="chat-avatar"><img src="' + user.Photo + '" alt=""><i>' + chatTime + '</i></div><div class="conversation-text"><div class="ctext-wrap"><i>' + user.UserName + '</i><p>' + chatText + '</p></div></div></li>').appendTo('.conversation-list');
            this.$chatInput.val('');
            this.$chatInput.focus();
            this.$chatList.scrollTo('100%', '100%', {
                easing: 'swing'
            });
            // console.log($('#conversationPublic')[0].scrollHeight);
            $('#conversationPublic').scrollTo('100%', '100%', {
                easing: 'swing'
            });
        }
    },
        ChatApp.prototype.addMessage = function (message, username, photo, time) {
            var state = $('#conversationPublic').dialogExtend("state");
            if (state == 'minimized') {
                var ncount = $('#spnNotfyCount').text();
                if (ncount >= 0 &&ncount !='') {
                    $('#spnNotfyCount').text(parseInt(ncount) + 1);
                } else {
                    $('#spnNotfyCount').text(1);
                }
            }

            $('<li class="clearfix"><div class="chat-avatar"><img src="' + photo + '" alt=""><i>' + time + '</i></div><div class="conversation-text"><div class="ctext-wrap"><i>' + username + '</i><p>' + message + '</p></div></div></li>').appendTo('.conversation-list');
            this.$chatList.scrollTo('100%', '100%', {
                easing: 'swing'
            });
            //    console.log($('#conversationPublic')[0].scrollHeight);
            $('#conversationPublic').scrollTo('100%', '100%', {
                easing: 'swing'
            });

        }
    ChatApp.prototype.init = function () {
        var $this = this;
        //binding keypress event on chat input box - on enter we are adding the chat into chat list - 
        $this.$chatInput.keypress(function (ev) {
            var p = ev.which;
            if (p == 13) {
                $this.save();
                return false;
            }
        });


        //binding send button click
        $this.$chatSendBtn.click(function (ev) {
            $this.save();

            return false;
        });
    },
        //init ChatApp
        $.ChatApp = new ChatApp, $.ChatApp.Constructor = ChatApp

} (window.jQuery),

    //initializing main application module
    function ($) {
        "use strict";
        $.ChatApp.init();
    } (window.jQuery);