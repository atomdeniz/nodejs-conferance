var ajaxMethods = {
    post: function (url, parameters, callback) {
        //console.log(url);
        //console.log(parameters);
        //console.log(callback);
        $.post(url, parameters, callback);
    },

    get: function (url, parameters, callback) {
        //async: false
        return $.get(url, parameters, callback);
    },

    load: function (element, url, parameters, callback) {

        $(element).load(url, parameters, function (response) {
            $('.form-control').trigger('blur');

            if (callback != undefined) {
                callback(response);

            }
        });

    },

    loadWithSplash: function (element, url, parameters, callback) {

        $(element).load(url, parameters, function (response) {
            //var ff = $('.form-control');
            $('.form-control').trigger('blur');
            //$.each(ff, function () {
            //    if ($(this).val() != null && $(this).val()!=undefined&& $(this).val().length > 0) {
            //        $(this).addClass('edited');
            //    }
            //});
            if (callback != undefined) {
                callback(response);

            }
        });

    },

    postWithJson: function (url, data, successCallback, errorCallback) {
        $.ajax({
            type: "POST",
            url: url,
            data: data,
            traditional: true,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: successCallback,
            error: errorCallback
        });

    },

    loadComponent: function (url, parameters, callback) {
        ajaxMethods.load($('#divCompanentMain'), url, parameters, function (response) {
            $('.form-control').trigger('blur');

            if (callback != undefined) {
                callback(response);
            }

            //var ff = $('.form-control');

            //$.each(ff, function () {
            //    if ($(this).val() != null && $(this).val() != undefined && $(this).val().length > 0) {
            //        $(this).addClass('edited');
            //    }
            //});
        });
    }
};

var messageBox = {
    setTitle: function (title, titleElement) {
        $(titleElement).html(title);
    },
    setBody: function (mbody, bodyElementId) {

        $(bodyElementId).html(mbody);
    },
    setWidth: function (width, dialogElement) {
        //$(dialogElement).css({
        //    'width': (width == 0 ? '100%' : width + 'px')
        //});
    },
    setHeight: function (height, dialogElement) {
        //$(dialogElement).css({
        //    'height': (height == 0 ? '100%' : height + 'px')
        //});
    },
    SetClass: function (className, dialogElement) {
        $(dialogElement).addClass(className);
    },
    setButtons: function (buttons, footerElement) {
        var buttonsHtml = '';
        for (var i = 0; i < buttons.length; i++) {

            var button = buttons[i];
            var buttonId = button.id;

            if (button.callback != null) {
                buttonsHtml += '<li style="text-align: center" id="' + buttonId + '" style="margin:5px;" class="pbutton"><a class="dropdown-item">' + button.text + '</a></li>';
            }
        }
        if (buttonsHtml == '') {
            $(footerElement).parent().css('display', 'none');
        } else {
            $(footerElement).parent().css('display', 'inherit');
        }
        //button html'lerini aktar
        $(footerElement).html(buttonsHtml);

        //buttonlarin click eventleri
        $(".pbutton").on('click', function () {
            var parameterButtonId = $(this).attr('id');
            if (parameterButtonId == 'undefined') {
                alert("Button'a id alanı eklemelisiniz.");
            }
            for (var t = 0; t < buttons.length; t++) {
                if (buttons[t].id == parameterButtonId) {
                    $.call(this, buttons[t].callback);
                }
            }
            return false;
        });
    },
    show: function (modalType, modalStyle) {
        messageBox.setTitle(_title, modalType.messageBoxTitleId);
        if (!isAsnyc) {
            messageBox.setBody('', modalType.messageBoxBodyId);
            messageBox.setBody(_body, modalType.messageBoxBodyId);
        }
        messageBox.setButtons(_buttons, modalType.messageBoxButtonsId);
        //messageBox.setWidth(_width, modalType.dialogId);
        //messageBox.setHeight(_height, modalType.dialogId);
        messageBox.SetClass(modalStyle, modalType.dialogId);
        $(modalType.containerId).modal('show');
    },
    hide: function (modalType, modalStyle) {
        //console.log(modalType);
        //messageBoxBodyId
        $(modalType.messageBoxBodyId).html('');
        $(modalType.containerId).modal('hide');
        $(modalType.containerId).on('hidden.bs.modal', function () {
            $(modalType.dialogId).removeClass(modalStyle);

        });

    },
    loadMessageBox: function (options) {
        isAsnyc = false;
        options = $.extend({
            title: '',
            body: '',
            width: 700,
            height: 0,
            buttons: [{ id: 'btn', text: '', callback: null, type: 'btn-primary' }],
        }, options);

        _title = options.title;
        _body = options.body;
        _width = options.width;
        _height = options.height;
        _buttons = options.buttons;

    }
};

