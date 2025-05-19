console.log("Hello, World!");

<<<<<<< HEAD
// var clientApplication;
//     (function () {
//     var msalConfig = {
//         auth: {
//             clientId: '<Client ID [CanvasClientId]>',
//             authority: 'https://login.microsoftonline.com/<Directory ID>'
//         },
//         cache: {
//             cacheLocation: 'localStorage',
//             storeAuthStateInCookie: false
//         }
//     };
//     if (!clientApplication) {
//         clientApplication = new Msal.UserAgentApplication(msalConfig);
//     }
//     } ());
=======
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
>>>>>>> 7888e0f01cd716935e7fba83bf8936dc3bf3eb51
