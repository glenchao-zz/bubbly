(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/home.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            // TODO: Initialize the page here.
            WinJS.Utilities.query("a").listen("click", linkClickEventHandler, false);
            WinJS.Utilities.query("#facebookLoginBtn").listen("click", logIntoFacebook, false);
            WinJS.Utilities.query("#usernameForm .input").listen("keyup", validateUsername, false);
            WinJS.Utilities.query("#usernameForm .submit").listen("click", startGame, false);
        }
    });

    var validationTimer;
    var bValidated = false;
    function validateUsername(evt) {
        evt.preventDefault();
        bValidated = false;
        if (validationTimer) {
            clearTimeout(validationTimer);
            validationTimer = setTimeout(validate, 1000, evt);
        }
        else
            validationTimer = setTimeout(validate, 1000, evt);
        
        function validate(evt) {
            var warningDiv = document.querySelector("#usernameForm .warning");
            var submitBtn = document.querySelector("#usernameForm .submit");
            var username = evt.srcElement.value;
            var bValidUsername = !(/\W/g).test(username) && username.length > 0 && username.length < 21;
            if (bValidUsername) {
                // show start game button
                bValidated = true;
                warningDiv.textContent = "";
                submitBtn.disabled = false;

            }
            else {
                // show warning 
                warningDiv.textContent = "Only letters, numbers, and underscore are allowed...";
                submitBtn.disabled = true;
            }
        }
    }

    function startGame(evt) {
        if (bValidated) {
            var applicationData = Windows.Storage.ApplicationData.current;
            var localSettings = applicationData.localSettings;
            var username = document.querySelector("#usernameForm .input").value;
            var doubleCheck = !(/\W/g).test(username) && username.length > 0 && username.length < 21;
            if (doubleCheck) {
                localSettings["username"] = username;
                WinJS.Navigation.navigate("/pages/game.html", { username: username });
            }
            else {
                var warningDiv = document.querySelector("#usernameForm .warning");
                warningDiv.textContent = "Something went wrong... please try again";
            }
        }
        evt.preventDefault();
        return false;
    }

    var facebookUrl = "https://graph.facebook.com";

    function linkClickEventHandler(evt) {
        evt.preventDefault();
        var link = evt.target;
        WinJS.Navigation.navigate(link.href);
    }

    function logIntoFacebook() {
        var secureWeb = Windows.Security.Authentication.Web;
        var endUri = "ms-app://s-1-15-2-2675179045-997083443-3805322078-311227240-3561484885-1850611153-4201577455"; //secureWeb.WebAuthenticationBroker.getCurrentApplicationCallbackUri().rawUri;
        var requestUri = new Windows.Foundation.Uri(
                                "https://www.facebook.com/dialog/oauth?" +
                                "client_id=857337164293100&" +
                                "display=popup&" +
                                "response_type=token&" + 
                                "redirect_uri=" + endUri);
        
        secureWeb.WebAuthenticationBroker.authenticateAsync(secureWeb.WebAuthenticationOptions.none, requestUri)
        .done(function (result) {
            var responseData = result.responseData.replace("#", "?"); // hack the response data a bit...
            var responseUri = new Windows.Foundation.Uri(responseData);
            var access_token = responseUri.queryParsed[0].value;
            var expires_in = responseUri.queryParsed[1].value;
            getUserInfo(access_token);
        }, 
        function (err) {
            console.log(err);
        });
    }

    function getUserInfo(accessToken) {
        WinJS.xhr({
            type: "GET",
            url: facebookUrl + "/me" + "?access_token=" + accessToken,
            responseType: "json",
        }).done(
            function completed(result) {
                if (result.status === 200) {
                    var user = JSON.parse(result.response);
                    console.log(result.response);
                }
            },
            function error(result) {

            });
    }
})();