var Modal = function (modalType, modalStyle) {

    modalType = modalType || modalTypes.SlideUp;
    modalStyle = modalStyle || 'modal-lg';


    this._title = '';
    this._body = '';
    this._buttons = '';
    this._width = 0;
    this._height = 0;
    this.popup = function (options) {
        messageBox.loadMessageBox(options);
        return this;
    };
    this.setBody = function (bb) {

        messageBox.setBody(bb, modalType.messageBoxBodyId);
    };
    this.load = function (loadPath, parameters, callback) {
        isAsnyc = true;
        messageBox.setBody('', modalType.messageBoxBodyId);
        ajaxMethods.load(modalType.messageBoxBodyId, loadPath, parameters, callback);
        return this;
    },
        this.show = function () {
            messageBox.show(modalType, modalStyle);
            return this;
        };
    this.hide = function () {
        messageBox.hide(modalType, modalStyle);

        return this;
    };



};

var modalTypes = {
    FillIn: {
        containerId: "#modalFillIn",
        dialogId: "#modalFillInDialog",
        messageBoxTitleId: "#modalFillInTitle",
        messageBoxBodyId: "#modalFillInBody",
        messageBoxButtonsId: "#modalFillInFooter",
    },

    SlideUp: {
        containerId: "#modalSlideUp",
        dialogId: "#modalSlideUpDialog",
        messageBoxTitleId: "#modalSlideUpTitle",
        messageBoxBodyId: "#modalSlideUpBody",
        messageBoxButtonsId: "#modalSlideUpFooter",
    },

    StickUp: {
        containerId: "#modalStickUp",
        dialogId: "#modalStickUpDialog",
        messageBoxTitleId: "#modalStickUpTitle",
        messageBoxBodyId: "#modalStickUpBody",
        messageBoxButtonsId: "#modalStickUpFooter",
    },

    SlideLeft: {
        containerId: "#modalSlideLeft",
        dialogId: "#modalSlideLeftDialog",
        messageBoxTitleId: "#modalSlideLeftTitle",
        messageBoxBodyId: "#modalSlideLeftBody",
        messageBoxButtonsId: "#modalSlideLeftFooter",
    },

};

var modalTitle = {
    SetTitle: function (header, description) {
        description = description || "";
        var title = '<h5 class="text-left p-b-5"><span class="semi-bold">' + header + ' </span></h5>';
        if (description != "") {
            title = title + '<p class="text-left p-b-10">' + description + '</p>';
        }
        return title;
    }
};

var Stacks = {
    stack_top_right: {
        "dir1": "down",
        "dir2": "left",
        "push": "top",
        "spacing1": 10,
        "spacing2": 10,
        //"context": $("#wcontext")
        //context: $("body")
    },
    stack_top_left: {
        "dir1": "down",
        "dir2": "right",
        "push": "top",
        "spacing1": 10,
        "spacing2": 10
    },
    stack_bottom_left: {
        "dir1": "right",
        "dir2": "up",
        "push": "top",
        "spacing1": 10,
        "spacing2": 10
    },
    stack_bottom_right: {
        "dir1": "left",
        "dir2": "up",
        "push": "top",
        "spacing1": 10,
        "spacing2": 10
    },
    stack_bar_top: {
        "dir1": "down",
        "dir2": "right",
        "push": "top",
        "spacing1": 0,
        "spacing2": 0
    },
    stack_bar_bottom: {
        "dir1": "up",
        "dir2": "right",
        "spacing1": 0,
        "spacing2": 0
    },
    stack_context: {
        "dir1": "down",
        "dir2": "left",
        "context": $("#wcontext")
    },
}

