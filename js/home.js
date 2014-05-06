(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/home.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            // TODO: Initialize the page here.
            WinJS.Utilities.query("a").listen("click", linkClickEventHandler, false);
            WinJS.Utilities.query("#facebookLoginBtn").listen("click", logIntoFacebook, false);
        }
    });

    var facebookUrl = "https://graph.facebook.com";

    function linkClickEventHandler(eventInfo) {
        eventInfo.preventDefault();
        var link = eventInfo.target;
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
