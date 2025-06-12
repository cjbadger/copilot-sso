// TODO Change parameters below to your client id, tenant id and token endpoint.
// See documentation (https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-sso?tabs=webApp)
const clientId = "1782a179-175a-488d-8322-18b98a44a62f"
const tenantId = "6ee5cfa4-cfa8-431a-8424-408985da0f14"
const tokenEndpoint = "https://55edcfa8aa5ae3dfb6944172f25c5f.c2.environment.api.powerplatform.com/powervirtualagents/botsbyschema/cr81e_ssoWithEntraId/directline/token?api-version=2022-03-01-preview" // you can find the token URL via the Mobile app channel configuration

// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: clientId,
        authority: "https://login.microsoftonline.com/" + tenantId
    },
    cache: {
        cacheLocation: "localStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to 'true' if you are having issues on IE11 or Edge
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["User.Read", "openid", "profile"]
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

// Show popup blocked message
function showPopupBlockedMessage() {
    const loginStatus = document.getElementById("login-status");
    const loginStatusMessage = document.getElementById("login-status__message");
    const loginStatusSignIn = document.getElementById("login-status__sign-in");
    loginStatusMessage.innerHTML = "Pop-up blocked. Allow pop-ups for this website, or log in.";
    loginStatus.style.display = "inline";
    loginStatusMessage.style.display = "inline";
    loginStatusSignIn.style.display = "inline";
}

const hideSignInElements = () => {
    const loginStatus = document.getElementById("login-status");
    const loginStatusMessage = document.getElementById("login-status__message");
    const loginStatusSignIn = document.getElementById("login-status__sign-in");
    loginStatus.style.display = "none";
    loginStatusMessage.style.display = "none";
    loginStatusSignIn.style.display = "none";
}

// Handle login request
async function signInUser() {
    try {
        console.log("Login popup...")
        const loginResponse = await msalInstance.loginPopup(loginRequest);
    } catch (err) {
        console.log(err);
        if (err.name === "BrowserAuthError" && 
            (err.errorMessage.includes("popup_window_error") || 
             err.errorMessage.includes("empty_window_error"))) {
                console.log("POP-UP BLOCKED!")
                showPopupBlockedMessage();
            // Show login elements if popup was blocked
            return;
        }
    }

    const accounts = msalInstance.getAllAccounts();

    if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
        user = accounts[0]
        document.getElementById("login-status__message").innerHTML = "Logged in as " + user.name + ".";
        document.getElementById("login-status__message").style.display = "inline";

        // Hide login button and show logout button
        document.getElementById("login-status__sign-in").style.display = "none"
        document.getElementById("login-status__sign-out").style.display = "inline"

        // Render chat widget again to demonstrate that login credentials can be passed
        await renderChatWidget()
    }
}

// Retrieve if user is currently logged in
let user = null;

// Wait for DOM to be fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', async () => {

    // Add event listener for login button
    document.getElementById("login-status__sign-in").addEventListener("click", () => {
        signInUser();
    });

    // Add event listener for logout button
    document.getElementById("login-status__sign-out").addEventListener("click", () => {
        signOutUser();
    });


    const accounts = msalInstance.getAllAccounts();

    if (accounts.length > 0) {
        user = accounts[0]
        msalInstance.setActiveAccount(user);
        document.getElementById("login-status__message").innerHTML = "Currently logged in as " + user.name + "."
        document.getElementById("login-status__message").style.display = "inline";

        // Hide login button and show logout button
        document.getElementById("login-status__sign-in").style.display = "none"
        document.getElementById("login-status__sign-out").style.display = "inline"

        // Render chat widget for already logged in user
        await renderChatWidget()
    } else {
        // If no account is found, automatically trigger login
        await signInUser();
    }
});

// Handle sign out request and refresh page
async function signOutUser() {
    result = await msalInstance.logoutPopup({
        account: user,
    })
    location.reload();
}

/**
 * Retrieve tokenExchangeResource from OAuth card provided by the bot 
 * This tokenExchangeResource will later be used to request an accessToken with the right scope.
 */