var MessageType = {
    Info: 'info',
    Warning: 'warning',
    Success: 'success',
    Danger: 'danger',
    Light: 'light',
    Dark: 'dark',
    System: 'system',
    Error: 'error'
};

var PositionType = {
    Top: 'stack_bar_top',
    Bottom: 'stack_bar_bottom',
    TopLeft: 'stack_top_left',
    TopRight: 'stack_top_right',
    BottomLeft: 'stack_bottom_left',
    BottomRight: 'stack_bottom_right'
};

var Messages = {

    Show: function (type, title, message, position, shadow, opacity, width, delay) {

        if (PNotify.notices.length > 5) {
            PNotify.notices.splice(PNotify.notices.length - 1, 1);
        }

        delay = delay || 4000;
        width = width || "350px";
        shadow = shadow || true;
        position = position || PositionType.TopRight;
        opacity = opacity || 1;

        if (position == PositionType.Top) {
            width = "100%";
        }
        if (position == PositionType.Bottom) {
            width = "70%";
        } else {
            //width ="550px";
        }

        var asd = new PNotify({
            title: title,
            text: message || "",
            shadow: shadow,
            opacity: opacity,
            addclass: position,
            type: type,
            stack: Stacks[position],
            width: width,
            delay: delay
        });
        //console.log(asd);
    },
    Info: function (title, message, position, shadow, opacity, width, delay) {
        title = $('#hdnNoftifyWarning').val();
        Messages.Show(MessageType.Warning, title, message, position, shadow, opacity, width, delay);
    },
    Success: function (title, message, position, shadow, opacity, width, delay) {
        title = title || $('#hdnNoftifySuccess').val();
        Messages.Show(MessageType.Success, title, message, position, shadow, opacity, width, delay);
    },
    Alert: function (title, message, position, shadow, opacity, width, delay) {
        title = title || "Uyarı";
        Messages.Show(MessageType.Alert, title, message, position, shadow, opacity, width, delay);
    },
    Danger: function (title, message, position, shadow, opacity, width, delay) {
        title = $('#hdnNoftifyDanger').val();
        Messages.Show(MessageType.Error, title, message, position, shadow, opacity, width, delay);
    },
    Warning: function (title, message, position, shadow, opacity, width, delay) {
        title = $('#hdnNoftifyWarning').val();
        //console.log(title);
        Messages.Show(MessageType.Warning, title, message, position, shadow, opacity, width, delay);
    },
    Light: function (title, message, position, shadow, opacity, width, delay) {
        title = title || "Bilgilendirme";
        Messages.Show(MessageType.Light, title, message, position, shadow, opacity, width, delay);
    },
    Dark: function (title, message, position, shadow, opacity, width, delay) {
        title = title || "Bilgilendirme";
        Messages.Show(MessageType.Dark, title, message, position, shadow, opacity, width, delay);
    },
    System: function (title, message, position, shadow, opacity, width, delay) {
        title = title || "Bilgilendirme";
        Messages.Show(MessageType.System, title, message, position, shadow, opacity, width, delay);
    },

};

var pageScroll = {
    goTop: function () {
        $('html,body').animate({ scrollTop: 0 }, 'slow'); return false;
    },
};

var returnValue = true;

