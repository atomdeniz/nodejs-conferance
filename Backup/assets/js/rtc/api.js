var api = {
    loadWithAuthentication: function (container, url, data, successCallback, errorCallback) {
        $.ajaxSetup({
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + api.getKey());
            }
        });
        container.load(url, data, successCallback, errorCallback);
    },
    post: function (url, data, successCallback, errorCallback) {
        $.ajaxSetup({
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + api.getKey());
            }
        });
        $.post(url, data, successCallback, errorCallback);
    },
    postWithJson: function (url, data, successCallback, errorCallback) {
        debugger;
        var request = $.ajax({
            type: "POST",
            url: url,
            data: data,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + api.getKey());
            },
            contentType: "application/json",
            dataType: "json",
            // success: successCallback,
            // error: errorCallback
        });
        request.done(function (response) {
            container.html(response);
            if (successCallback)
                successCallback(response);
        });

        request.fail(function (jqXHR, textStatus) {
            console.log("Request failed: " + textStatus);
            if (errorCallback)
                errorCallback(textStatus);
        });
    },
    checkLogin: function () {
        var interviewKey = api.getQueryString('key');
        if (api.getKey().length == 0) {
            if (location.pathname !== "/login" && interviewKey === null) {
                location.href = "/login" + window.location.search;
            } else if (location.pathname === "/public" && interviewKey !== null) {
                api.loginWithKey(interviewKey);
            }
        } else {
            if (location.pathname === "/login") {
                window.location = "/" + window.location.search;
            } else if (location.pathname === "/public") {
                api.loginWithKey(interviewKey);
            }
        }
    },
    login: function (element) {
        var formData = element.serialize();
        var postUrl = api.getApiRoot();
        $.ajax({
            type: "POST",
            url: postUrl + "/oauth/token",
            data: formData,
            contentType: "application/x-www-form-urlencoded",
            dataType: "json",
            success: function (response) {
                if (response && response.access_token) {
                    api.setKey(response.access_token, response.expires_in);
                    window.location = "/" + window.location.search;
                }
            },
            error: function (response) {
                if (response && response.responseJSON && response.responseJSON.error) {
                    if (response.responseJSON.error === "invalid_grant")
                        Messages.Alert("Hata", "Girdiğiniz bilgilere ait bir kullanıcı bulunamadı.");
                }
            }
        });
    },
    loginWithKey: function (key) {
        var postUrl = api.getApiAuthorizationUrl(),
            formData = {
                "grant_type": "interviewkey",
                "interviewKey": key
            };
        $.ajax({
            type: "POST",
            url: postUrl + "/oauth/token",
            data: formData,
            contentType: "application/x-www-form-urlencoded",
            dataType: "json",
            success: function (response) {
                if (response && response.access_token) {
                    api.setKey(response.access_token, response.expires_in);
                    window.location = "/?r=" + response.RoomKey + "&u=" + response.UserKey;
                }
            },
            error: function (response) {
                if (response && response.responseJSON && response.responseJSON.error) {
                    if (response.responseJSON.error === "invalid_grant")
                        Messages.Alert("Hata", "Girdiğiniz bilgilere ait bir kullanıcı bulunamadı.");
                }
            }
        });
    },
    getQueryString: function (field, url) {
        var href = url ? url : window.location.href;
        var reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
        var string = reg.exec(href);
        return string ? string[1] : null;
    },
    getKey: function () {
        if (localStorage.access_token && localStorage.access_token_expire) {
            var tokenTime = moment(new Date(localStorage.access_token_expire));
            var currentTime = moment();
            if (currentTime < tokenTime)
                return localStorage.access_token;
        }
        return "";
    },
    setKey: function (key, expire) {
        var expireDate = moment().add(expire, 'seconds');
        localStorage.setItem("access_token_expire", expireDate);
        localStorage.setItem("access_token", key);
    },
    getApiRoot: function () {
        return "https://hcm-manager-dev.opthemateknoloji.com/";
    },
    getApiAuthorizationUrl: function () {
        return "https://hcm-api-demo.opthemateknoloji.com/";
    }
}

$(document).ready(function () {
    api.checkLogin();
});