function getOAuthCardResourceUri(activity) {
    if (activity &&
        activity.attachments &&
        activity.attachments[0] &&
        activity.attachments[0].contentType === 'application/vnd.microsoft.card.oauth' &&
        activity.attachments[0].content.tokenExchangeResource) {

        // asking for token exchange with AAD
        return activity.attachments[0].content.tokenExchangeResource.uri;
    }
}

/**
 * Retrieve a new access token from the user for the PVA scope based on the tokenExchangeResource
 */
async function exchangeTokenAsync(resourceUri) {
    let user = msalInstance.getAllAccounts();

    if (user.length <= 0) {
        return null
    }

    const tokenRequest = {
        scopes: [resourceUri]
    };

    try {
        const tokenResponse = await msalInstance.acquireTokenSilent(tokenRequest)
        return tokenResponse.accessToken;
    } catch (err) {
        console.log(err)
        return null
    }

    return null
}

/**
 * Helper function to fetch a JSON API
 */
async function fetchJSON(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            accept: 'application/json'
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch JSON due to ${res.status}`);
    }

    return await res.json();
}

async function renderChatWidget() {
    var userID = user?.localAccountId != null ?
        (user.localAccountId).substr(0, 36) :
        (Math.random().toString() + Date.now().toString()).substr(0, 64);

    const { token } = await fetchJSON(tokenEndpoint);
    const directLine = window.WebChat.createDirectLine({ token });

    const store = WebChat.createStore(
        {},
        ({ dispatch }) => next => action => {
            const { type } = action;

            // Configure your bot to start the conversation automatically
            // See https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-bot-greeting?tabs=web
            if (action.type === "DIRECT_LINE/CONNECT_FULFILLED") {
                dispatch({
                    meta: {
                        method: "keyboard",
                    },
                    payload: {
                        activity: {
                            channelData: {
                                postBack: true,
                            },
                            // Web Chat will show the 'Greeting' System Topic message which has a trigger-phrase 'hello'
                            name: 'startConversation',
                            type: "event"
                        },
                    },
                    type: "DIRECT_LINE/POST_ACTIVITY",
                });
            }

            // Filter incoming activities from Direct Line to intercept the Login Card
            // If we are logged in and have a valid auth token, we will directly pass this in the background to the bot.
            if (action.type === 'DIRECT_LINE/INCOMING_ACTIVITY') {
                const activity = action.payload.activity;
                let resourceUri;

                if (activity.from && activity.from.role === 'bot' && (resourceUri = getOAuthCardResourceUri(activity))) {
                    exchangeTokenAsync(resourceUri).then((token) => {
                        if (token) {
                            directLine.postActivity({
                                type: 'invoke',
                                name: 'signin/tokenExchange',
                                value: {
                                    id: activity.attachments[0].content.tokenExchangeResource.id,
                                    connectionName: activity.attachments[0].content.connectionName,
                                    token
                                },
                                "from": {
                                    id: userID,
                                    name: user.name,
                                    role: "user"
                                }
                            }).subscribe(
                                id => {
                                    if (id === 'retry') {
                                        // Bot was not able to handle the invoke, so display the oauthCard
                                        return next(action);
                                    }
                                    // Tokenexchange successful and we do not display the oauthCard
                                },
                                error => {
                                    // An error occurred to display the oauthCard
                                    return next(action);
                                }
                            );
                            return;
                        }
                        else {
                            return next(action);
                        }
                    });
                }
                else {
                    return next(action);
                }
            }
            else {
                return next(action);
            }
        });

        const avatarOptions = {
            botAvatarInitials: 'CB',
            userAvatarInitials: 'US'
        }

    const styleOptions = {
        // Add styleOptions to customize Web Chat canvas
        hideUploadButton: true,
        avatarOptions: avatarOptions,
        suggestedActionLayout: 'stacked'

    };

    window.WebChat.renderWebChat(
        {
            directLine: directLine,
            store,
            userID: userID,
            styleOptions
        },
        document.getElementById('webchat')
    );
}