var validate = {
    variables: {
        //redHighlight: 'state-error',
        redHighlight: 'customError'
    },

    control: function (options) {
        returnValue = true;

        options = $.extend({

            element: '',
            allowNull: false

        }, options);

        var element = options.element;
        var allowNull = options.allowNull;
        element.each(function () {

            var $element = $(this);
            if ($element != null || $element != undefined) {
                var $elementTagName = $element.prop('tagName').toLowerCase();
                if ($elementTagName == 'select') {
                    validate._select($element, allowNull);

                } else if ($elementTagName == 'input' || $elementTagName == 'textarea') {
                    //if ($element.is('[type=number]')) {
                    //}
                    validate._input($element, allowNull);
                } else if ($elementTagName == 'div') {
                    validate._div($element, allowNull);
                } else if ($elementTagName == 'span') {
                    validate._span($element, allowNull);
                }
                else {
                    validate._input($element, allowNull);
                }
            }

        });
        if (!returnValue) {
            Messages.Warning("", "Lütfen gerekli alanları doldurunuz");
        }
        return returnValue;
    },

    _select: function (element, allowNull) {

        //console.log(element);
        //console.log(allowNull);
        //console.log($.trim(element.val()));
        if (allowNull == false && ($.trim(element.val()) <= 0)) {
            if (element.hasClass('select2')) {

                var subs = $(element).parent().find('.form-control');
                //$.each(subs, function() {
                //    console.log(this);

                //    $(this).addClass("customError");
                //});
                if (subs.length > 0) {
                    $(subs[0]).addClass(validate.variables.redHighlight);
                }

            } else {
                element.addClass(validate.variables.redHighlight);

            }

            returnValue = false;

        } else {

            if (element.hasClass('select2')) {
                var subs = $(element).parent().find('.form-control');
                if (subs.length > 0) {
                    $(subs[0]).removeClass(validate.variables.redHighlight);
                }

            } else {
                element.removeClass(validate.variables.redHighlight);

            }


        }

    },

    _input: function (element, allowNull) {

        if (allowNull == false && ($.trim(element.val()) == '' || Number(element.val()) == 0)) {
            //var divError = element.closest(".field");

            if (element.hasClass('select2') || element.hasClass('select2-input')) {
                var subs = $(element).parent().find('.required');
                //console.log(subs);
                if (subs.length > 0) {
                    $(subs[0]).addClass(validate.variables.redHighlight);

                }


            } else {
                element.addClass(validate.variables.redHighlight);

            }
            //$(divError).addClass(validate.variables.redHighlight);
            returnValue = false;
            //console.log(element);

        }
        //else if (element.closest(".field").hasClass(validate.variables.redHighlight)) {
        else if (element.hasClass(validate.variables.redHighlight)) {

            if (element.hasClass('select2') || element.hasClass('select2-input')) {
                var subs = $(element).parent().find('.required');
                //console.log(subs);
                if (subs.length > 0) {
                    $(subs[0]).removeClass(validate.variables.redHighlight);

                }

            } else {
                element.removeClass(validate.variables.redHighlight);

            }
            //element.closest(".field").removeClass(validate.variables.redHighlight);

        }

    },
    _div: function (element, allowNull) {
        if (element.hasClass('summernoteDiv')) {
            if (allowNull == false && ($.trim($(element).find('.note-editable').text()) <= 0)) {

                var subs = $(element).find('.note-editable');
                if (subs != null) {
                    $(subs).addClass(validate.variables.redHighlight);


                }
                returnValue = false;
            }
            else {
                //if (element.closest(".select2  ").hasClass(validate.variables.redHighlight)) {
                if ($(element).find('.note-editable').hasClass(validate.variables.redHighlight)) {

                    var subs = $(element).find('.note-editable');

                    if (subs != null) {
                        $(subs).removeClass(validate.variables.redHighlight);

                    }


                }
            }

        } else if (element.hasClass('editable')) {
            if (allowNull == false && ($.trim($(element).text()) <= 0)) {

                $(element).addClass(validate.variables.redHighlight);

                returnValue = false;
            }
            else {
                //if (element.closest(".select2  ").hasClass(validate.variables.redHighlight)) {
                if ($(element).hasClass(validate.variables.redHighlight)) {

                    $(element).removeClass(validate.variables.redHighlight);

                }
            }
        }
    },
    _span: function (element, allowNull) {

        if (allowNull == false && (element.html() == '')) {
            //var divError = element.closest(".field");


            element.addClass(validate.variables.redHighlight);

            returnValue = false;

        }
        else if (element.hasClass(validate.variables.redHighlight)) {

            element.removeClass(validate.variables.redHighlight);


        }
    },
    _inputMinMax: function (element, minValue, maxValue) {

        var cond = false;

        if ($.trim(element.val()) >= minValue && $.trim(element.val()) <= maxValue) {
            cond = true;
        } else {
            cond = false;
        }

        if (!cond) {
            element.closest(".field").addClass(validate.variables.redHighlight);
            returnValue = false;
        }
        else if (element.closest(".field").hasClass(validate.variables.redHighlight)) {
            element.closest(".field").removeClass(validate.variables.redHighlight);
        }


    }

};

