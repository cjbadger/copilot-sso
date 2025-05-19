console.log("Hello, World!");

var clientApplication;
    (function () {
    var msalConfig = {
        auth: {
            clientId: '<Client ID [CanvasClientId]>',
            authority: 'https://login.microsoftonline.com/<Directory ID>'
        },
        cache: {
            cacheLocation: 'localStorage',
            storeAuthStateInCookie: false
        }
    };
    if (!clientApplication) {
        clientApplication = new Msal.UserAgentApplication(msalConfig);
    }
    } ());