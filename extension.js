// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const auth = require("./lib/auth");
const vscode = require("vscode");
const user = require("./lib/user");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vsinsights" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json

  // const something = vscode.commands.registerCommand(
  //   "vsinsights.login",
  //   function () {
  //     auth.login(context);
  //   }
  // );

  const something2 = vscode.commands.registerCommand(
    "vsinsights.show",
    function () {
      auth.getUserId(context);
    }
  );

  const something3 = vscode.commands.registerCommand(
    "vsinsights.logout",
    function () {
      auth.deleteUserId(context);
    }
  );

  // const something4 = vscode.commands.registerCommand(
  //   "vsinsights.signup",
  //   function () {
  //     auth.signup(context);
  //   }
  // );

  const disposable = vscode.commands.registerCommand(
    "vsinsights.helloWorld",
    function () {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from vsInsights!");
    }
  );

  const paneldisposable = vscode.commands.registerCommand(
    "vsinsights.showAuthPanel",
    async () => {
      const panel = vscode.window.createWebviewPanel(
        "authPanel", // Internal identifier
        "Authentication", // Title
        vscode.ViewColumn.One, // Display in the first column
        { enableScripts: true } // Enable JavaScript
      );

      // Set the HTML content for the WebView
      const userId = await auth.getId(context);
      if (!userId) {
        panel.webview.html = getAuthPage();
      } else {
        const userName = await user.getUserData(userId);

        panel.webview.html = getHomeScreen(userName);
      }

      // Handle messages from the WebView
      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "login":
              await auth.login(context, message.email, message.password);

              
        

              break;
            case "signup":
              await auth.signup(
                context,
                message.name,
                message.email,
                message.password
              );

              

              break;
            case "logout":
              vscode.commands.executeCommand("vsinsights.logout");
              panel.webview.html = getAuthPage();

              break;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(
    disposable,

    something2,
    something3,

    paneldisposable
  );
}

function getAuthPage() {
  return /*html*/ `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
        text-align: center;
      }
      button, input {
        padding: 10px;
        margin: 10px;
        font-size: 16px;
      }
      .form-container {
        display: none;
        margin-top: 20px;
      }
      .form-container input {
        display: block;
        margin: 5px auto;
      }
      .form-container button {
        margin-top: 10px;
      }
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
  
        // Optionally hide the form and clear inputs
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

function getHomeScreen(name) {
  return /*html*/ `
	  <!DOCTYPE html>
	  <html lang="en">
	  <head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Home Page</title>
		<style>
		  body {
			font-family: Arial, sans-serif;
			padding: 20px;
			text-align: center;
		  }
		  button {
			padding: 10px 20px;
			margin: 10px;
			font-size: 16px;
			cursor: pointer;
		  }
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

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