var grids = {

    initGrid: function (obj) {
        var initTableWithSearchManuel = function (obj2) {
            var table = obj;

            var settings = {
                "sDom": "<'table-responsive't><'row'<p i>>",
                "sPaginationType": "bootstrap",
                "destroy": true,
                "scrollCollapse": true,
                "oLanguage": {
                    "sLengthMenu": "_MENU_ ",
                    "sInfo": "  _TOTAL_ Kayıttan _START_ - _END_ Arası Kayıtlar"
                },
                "iDisplayLength": 10
            };

            table.dataTable(settings);

            // search box for table
            $('.search-table').keyup(function () {
                table.fnFilter($(this).val());
            });
        };
        initTableWithSearchManuel(obj);
    },
    hasElement: function (gridName) {
        var hasElement = false;

        ajaxMethods.post('/Domain/GetGridSelectedCountbyName', { gridName: gridName }, function (response) {
            if (response != 0) {

                hasElement = true;
            }
            Messages.Warning("", "Seçili bir kolon bulunmamaktadır.");
        });
    }

}

var customValidates = {
    email: function validateEmail(email) {
        var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
        if (reg.test(email)) {
            return true;
        }
        else {
            return false;
        }
    }
}

var sweet = {
    alert2: function () {
        swal({ title: "Are you sure?", text: "You will not be able to recover this imaginary file!", type: "warning", showCancelButton: true, confirmButtonColor: "#DD6B55", confirmButtonText: "Yes, delete it!", cancelButtonText: "No, cancel plx!", closeOnConfirm: false, closeOnCancel: false }, function (isConfirm) {
            if (isConfirm) {
                swal("Deleted!", "Your imaginary file has been deleted.", "success");
            } else {
                swal("Cancelled", "Your imaginary file is safe :)", "error");
            }
        });
    },

    alert: function (title, text, cancelButtonText, confirmButtonText, confirmCallBackText, cancelCallbacktext, confirmFunction) {
        swal({ title: title, text: text, type: "warning", showCancelButton: true, confirmButtonColor: "#DD6B55", confirmButtonText: confirmButtonText, cancelButtonText: cancelButtonText, closeOnConfirm: false, closeOnCancel: false },
            function (isConfirm) {
                if (isConfirm) {
                    confirmFunction();
                } else {
                    swal("", cancelCallbacktext, "error");
                }
            });
    },

    pageAlert: function () {

    }
};

var tablecomment;

var entitycomment;

