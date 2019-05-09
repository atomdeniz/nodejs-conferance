var messageBoxExam = {};

var ExamType = {
    MultipleChoice: '1',
    MultipleResponse: '2',
    Video: '3',
    TrueFalse: '4',
    FillInTheBlanks: '5',
    Matching: '6',
    Sequence: '7',
    WordBank: '8',
    Grouping: '9',
    WeightedMultiResponse: '10',
};

var examProcess = {
    showAnswer: function (questionType) {
        var langId = 1;// TODO: farklı dilleri destekleycek şekilde değişiklik yapılacak $('.clickedLanguge').data('key');
        ajaxMethods.post('/Question/GetExamQuestionAnswer', { langId: langId, questionType: questionType }, function (response) {
            if (response.QuestionType == ExamType.WordBank) {
                $(response.AnswerContent).each(function () {
                    if (this.RefKey != null) {

                        var targetPosition = $($($('[name=TargetOption][id=TargetOption' + this.RefKey + ']')).parent()).position();

                        var sourcePosition = $($('[name=SourceOption][id=SourceOption' + this.Id + ']').parent().parent().parent()).position();

                        var topUltimate = targetPosition.top - sourcePosition.top;

                        var sourceParent = $('[name=SourceOption][id=SourceOption' + this.Id + ']').parent();
                        sourceParent.removeAttr("style", "left");
                        sourceParent.attr("style", "pointer-events:none");
                        sourceParent.css({ right: 0, position: 'absolute' });

                        sourceParent.animate({ top: topUltimate, right: -5 }, 'slow');
                    } else {

                        $($('[name=SourceOption][id=SourceOption' + this.Id + ']').parent()).removeAttr("style", "top");
                        $($('[name=SourceOption][id=SourceOption' + this.Id + ']').parent()).attr("style", "pointer-events:none");
                    }
                });
            }
            else if (response.QuestionType == ExamType.Sequence) {

                $('.seqOption').each(function () {

                    var sequenceNumber = $(this).data('seq');

                    var target = $('#squenceHightControl' + sequenceNumber)
                    var source = $(this).parent();
                    var targetPosition = target.parent().position();

                    source.removeAttr("style", "left");
                    source.attr("style", "pointer-events:none");
                    source.css({ right: 0, position: 'absolute' });
                    source.animate({ top: -source.offset().top + target.offset().top + source.position().top, left: targetPosition.left }, 'slow');
                });

            }
            else if (response.QuestionType == ExamType.Matching) {
                $(response.AnswerContent).each(function () {
                    target = $($('[name=OptionForMatch][id=OptionForMatch' + this.Id + ']'));
                    var targetPosition = target.position();

                    var source = $($('[name=matchOption][id=matchOption' + this.Id + ']').parent());
                    var sourcePosition = source.position();

                    source.removeAttr("style", "left");
                    source.attr("style", "pointer-events:none; width:250px;height: 40px;");
                    source.css({ position: 'absolute' });
                    source.animate({ top: -source.offset().top + target.offset().top + source.position().top, right: source.offset().left - target.offset().left - source.position().left - 2 * target.width() - 5 }, 'slow');
                }
                );
            }
            else if (response.QuestionType == ExamType.Grouping) {
                $(response.AnswerContent).each(function () {
                    var position = $($('[name=groupOption][id=Option' + this.Id + ']'));
                    $(this.IntList).each(function () {
                        var matchOption = $('.matchOption' + this.valueOf());
                        matchOption.parent().removeClass("col-md-4");
                        $(position).append(matchOption.parent());
                        matchOption.parent().attr("style", "pointer-events:none");
                    });
                }
            );
            }
            else if (response.QuestionType == ExamType.FillInTheBlanks) {
                $(response.FillInTheBlank).each(function () {
                    $(this.AcceptableAnswers).each(function () {
                        $("input[name=Option][data-key=" + this.RefKey4 + "]").val(this.Name);
                    });
                });
            }
            else {
                $('[name=optionRadio]').prop("checked", false);
                $(response.AnswerContent).each(function () {
                    var self = this;
                    $('[name=Option]').each(function () {
                        var html = $(this).html();
                        if (html == self.Name) {
                            var div = $(this).parent().parent().parent();
                            $($(div).find('[name=optionRadio]')).prop("checked", true);
                        }
                    });
                });
            }
            var content = response.Proof.replace("<p>", "").replace("</p>", "");            
            $('#answerProofLabel').html(content);
            $('#AnswerProofDiv').css('display', 'inherit');
        });
    },
    adjustForFillInTheBlanks: function () {
        $(".fa-eye").remove();
        $('span[class=optionControl]').css("background-color", "");

        var count = 1;
        isUpper = false;
        $('span[class=optionControl]').each(function () {
            var length = 0;
            var self = this;
            var guidId = $($(this).find('.acceptableAnswersSpan')).attr('id');
            ajaxMethods.post('/Question/GetAcceptableAnswersJson', { id: guidId }, function (response) {
                var responseId = 0;
                $(response).each(function () {
                    length += this.RefKey4;
                    responseId = this.Id;
                });
                length = (length / response.length) + 5;
                var div = '<input style="color:#BB54D3; font-weight: bold; text-align: center;border:none; border-bottom:1px solid;" data-key="' + responseId + '" onkeyup="Expand(this)" class="ml5 changableSize fillQuestion" type="text" size="' + length + '" name="Option">';

                if ($('.fillAnswers[data-key=' + responseId + ']').length > 0) {
                    var val = $('.fillAnswers[data-key=' + responseId + ']').val();
                    div = '<input size="' + val.length + '" style="color:#BB54D3; font-weight: bold; text-align: center;border:none; border-bottom:1px solid;" data-key="' + responseId + '" onkeyup="Expand(this)" class="ml5 changableSize fillQuestion" type="text" size="' + length + '" name="Option" value="' + val + '">';
                };

                $(self).replaceWith(div);
                count++;
            });
        });
    }
}

