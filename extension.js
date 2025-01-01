const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const PROGRESS_FILE = path.join(__dirname, "progress.json");
const auth = require("./lib/auth");
const user = require("./lib/user");

let otp = null;

async function activate(context) {
  console.log("coderhabit Extension is now active!");

  // //show progress command
  // const showProgressCommand = vscode.commands.registerCommand(
  //   "coderhabit.showProgress",
  //   async () => {
  //     const userId = await auth.getId(context);
  //     if (!userId) {
  //       vscode.window.showInformationMessage("Please sign in first.");
  //       return;
  //     }
  //     try {
  //       vscode.window.showInformationMessage(`Your Progress:`);
  //     } catch (error) {
  //       vscode.window.showErrorMessage(
  //         `Error fetching progress from the backend.${error}`
  //       );
  //     }
  //   }
  // );

  // context.subscriptions.push(showProgressCommand);

  vscode.workspace.onDidChangeTextDocument(async (event) => {
    const userId = await auth.getId(context);
    if (!userId) return;

    const progress = loadProgress();
    const today = getTodayDate();

    if (!progress[userId]) progress[userId] = { progress: {} };
    if (!progress[userId].progress[today]) {
      progress[userId].progress[today] = createDefaultProgress();
    }

    const dayProgress = progress[userId].progress[today];

    event.contentChanges.forEach((change) => {
      const { range, text } = change;
      dayProgress.linesCreated += text.split("\n").length - 1;
      dayProgress.linesDeleted += range.end.line - range.start.line;
    });

    dayProgress.totalLinesChanged =
      dayProgress.linesCreated + dayProgress.linesDeleted;
    saveProgress(progress);
    console.log(`Progress updated: ${JSON.stringify(dayProgress)}`);
  });

  vscode.workspace.onDidCreateFiles(async (event) => {
    const userId = await auth.getId(context);
    if (!userId) return;

    const progress = loadProgress();
    const today = getTodayDate();

    if (!progress[userId].progress[today]) {
      progress[userId].progress[today] = createDefaultProgress();
    }

    progress[userId].progress[today].filesCreated += event.files.length;
    saveProgress(progress);
    console.log(`${event.files.length} file(s) created.`);
  });

  vscode.workspace.onDidDeleteFiles(async (event) => {
    const userId = await auth.getId(context);
    if (!userId) return;

    const progress = loadProgress();
    const today = getTodayDate();

    if (!progress[userId].progress[today]) {
      progress[userId].progress[today] = createDefaultProgress();
    }

    progress[userId].progress[today].filesDeleted += event.files.length;
    saveProgress(progress);
    console.log(`${event.files.length} file(s) deleted.`);
  });


// hitting mongodb to save the progress
  setInterval(async () => {
    const userId = await auth.getId(context);
    if (!userId) return;

    const progress = loadProgress();
    // console.log(progress)
    try {
      const date = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

      const response = await axios.post(
        "http://localhost:8000/sendProgress",
        {
          userId,
          progress: progress[userId]?.progress[date] || {},
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.progress != null) {
        console.log("Progress sent to server.");

        const result = await resetProgress(context);
        console.log("Progress Reset Status: ", result)
      }
    } catch (error) {
      console.error("Error sending progress to server:", error);
    }
  }, 10000);

  // Start Command here
  const paneldisposable = vscode.commands.registerCommand(
    "coderhabit.activateCodeIQ",
    async () => {
      const panel = vscode.window.createWebviewPanel(
        "authPanel",
        "Authentication",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      const userId = await auth.getId(context);
      if (!userId) {
        panel.webview.html = getAuthPage();
      } else {
        const userEmail = await user.getUserData(userId);
        panel.webview.html = getHomeScreen(userEmail);
      }

      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "sendOtp":
              otp = await auth.sendOtp(context, message.email);
              console.log(otp);
              break;
            case "verifyOtp":
              const data = await auth.verifyOtp(
                context,
                otp,
                message.userOtp,
                message.email
              );

              data === "ok"
                ? (panel.webview.html = getHomeScreen(message.email))
                : (panel.webview.html = getAuthPage());
              break;
            case "openWebPage":
              const url = vscode.Uri.parse(message.url);
              vscode.env.openExternal(url);
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

// misc functions here 
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    } catch (error) {
      console.error("Error parsing progress.json:", error);
    }
  }
  return {};
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function createDefaultProgress() {
  return {
    linesCreated: 0,
    linesDeleted: 0,
    totalLinesChanged: 0,
    filesCreated: 0,
    filesDeleted: 0,
  };
}

async function resetProgress(context){
  const userId = await auth.getId(context);
    if (!userId) return null;

    const progress = loadProgress();
    const today = getTodayDate();

  
    progress[userId].progress[today] = createDefaultProgress();
    

    
    saveProgress(progress);
    return "done"

}

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split("T")[0];
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
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #1e1e1e;
            color: #ffffff;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        h2 {
            color: #61dafb;
            margin-bottom: 20px;
        }
        .form-container {
            background: #2d2d2d;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
            width: 100%;
            max-width: 400px;
        }
        button, input {
            width: 90%;
            padding: 15px;
            margin-top: 10px;
            border: 1px solid #444;
            border-radius: 5px;
            font-size: 16px;
            background-color: #3c3c3c;
            color: #ffffff;
        }
        button {
            background-color: #61dafb;
            color: #000;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        button:hover {
            background-color: #21a1f1;
        }
        input {
            background-color: #3c3c3c;
            color: #fff;
        }
        input:focus {
            outline: none;
            border-color: #61dafb;
        }
        .otp-input-container {
            display: flex;
            justify-content: space-between;
            gap: 10px;
        }
        .otp-input-container input {
            width: 40px;
            text-align: center;
            padding: 10px;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div id="formContainer" class="form-container">
        <h2 id="formTitle">Authentication</h2>
        <form id="authForm">
            <input type="email" id="emailField" placeholder="Email" required />
            <button type="submit">Send OTP</button>
        </form>

        <form id="otpForm" style="display: none;">
            <h2>Enter OTP</h2>
            <div class="otp-input-container">
                <input type="text" maxlength="1" class="otp-field" required />
                <input type="text" maxlength="1" class="otp-field" required />
                <input type="text" maxlength="1" class="otp-field" required />
                <input type="text" maxlength="1" class="otp-field" required />
                <input type="text" maxlength="1" class="otp-field" required />
                <input type="text" maxlength="1" class="otp-field" required />
            </div>
            <button type="submit">Verify OTP</button>
        </form>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        const authForm = document.getElementById('authForm');
        const otpForm = document.getElementById('otpForm');
        const emailField = document.getElementById('emailField');
        const otpFields = document.querySelectorAll('.otp-field');

        authForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const data = {
                command: 'sendOtp',
                email: emailField.value,
            };
            vscode.postMessage(data);

            authForm.style.display = 'none';
            otpForm.style.display = 'block';
            otpFields[0].focus();
        });

        otpForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const otpValue = Array.from(otpFields).map(field => field.value).join('');

            const otpData = {
                command: 'verifyOtp',
                userOtp: otpValue,
                email: emailField.value,
            };
            vscode.postMessage(otpData);
        });

        otpFields.forEach((field, index) => {
            field.addEventListener('input', (event) => {
                if (event.target.value.length === 1 && index < otpFields.length - 1) {
                    otpFields[index + 1].focus();
                }
            });

            field.addEventListener('keydown', (event) => {
                if (event.key === 'Backspace' && index > 0 && !event.target.value) {
                    otpFields[index - 1].focus();
                }
            });
        });
    </script>
</body>
</html>`;
}

// Get the HTML for the Home screen after login
function getHomeScreen(email) {
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
                margin: 0;
                padding: 0;
                background-color: #1e1e1e;
                color: #ffffff;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            h1 {
                color: #61dafb;
                margin-bottom: 10px;
            }
            p {
                font-size: 18px;
                margin-bottom: 30px;
            }
            button {
              margin: 10px;
                padding: 15px 30px;
                font-size: 16px;
                color: #000;
                background-color: #61dafb;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
            button:hover {
                background-color: #21a1f1;
            }
        </style>
    </head>
    <body>
        <h1>Coder Habit</h1>
        <p>Welcome, ${email}</p>
        <button id="openWebPage">View Stats</button>

        <button id="logout">Logout</button>
    
        <script>
            const vscode = acquireVsCodeApi();
    
            document.getElementById('logout').addEventListener('click', () => {
                vscode.postMessage({ command: 'logout' });
            });

            document.getElementById('openWebPage').addEventListener('click', () => {
                vscode.postMessage({ command: 'openWebPage', url: "http://localhost:3000" });
            });
        </script>
    </body>
    </html>`;
}

// Deactivate the extension
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