var general = {

    getPriorSiteMapPage: function () {
        localStorage.isSiteClick = 1;
        ajaxMethods.post('/Domain/GetPriorSiteMapPage', {}, function (response) {
            console.log(response.Url);

            location.href = response.Url;
        });
    },
    addAndCancel: function (url, dataToPost, callback) {
        ajaxMethods.post(url, dataToPost, function (response) {
            if (callback != undefined) {
                callback(response, general.getPriorSiteMapPage);
                return;
            }
            general.getPriorSiteMapPage();
        });
    },

    reload: function () {
        window.reload(true);
    },

    setMiniComment: function () {

    },

    initFloating: function () {
        var n = function (t) {
            "" != t.val() ? t.addClass("edited") : t.removeClass("edited");
        };
        $("body").on("keydown", ".form-md-floating-label .form-control", function (t) {
            n($(this));
        }), $("body").on("blur", ".form-md-floating-label .form-control", function (t) {
            n($(this));
        }), $(".form-md-floating-label .form-control").each(function () {
            $(this).val().length > 0 && $(this).addClass("edited");
        });

    },

    newMiniComment: function (obj) {

        var $obj = $(obj);
        var tablecomment = $obj.data('table');
        var entitycomment = $obj.data('entity');
        $('#btnRemoveMini').click();
        //$('.miniComment').tooltip('destroy');
        $obj.tooltipster({
            content: $('#hdnLoading').val(),
            //position: 'right',
            trigger: 'click',
            multiple: false,
            autoClose: false,
            onlyOne: true,
            delay: 0,
            speed: 0,
            animation: 'fade',
            theme: 'tooltipster-shadow',
            functionBefore: function (origin, continueTooltip) {

                continueTooltip();
                $.ajax({
                    type: 'POST',
                    url: '/Domain/GetMiniComment',
                    data: { table: tablecomment, id: entitycomment },
                    success: function (response) {
                        origin.tooltipster('content', $(response));
                        $('#btnSendMini').on('click', function () {
                            var tt = $('#txtMini').val();
                            if (tt) {
                                $('#txtMini').removeClass('customError');

                            } else {
                                $('#txtMini').addClass('customError');
                                return;
                            }

                            ajaxMethods.post('/Domain/SaveEntityMiniComment', { table: tablecomment, entity: entitycomment, comment: tt }, function (response) {

                                if (response.Code == 101) {

                                    //badge
                                    Messages.Success("", response.Message);
                                    origin.tooltipster('destroy');
                                    var badge = $obj.parent().find('.badge');
                                    if (parseInt($(badge[0]).html()) == 0) {
                                        var badgeIcon = $obj.parent().find('.tas-comment-plus');
                                        $(badgeIcon[0]).css('color', '');
                                        $(badge[0]).show();
                                    }
                                    $(badge[0]).html(parseInt($(badge[0]).html()) + 1);
                                } else {
                                    Messages.Danger("", response.Message);
                                }
                            });
                        });

                        $('#btnRemoveMini').on('click', function () {

                            $obj.tooltipster('destroy');
                        });



                    }
                });

            },
            functionReady: function (origin, tooltip) {

            }

        });
        $obj.tooltipster('show', function () {



        });

    },

    newMiniCommentQuestion: function (obj) {
        var $obj = $(obj);
        var tablecomment = 'DomainQuestion'// $obj.data('table');
        var entitycomment = $('#QuestionId').val();
        $('#btnRemoveMini').click();
        //$('.miniComment').tooltip('destroy');
        $obj.tooltipster({
            content: $('#hdnLoading').val(),
            //position: 'right',
            trigger: 'click',
            multiple: false,
            autoClose: false,
            onlyOne: true,
            delay: 0,
            speed: 0,
            animation: 'fade',
            theme: 'tooltipster-shadow',
            functionBefore: function (origin, continueTooltip) {
                continueTooltip();
                $.ajax({
                    type: 'POST',
                    url: '/Domain/GetMiniComment',
                    data: { table: tablecomment, id: entitycomment },
                    success: function (response) {
                        origin.tooltipster('content', $(response));
                        $('#btnSendMini').on('click', function () {
                            var tt = $('#txtMini').val();
                            if (tt) {
                                $('#txtMini').removeClass('customError');

                            } else {
                                $('#txtMini').addClass('customError');
                                return;
                            }

                            ajaxMethods.post('/Domain/SaveEntityMiniComment', { table: tablecomment, entity: entitycomment, comment: tt }, function (response) {

                                if (response.Code == 101) {
                                    //badge                                    
                                    Messages.Success("", response.Message);
                                    origin.tooltipster('destroy');
                                    var badge = $obj.parent().find('.badge');
                                    if (parseInt($(badge[0]).html()) == 0) {
                                        var badgeIcon = $obj.parent().find('.tas-comment-plus');
                                        $(badgeIcon[0]).css('color', '');
                                        $(badge[0]).show();
                                    }
                                    $(badge[0]).html(parseInt($(badge[0]).html()) + 1);
                                } else {
                                    Messages.Danger("", response.Message);
                                }
                            });
                        });

                        $('#btnRemoveMini').on('click', function () {
                            $obj.tooltipster('destroy');
                        });
                    }
                });

            },
            functionReady: function (origin, tooltip) { }

        });
        $obj.tooltipster('show', function () { });

    },

    newMiniCommentWithStringId: function (obj) {

        var $obj = $(obj);
        var tablecomment = $obj.data('table');
        var entitycomment = $obj.data('entity');
        $('#btnRemoveMini').click();
        //$('.miniComment').tooltip('destroy');
        $obj.tooltipster({
            content: $('#hdnLoading').val(),
            //position: 'right',
            trigger: 'click',
            multiple: false,
            autoClose: false,
            onlyOne: true,
            delay: 0,
            speed: 0,
            animation: 'fade',
            theme: 'tooltipster-shadow',
            functionBefore: function (origin, continueTooltip) {

                continueTooltip();
                $.ajax({
                    type: 'POST',
                    url: '/Domain/GetMiniComment',
                    data: { table: tablecomment, id: entitycomment },
                    success: function (response) {
                        origin.tooltipster('content', $(response));
                        $('#btnSendMini').on('click', function () {
                            var tt = $('#txtMini').val();
                            if (tt) {
                                $('#txtMini').removeClass('customError');

                            } else {
                                $('#txtMini').addClass('customError');
                                return;
                            }

                            ajaxMethods.post('/Domain/SaveEntityMiniComment', { table: tablecomment, entity: entitycomment, comment: tt }, function (response) {

                                if (response.Code == 101) {

                                    //badge
                                    Messages.Success("", response.Message);
                                    origin.tooltipster('destroy');
                                    var badge = $obj.parent().find('.badge');
                                    if (parseInt($(badge[0]).html()) == 0) {
                                        var badgeIcon = $obj.parent().find('.tas-comment-plus');
                                        $(badgeIcon[0]).css('color', '');
                                        $(badge[0]).show();
                                    }
                                    $(badge[0]).html(parseInt($(badge[0]).html()) + 1);
                                } else {
                                    Messages.Danger("", response.Message);
                                }
                            });
                        });

                        $('#btnRemoveMini').on('click', function () {

                            $obj.tooltipster('destroy');
                        });



                    }
                });

            },
            functionReady: function (origin, tooltip) {

            }

        });
        $obj.tooltipster('show', function () {



        });


    },

    openCloseFormButtons: function (val) {
        var inputs = $('#divCompanentMain').find(':input').not(".select2-input");
        var baseButtons = $('#divCompanentMain').find('[data-frmbuttons=1]');

        if (baseButtons.length > 0) {
            //console.log(val.length > 0);
            if (val.length > 0) {
                $.each(baseButtons, function () {
                    var btnFrm = $(this);
                    btnFrm.removeClass('disabled');
                });
            } else {
                var isActive = 0;
                $.each(inputs, function () {
                    var inputD = $(this);
                    var cValue = $(this).val();
                    var oldV = $(this).data('oldValue');
                    if (inputD.attr('type') == 'checkbox') {
                        cValue = inputD.prop('checked');
                    }
                    if (cValue != oldV) {
                        //console.log('isactive', cValue);
                        //console.log('isactive', oldV);
                        //console.log(inputD);
                        isActive = 1;
                    }
                });

                //console.log('isactive', isActive);

                if (isActive == 1) {
                    $.each(baseButtons, function () {
                        var btnFrm = $(this);
                        btnFrm.removeClass('disabled');
                    });

                } else {
                    $.each(baseButtons, function () {
                        var btnFrm = $(this);
                        btnFrm.addClass('disabled');
                    });
                }
            }
        }



    }
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

var formatter = {
    formatPhoneNumber: function (phone) {
        phone = phone.replace(/[^\d]/g, "");
        if (phone.length >= 11) {
            phone = phone.substring(phone.length - 11);
            phone = phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
        }
        else if (phone.length == 10) {            
            phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
        }
        return phone;
    },
}