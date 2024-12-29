const vscode = require('vscode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Local file to store user progress
const PROGRESS_FILE = path.join(__dirname, 'progress.json');
const auth = require("./lib/auth");
const user = require("./lib/user");

// Activate the extension
async function activate(context) {
    console.log('Habit Tracker Extension is now active!');

    // Register the command to show the tree progress

    // Register the command to show user progress
    const showProgressCommand = vscode.commands.registerCommand('vsinsights.showProgress', async () => {
        const userId = await auth.getId(context);
        if (!userId) {
            vscode.window.showInformationMessage('Please sign in first.');
            return;
        }
        try {
            vscode.window.showInformationMessage(`Your Progress:`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching progress from the backend.${error}`);
        }
    });

    context.subscriptions.push(showProgressCommand);

    // Monitor file changes and update progress
    vscode.workspace.onDidChangeTextDocument(async (event) => {
        const userId = await auth.getId(context);
        if (!userId) return;

        const progress = loadProgress();

        event.contentChanges.forEach((change) => {
            const { range, text } = change;
            progress.linesCreated += (text.split('\n').length - 1);
            progress.linesDeleted += (range.end.line - range.start.line);
        });

        progress.totalLinesChanged = progress.linesCreated + progress.linesDeleted;
        saveProgress(progress);

        console.log(`Progress updated: ${JSON.stringify(progress)}`);
    });

    // Monitor file creation
    vscode.workspace.onDidCreateFiles(async (event) => {
        const userId = await auth.getId(context);
        if (!userId) return;

        const progress = loadProgress();
        progress.filesCreated += event.files.length;
        saveProgress(progress);
        console.log(`${event.files.length} file(s) created.`);
    });

    // Monitor file deletion
    vscode.workspace.onDidDeleteFiles(async (event) => {
        const userId = await auth.getId(context);
        if (!userId) return;

        const progress = loadProgress();
        progress.filesDeleted += event.files.length;
        saveProgress(progress);
        console.log(`${event.files.length} file(s) deleted.`);
    });

    // Show authentication panel for login
    const paneldisposable = vscode.commands.registerCommand(
        "vsinsights.showAuthPanel",
        async () => {
            const panel = vscode.window.createWebviewPanel(
                "authPanel", // Internal identifier
                "Authentication", // Title
                vscode.ViewColumn.One, // Display in the first column
                { enableScripts: true } // Enable JavaScript
            );

            const userId = await auth.getId(context);
            if (!userId) {
                panel.webview.html = getAuthPage();
            } else {
                const userName = await user.getUserData(userId);
                panel.webview.html = getHomeScreen(userName);
            }

            panel.webview.onDidReceiveMessage(
                async (message) => {
                    switch (message.command) {
                        case "login":
                            await auth.login(context, message.email, message.password);
                            break;
                        case "signup":
                            await auth.signup(context, message.name, message.email, message.password);
                            break;
                        case "logout":
                            await auth.deleteUserId(context);
                            panel.webview.html = getAuthPage();
                            break;
                    }
                },
                undefined,
                context.subscriptions
            );
        }
    );

    context.subscriptions.push(paneldisposable);
}

// Load progress data from the local file
function loadProgress() {
    if (fs.existsSync(PROGRESS_FILE)) {
        try {
            const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error parsing progress.json:', error);
        }
    }

    const defaultProgress = {
        linesCreated: 0,
        linesDeleted: 0,
        totalLinesChanged: 0,
        filesCreated: 0,
        filesDeleted: 0,
    };

    saveProgress(defaultProgress);
    return defaultProgress;
}

// Save progress data to the local file
function saveProgress(progress) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Get the HTML for the Authentication page
function getAuthPage() {
    return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Authentication</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                button, input { padding: 10px; margin: 10px; font-size: 16px; }
                .form-container { display: none; margin-top: 20px; }
                .form-container input { display: block; margin: 5px auto; }
                .form-container button { margin-top: 10px; }
            </style>
        </head>
        <body>
            <h1>VS Insights</h1>
            <p>Choose an action:</p>
            <button id="loginButton">Login</button>
            <button id="signupButton">Signup</button>

            <div id="formContainer" class="form-container">
                <h2 id="formTitle"></h2>
                <form id="authForm">
                    <input type="text" id="nameField" placeholder="Name" style="display: none;" />
                    <input type="email" id="emailField" placeholder="Email" required />
                    <input type="password" id="passwordField" placeholder="Password" required />
                    <button type="submit">Submit</button>
                </form>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                const loginButton = document.getElementById('loginButton');
                const signupButton = document.getElementById('signupButton');
                const formContainer = document.getElementById('formContainer');
                const formTitle = document.getElementById('formTitle');
                const nameField = document.getElementById('nameField');
                const emailField = document.getElementById('emailField');
                const passwordField = document.getElementById('passwordField');
                const authForm = document.getElementById('authForm');

                let currentAction = '';

                loginButton.addEventListener('click', () => {
                    currentAction = 'login';
                    formTitle.textContent = 'Login';
                    nameField.style.display = 'none';
                    emailField.value = '';
                    passwordField.value = '';
                    formContainer.style.display = 'block';
                });

                signupButton.addEventListener('click', () => {
                    currentAction = 'signup';
                    formTitle.textContent = 'Signup';
                    nameField.style.display = 'block';
                    nameField.value = '';
                    emailField.value = '';
                    passwordField.value = '';
                    formContainer.style.display = 'block';
                });

                authForm.addEventListener('submit', (event) => {
                    event.preventDefault();

                    const data = {
                        command: currentAction,
                        email: emailField.value,
                        password: passwordField.value,
                    };

                    if (currentAction === 'signup') {
                        data.name = nameField.value;
                    }

                    vscode.postMessage(data);

                    formContainer.style.display = 'none';
                    nameField.value = '';
                    emailField.value = '';
                    passwordField.value = '';
                });
            </script>
        </body>
        </html>
    `;
}

// Get the HTML for the Home screen after login
function getHomeScreen(name) {
    return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Home Page</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                button { padding: 10px 20px; margin: 10px; font-size: 16px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>VS Insights</h1>
            <p> Welcome ${name}</p>
            <button id="logout">Logout </button>

            <script>
                const vscode = acquireVsCodeApi();

                document.getElementById('logout').addEventListener('click', () => {
                    vscode.postMessage({ command: 'logout' });
                });
            </script>
        </body>
        </html>
    `;
}

// Deactivate the extension
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