var exam = {

    getExams: function (obj) {
        ajaxMethods.load(obj, '/Exam/GetExams', function () {
        });
    },

    deleteExam: function (id) {

    },

    getExamQuestionsByRoles: function (obj, selectedQuestions) {
        selectedQuestions = selectedQuestions || null;
        var selectedValues = '';

        $('#selectRoles :selected').each(function () {
            selectedValues = selectedValues + $(this).val() + ";";
        });
        ajaxMethods.load(obj, '/Exam/GetExamQuestions', { roles: selectedValues, selectedQuestions: selectedQuestions }, function () {
            if (selectedQuestions == null) {
                $('#hdnSelectedQuestions').val(' ');
            }
        });

    },

    activePasive: function (id) {
        messageBoxExam = new Modal(modalTypes.SlideLeft, "modal-md");
        messageBoxExam.popup({}).load('/Exam/GetExamActivePasivePartial', { id: id }).show();
    },

    SetExamAktif: function (id) {
        ajaxMethods.post('/Exam/SetExamActivePasive', { id: id }, function (response) {
            if (response.Code == 101) {

                Messages.Success(response.Message, NotificationType.Flip, PositionType.TopRight);
                messageBoxExam.hide();
                exam.getExams($('#divExams'));

            } else {
                Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
            }

        });
    },

    setCheckQuestion: function (obj) {
        var cObj = $(obj);
        var qVal = $('#hdnSelectedQuestions').val();
        var cResult = qVal.indexOf(cObj.val());
        if (cResult >= 0) {

            qVal = qVal.replace(cObj.val() + ';', '');
            //alert(qVal);
        } else {
            qVal += cObj.val() + ';';
        }

        $('#hdnSelectedQuestions').val(qVal);

    },

    saveExam: function () {

        function getStringCount(haystack, needle) {

            var words = haystack.split(needle),
                count = {};
            for (var i = 0, len = words.length; i < len; i++) {
                if (count.hasOwnProperty(words[i])) {
                    count[words[i]] = parseInt(count[words[i]], 10) + 1;
                } else {
                    count[words[i]] = 1;
                }
            }
            console.log(words.length - 1);
            return words.length - 1;

        };

        var validateResult = validate.control({
            element: $('#frmNewExam .required'),
        });
        if (validateResult) {

            var data1 = $('#hdnSelectedQuestions').val();
            var questionCount = getStringCount(data1, ';');

            var maxQ = $('#txtMaxQuestionCount').val();
            var selectedQ = questionCount;


            if (selectedQ != maxQ) {
                Messages.Danger('Girdiğiniz sınav soru sayısı kadar soru seçmelisiniz.' + selectedQ + ' adet soru seçmişsiniz.', NotificationType.Flip, PositionType.TopRight);
                return;
            }
            var dataToPost = $('#frmNewExam').serialize();
            dataToPost = dataToPost + '&Questions=' + data1;
            ajaxMethods.post('/Exam/SaveExam', dataToPost, function (response) {
                if (response.Code == 101) {
                    var messageBox = new Modal(modalTypes.SlideLeft, 'modal-sm');
                    messageBox.popup({
                        body: '<h5 class="text-primary "><span class="bold">İşlem Başarılı.</span>, sınav başarı ile eklendi.</h5><a class="btn btn-primary btn-block" href="/Exam/Exams">Sınavlara Git</a><a href="/Exam/NewExam" class="btn btn-default btn-block">Yeni Sınav Ekle</a>',
                    }).show();
                } else {
                    Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                }
            });


        }

    },

    editExam: function () {
        function getStringCount(haystack, needle) {

            var words = haystack.split(needle),
                count = {};
            for (var i = 0, len = words.length; i < len; i++) {
                if (count.hasOwnProperty(words[i])) {
                    count[words[i]] = parseInt(count[words[i]], 10) + 1;
                } else {
                    count[words[i]] = 1;
                }
            }
            console.log(words.length - 1);
            return words.length - 1;

        };
        //console.log($('#hdnSelectedQuestions').val());




        var validateResult = validate.control({
            element: $('#frmNewExam .required'),
        });
        if (validateResult) {

            var data1 = $('#hdnSelectedQuestions').val();
            var questionCount = getStringCount(data1, ';');

            var maxQ = $('#txtMaxQuestionCount').val();
            var selectedQ = questionCount;


            if (selectedQ != maxQ) {
                Messages.Danger('Girdiğiniz sınav soru sayısı kadar soru seçmelisiniz.' + selectedQ + ' adet soru seçmişsiniz.', NotificationType.Flip, PositionType.TopRight);
                return;
            }
            var dataToPost = $('#frmNewExam').serialize();
            dataToPost = dataToPost + '&Questions=' + data1;
            console.log(dataToPost);
            ajaxMethods.post('/Exam/EditExam', dataToPost, function (response) {
                if (response.Code == 101) {
                    var messageBox = new Modal(modalTypes.SlideLeft, 'modal-sm');
                    messageBox.popup({
                        body: '<h5 class="text-primary "><span class="bold">İşlem Başarılı.</span> Sınav güncellendi.</h5><a class="btn btn-primary btn-block" href="/Exam/Exams">Sınavlara Git</a>',
                    }).show();
                } else {
                    Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                }
            });


        }
    },

    setUserToExam: function (id) {


        messageBoxExam = new Modal(modalTypes.SlideUp, "modal-md");
        messageBoxExam.popup({}).load('/Exam/SetUserExamPartial', { id: id }).show();
    },

    getExamLocationPartial: function (divObject) {

        $(divObject).load("/Exam/GetExamLocationPartialView");
    },

    getNewLocation: function () {
        var messageBox = new Modal(modalTypes.SlideUp, "modal-lg");
        messageBox.popup({
            title: modalTitle.SetTitle("Yeni Sınav Lokasyonu", "Lütfen lokasyon bilgilerini giriniz."),
            body: '',
            buttons: [
                 {
                     id: 'btnCancel',
                     text: $('#hdnVazgecText').val(),
                     type: 'btn btn-danger m-t-3',
                     callback: function () {
                         messageBox.hide();
                     }
                 },
                 {
                     id: 'btnKaydet',
                     text: $('#hdnKaydetText').val(),
                     type: 'btn btn-primary m-t-7',
                     callback: function () {
                         var validateResult = validate.control({
                             element: $('#frmInsertLocation .required'),
                         });
                         if (validateResult) {
                             var dataToPost = $('#frmInsertLocation').serialize();
                             ajaxMethods.post('/Exam/AddNewExamLocation', dataToPost, function (response) {
                                 messageBox.hide();
                                 if (response.Code == 101) {
                                     exam.getExamLocationPartial($('#divTanimlananLokasyonlar'));
                                     Messages.Success(response.Message, NotificationType.Flip, PositionType.TopRight);
                                 } else {
                                     Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                                 }
                             });
                         }

                     }
                 }
            ]
        }).load('/Exam/GetNewLocationPartialView').show();
    },

    getLocationToUpdate: function (selectedValue) {
        var messageBox = new Modal(modalTypes.SlideUp, "modal-lg");
        messageBox.popup({
            title: modalTitle.SetTitle("Sınav Lokasyonu Güncelleme", "Lütfen lokasyon bilgilerini kontrol ediniz."),
            body: '',
            buttons: [
                 {
                     id: 'btnCancel',
                     text: $('#hdnVazgecText').val(),
                     type: 'btn btn-danger m-t-3',
                     callback: function () {
                         messageBox.hide();
                     }
                 },
                 {
                     id: 'btnKaydet',
                     text: $('#hdnKaydetText').val(),
                     type: 'btn btn-primary m-t-7',
                     callback: function () {
                         var validateResult = validate.control({
                             element: $('#frmInsertLocation .required'),
                         });
                         if (validateResult) {
                             var dataToPost = $('#frmInsertLocation').serialize();
                             console.log(dataToPost);
                             ajaxMethods.post('/Exam/UpdateExamLocation', dataToPost, function (response) {
                                 messageBox.hide();
                                 if (response.Code == 101) {
                                     exam.getExamLocationPartial($('#divTanimlananLokasyonlar'));
                                     Messages.Success(response.Message, NotificationType.Flip, PositionType.TopRight);
                                 } else {
                                     Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                                 }
                             });
                         }

                     }
                 }
            ]
        }).load('/Exam/GetLocationPartialViewToUpdate', { id: selectedValue }).show();
    },

    deleteExamLocation: function (selectedValue, selectedText) {
        var messageBox = new Modal(modalTypes.SlideLeft, 'modal-sm');
        messageBox.popup({
            body: '<h5 class="text-primary" <span class="bold">' + selectedText + '</span> adlı sınav lokasyonunu tamamen silmek istediğinizden emin misiniz?</h5>',
            buttons: [
                {
                    id: 'btnDelete',
                    text: $('#hdnEvetText').val(),
                    type: 'btn-primary',
                    callback: function () {
                        ajaxMethods.post('/Exam/DeleteExamLocation', { id: selectedValue }, function (response) {
                            messageBox.hide();
                            if (response.Code == 101) {
                                exam.getExamLocationPartial($('#divTanimlananLokasyonlar'));
                                Messages.Success(response.Message, NotificationType.Flip, PositionType.TopRight);
                            } else {
                                Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                            }
                        });
                    }
                },
                {
                    id: 'btnCancel',
                    text: $('#hdnVazgecText').val(),
                    type: 'btn-danger',
                    callback: function () {
                        messageBox.hide();
                    }
                }
            ]
        }).show();
    },

    getExamLocationsByCity: function (selectedValue) {

        ajaxMethods.post("/Exam/GetExamLocationsByCity", { "id": selectedValue }, function (response) {
            var obj = $('#selectLocation')
                .find('option')
                .remove()
                .end();

            for (var attr in response) {



                obj.append('<option value="' + response[attr].Id + '">' + response[attr].Name + '</option>');

            }


            $('#selectLocation').select2();
            return;

        });
    },

    startUserDemoExam: function (id) {
        ajaxMethods.post(' /Exam/StartDemo', { id: id }, function (response) {

            if (response.Code == 101) {

                function fullScreen(theURL) {
                    window.open(theURL, '', 'fullscreen=yes, scrollbars=auto,menubar=no');
                }

                fullScreen('/Exams');
                //window.open("/Exams", null,
                //    'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=yes, copyhistory=no, width=w, height=h, top=top, left=left');
                //window.moveTo(0, 0);
                //window.resizeTo(screen.width, screen.height);
            } else {
                Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
            }

        });
    },

    getExamMachinePartial: function (divObject) {
        $(divObject).load("/Exam/GetExamMachinePartialView");
    },

    getExamRoomPartial: function (divObject) {
        $(divObject).load("/Exam/GetExamRooms");
    },

    deleteExamRoom: function (selectedValue, selectedText) {
        var messageBox = new Modal(modalTypes.SlideLeft, 'modal-sm');
        messageBox.popup({
            body: '<h5 class="text-primary" <span class="bold">' + selectedText + '</span> adlı salonu tamamen silmek istediğinizden emin misiniz?</h5>',
            buttons: [
                {
                    id: 'btnDelete',
                    text: $('#hdnEvetText').val(),
                    type: 'btn-primary',
                    callback: function () {
                        ajaxMethods.post('/Exam/DeleteExamRoom', { id: selectedValue }, function (response) {
                            messageBox.hide();
                            if (response.Code == 101) {
                                exam.getExamRoomPartial($('#divSiniflar'));
                                Messages.Success(response.Message, NotificationType.Flip, PositionType.TopRight);
                            } else {
                                Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                            }
                        });
                    }
                },
                {
                    id: 'btnCancel',
                    text: $('#hdnVazgecText').val(),
                    type: 'btn-danger',
                    callback: function () {
                        messageBox.hide();
                    }
                }
            ]
        }).show();
    },

    getNewMachine: function () {
        var messageBox = new Modal(modalTypes.SlideUp, "modal-lg");
        messageBox.popup({
            title: modalTitle.SetTitle("Yeni Sınav Bilgisayarı", "Lütfen bilgisayar bilgilerini giriniz."),
            body: '',
            buttons: [
                 {
                     id: 'btnCancel',
                     text: $('#hdnVazgecText').val(),
                     type: 'btn btn-danger m-t-3',
                     callback: function () {
                         messageBox.hide();
                     }
                 },
                 {
                     id: 'btnKaydet',
                     text: $('#hdnKaydetText').val(),
                     type: 'btn btn-primary m-t-7',
                     callback: function () {
                         var validateResult = validate.control({
                             element: $('#frmInsertMachine .required'),
                         });
                         if (validateResult) {
                             var dataToPost = $('#frmInsertMachine').serialize();
                             ajaxMethods.post('/Exam/AddNewExamMachine', dataToPost, function (response) {
                                 messageBox.hide();
                                 if (response.Code == 101) {
                                     exam.getExamMachinePartial($('#divTanimlananMakineler'));
                                     Messages.Success(response.Message, NotificationType.Flip, PositionType.TopRight);
                                 } else {
                                     Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                                 }
                             });
                         }

                     }
                 }
            ]
        }).load('/Exam/GetNewMachinePartialView').show();
    },

    getNewRoom: function () {
        var messageBox = new Modal(modalTypes.SlideUp, "modal-lg");
        messageBox.popup({
            title: modalTitle.SetTitle("Yeni Salon", "Lütfen salon bilgilerini giriniz."),
            body: '',
            buttons: [
                 {
                     id: 'btnCancel',
                     text: $('#hdnVazgecText').val(),
                     type: 'btn btn-danger m-t-3',
                     callback: function () {
                         messageBox.hide();
                     }
                 },
                 {
                     id: 'btnKaydet',
                     text: $('#hdnKaydetText').val(),
                     type: 'btn btn-primary m-t-7',
                     callback: function () {
                         var validateResult = validate.control({
                             element: $('#frmInsertRoom .required'),
                         });
                         if (validateResult) {
                             var dataToPost = $('#frmInsertRoom').serialize();
                             ajaxMethods.post('/Exam/SaveNewRoom', dataToPost, function (response) {
                                 messageBox.hide();
                                 if (response.Code == 101) {
                                     exam.getExamRoomPartial($('#divSiniflar'));
                                     Messages.Success(response.Message, NotificationType.Flip, PositionType.TopRight);
                                 } else {
                                     Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                                 }
                             });
                         }

                     }
                 }
            ]
        }).load('/Exam/GetNewRoomsPartialView').show();
    },

    getUpdateExamRoom: function (selectedValue) {
        var messageBox = new Modal(modalTypes.SlideUp, "modal-lg");
        messageBox.popup({
            title: modalTitle.SetTitle("Salon Güncelleme", "Lütfen salon bilgilerini kontrol ediniz."),
            body: '',
            buttons: [
                 {
                     id: 'btnCancel',
                     text: $('#hdnVazgecText').val(),
                     type: 'btn btn-danger m-t-3',
                     callback: function () {
                         messageBox.hide();
                     }
                 },
                 {
                     id: 'btnKaydet',
                     text: $('#hdnKaydetText').val(),
                     type: 'btn btn-primary m-t-7',
                     callback: function () {
                         var validateResult = validate.control({
                             element: $('#frmInsertRoom .required'),
                         });
                         if (validateResult) {
                             var dataToPost = $('#frmInsertRoom').serialize();
                             ajaxMethods.post('/Exam/UpdateExamRoom', dataToPost, function (response) {
                                 messageBox.hide();
                                 if (response.Code == 101) {
                                     exam.getExamRoomPartial($('#divSiniflar'));
                                     Messages.Success(response.Message, NotificationType.Flip, PositionType.TopRight);
                                 } else {
                                     Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                                 }
                             });
                         }

                     }
                 }
            ]
        }).load('/Exam/GetRoomEditPartialView', { id: selectedValue }).show();
    },

    deleteExamMachine: function (selectedValue, selectedText) {
        var messageBox = new Modal(modalTypes.SlideLeft, 'modal-sm');
        messageBox.popup({
            body: '<h5 class="text-primary" <span class="bold">' + selectedText + '</span> adlı sınav bilgisayarını tamamen silmek istediğinizden emin misiniz?</h5>',
            buttons: [
                {
                    id: 'btnDelete',
                    text: $('#hdnEvetText').val(),
                    type: 'btn-primary',
                    callback: function () {
                        ajaxMethods.post('/Exam/DeleteExamMachine', { id: selectedValue }, function (response) {
                            messageBox.hide();
                            if (response.Code == 101) {
                                exam.getExamMachinePartial($('#divTanimlananMakineler'));
                                Messages.Success(response.Message, NotificationType.Flip, PositionType.TopRight);
                            } else {
                                Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                            }
                        });
                    }
                },
                {
                    id: 'btnCancel',
                    text: $('#hdnVazgecText').val(),
                    type: 'btn-danger',
                    callback: function () {
                        messageBox.hide();
                    }
                }
            ]
        }).show();
    },

    getExamAppointmentPartial: function (divObject) {
        $(divObject).load("/Exam/GetExamAppointmentPartialView");
    },

    saveNewExamAppointment: function () {
        var validateResult = validate.control({
            element: $('#frmInsertAppointment .required'),
        });
        if (validateResult) {
            var dataToPost = $('#frmInsertAppointment').serialize();
            ajaxMethods.post('/Exam/AddNewExamAppointment', dataToPost, function (response) {
                if (response.Code == 101) {
                    var messageBox = new Modal(modalTypes.SlideLeft, 'modal-sm');
                    messageBox.popup({
                        body: '<h5 class="text-primary "><span class="bold">Oturum </span> başarıyla oluşturuldu.</h5><a class="btn btn-primary btn-block" href="/Exam/ExamAppointment">Oturumlara Git</a><a href="/Exam/NewExamAppointment" class="btn btn-default btn-block">Yeni Oturum Ekle</a>',
                    }).show();
                    Messages.Success(response.Message, NotificationType.Flip, PositionType.TopRight);
                } else {
                    Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                }
            });
        }
    },

    deleteExamAppointment: function (selectedValue, selectedText) {
        var messageBox = new Modal(modalTypes.SlideLeft, 'modal-sm');
        messageBox.popup({
            body: '<h5 class="text-primary" <span class="bold">' + selectedText + '</span> adlı sınav oturumunu tamamen silmek istediğinizden emin misiniz?</h5>',
            buttons: [
                {
                    id: 'btnDelete',
                    text: $('#hdnEvetText').val(),
                    type: 'btn-primary',
                    callback: function () {
                        ajaxMethods.post('/Exam/DeleteExamAppointment', { id: selectedValue }, function (response) {
                            messageBox.hide();
                            if (response.Code == 101) {
                                exam.getExamAppointmentPartial($('#divAppointments'));
                                Messages.Success(response.Message, NotificationType.Flip, PositionType.TopRight);
                            } else {
                                Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                            }
                        });
                    }
                },
                {
                    id: 'btnCancel',
                    text: $('#hdnVazgecText').val(),
                    type: 'btn-danger',
                    callback: function () {
                        messageBox.hide();
                    }
                }
            ]
        }).show();
    },

    setUserToAppointmen: function (id) {

        messageBoxExam = new Modal(modalTypes.StickUp, "modal-md");
        messageBoxExam.popup({}).load('/Exam/GetAttachUser', { id: id }).show();
    },

    saveUserExam: function () {

        var validateResult = validate.control({
            element: $('#frmAddUserExam .required'),
        });

        //alert(validateResult);
        if (validateResult) {
            var dataToPost = $('#frmAddUserExam').serialize();

            ajaxMethods.post('/Exam/SaveUserAppointment', dataToPost, function (response) {
                if (response.Code == 101) {

                    Messages.Success(response.Message, NotificationType.Flip, PositionType.TopRight);
                    messageBoxExam.hide();

                } else {
                    Messages.Danger(response.Message, NotificationType.Flip, PositionType.TopRight);
                }

            });
        }
    },

    getTownByCity: function (obj, selectedValue) {
        selectedValue = selectedValue || null;
        var cId = $(obj).val();
        ajaxMethods.post("/Exam/GetTownsByCity", { "id": cId }, function (response) {
            var objSelect = $('#selectTown')
                .find('option')
                .remove()
                .end();
            objSelect.append('<option value="-1" selected>Seçiniz</option>');
            for (var attr in response) {
                if (response[attr].Id == selectedValue) {
                    objSelect.append('<option value="' + response[attr].Id + '" selected>' + response[attr].Name + '</option>');
                    continue;
                }
                objSelect.append('<option value="' + response[attr].Id + '">' + response[attr].Name + '</option>');
            }
            $('#selectTown').select2();
            return;

        });

    },

    getTownByCityLoad: function (obj, selectedValue) {

        var cId = $(obj).val();
        ajaxMethods.post("/Exam/GetTownsByCity", { "id": cId }, function (response) {
            var objSelect = $('#selectTown')
                .find('option')
                .remove()
                .end();
            objSelect.append('<option value="-1" selected>Seçiniz</option>');
            for (var attr in response) {

                if (response[attr].Id == selectedValue) {
                    objSelect.append('<option value="' + response[attr].Id + '" selected>' + response[attr].Name + '</option>');
                    continue;
                }

                objSelect.append('<option value="' + response[attr].Id + '">' + response[attr].Name + '</option>');

            }


            $('#selectTown').select2();
            exam.getLocationByTown($('#selectTown'));

            return;
        });

    },

    getLocationByTown: function (obj) {
        var selectedValue = $('#hdnLocationId').val() || null;

        var cId = $(obj).val();
        console.log(cId);
        ajaxMethods.post("/Exam/GetLocationByTownExam", { "id": cId }, function (response) {
            var objSelect = $('#selectLocation')
                .find('option')
                .remove()
                .end();
            objSelect.append('<option value="-1" selected>Seçiniz</option>');
            for (var attr in response) {

                if (response[attr].Id == selectedValue) {
                    objSelect.append('<option value="' + response[attr].Id + '" selected>' + response[attr].Name + '</option>');
                    continue;
                }

                objSelect.append('<option value="' + response[attr].Id + '">' + response[attr].Name + '</option>');

            }


            $('#selectLocation').select2();
            return;

        });
    },

    getLocationByTownLoad: function (obj) {
        var cId = $(obj).val();
        $('#selectRoom')
             .find('option')
             .remove()
             .end();
        $('#selectRoom').select2();
        if (cId == null || cId == undefined || cId == '') {

            return;
        }
        ajaxMethods.post("/Exam/GetLocationByTown", { "id": cId }, function (response) {
            var objSelect = $('#selectLocation')
                .find('option')
                .remove()
                .end();

            for (var attr in response) {


                objSelect.append('<option value="' + response[attr].Id + '">' + response[attr].Name + '</option>');

            }
            console.log(response);
            $('#selectLocation').select2();
            exam.getRoomByLocation($('#selectLocation'));


        });
    },

    getMachineLocationByTownLoad: function (obj) {
        var cId = $(obj).val();
        $('#selectRoom')
             .find('option')
             .remove()
             .end();
        $('#selectRoom').select2();
        if (cId == null || cId == undefined || cId == '') {

            return;
        }
        ajaxMethods.post("/Exam/GetLocationByCity", { "id": cId }, function (response) {
            var objSelect = $('#selectLocation')
                .find('option')
                .remove()
                .end();

            for (var attr in response) {


                objSelect.append('<option value="' + response[attr].Id + '">' + response[attr].Name + '</option>');

            }
            console.log(response);
            $('#selectLocation').select2();
            exam.getRoomByLocation($('#selectLocation'));


        });
    },

    getRoomByLocation: function (obj) {
        var cId = $(obj).val();
        if (cId == undefined || cId == '') {
            return;
        }
        ajaxMethods.post("/Exam/GetRoomByLocation", { "id": cId }, function (response) {
            var objSelect = $('#selectRoom')
                .find('option')
                .remove()
                .end();

            for (var attr in response) {



                objSelect.append('<option value="' + response[attr].Id + '">' + response[attr].Name + '</option>');

            }


            $('#selectRoom').select2();
            return;

        });
    },


};