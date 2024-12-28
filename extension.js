// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const charizard = require("./calls/charizard");
const vscode = require("vscode");

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

  const something = vscode.commands.registerCommand(
    "vsinsights.login",
    function () {
      charizard.login(context);
    }
  );

  const something2 = vscode.commands.registerCommand(
    "vsinsights.show",
    function () {
      charizard.getUserId(context);
    }
  );

  const something3 = vscode.commands.registerCommand(
    "vsinsights.logout",
    function () {
      charizard.deleteUserId(context);
    }
  );

  const something4 = vscode.commands.registerCommand(
    "vsinsights.signup",
    function () {
      charizard.signup(context);
    }
  );

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
	  const userId = await charizard.getId(context)
	  if (!userId) {
		  panel.webview.html = getAuthPage();
		  
	} else {
		panel.webview.html = getHomeScreen();
		
	  }
	  

      // Handle messages from the WebView
      panel.webview.onDidReceiveMessage(
        (message) => {
          switch (message.command) {
            case "login":
              vscode.commands.executeCommand("vsinsights.login");
              break;
            case "signup":
              vscode.commands.executeCommand("vsinsights.signup");
              break;
            case "logout":
              vscode.commands.executeCommand("vsinsights.logout");
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
    something,
    something2,
    something3,
    something4,
    paneldisposable
  );
}

function getAuthPage() {
  return `
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
		<p>Choose an action:</p>
		<button id="login">Login</button>
		<button id="signup">Signup</button>
  
		<script>
		  const vscode = acquireVsCodeApi();
  
		  document.getElementById('login').addEventListener('click', () => {
			vscode.postMessage({ command: 'login' });
		  });
  
		  document.getElementById('signup').addEventListener('click', () => {
			vscode.postMessage({ command: 'signup' });
		  });
		</script>
	  </body>
	  </html>
	`;
}

function getHomeScreen() {
  return `
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
		<p> Welcome User</p>

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
