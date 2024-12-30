const axios = require("axios");
const vscode = require("vscode");

exports.sendOtp = async (context, email) => {
  try {

    const result = await axios.post(
      "http://localhost:8000/sendOtp",
      {
        email: email,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("otp send")
    const data = result.data
    return data.otp
    // storing the id
    // await saveUserId(context, data.result);

    // vscode.window.showInformationMessage(data.message);
  } catch (error) {
    vscode.window.showErrorMessage(`Login failed: ${error.message}`);
  }
};

exports.verifyOtp = async (context, otp, userOtp, email) => {
  try {


    if (otp == userOtp){

      console.log("VERIFIED")
    vscode.window.showInformationMessage("VERIFIED");

    const result = await axios.post(
      "http://localhost:8000/login",
      {
        email: email,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = result.data

    // storing the id
    await saveUserId(context, data.result._id);

    vscode.window.showInformationMessage(data.message);

    return "ok"
      
    } else {
      console.log("FAILED")
    vscode.window.showErrorMessage("Incorrect OTP");
    return "notok"


    }
  } catch (error) {
    vscode.window.showErrorMessage(`Login failed: ${error.message}`);
  }
};



// exports.signup = async (context, name, email, password) => {
//   try {

//     // const name = await vscode.window.showInputBox({
//     //   prompt: "Enter display name",
//     //   placeHolder: "Bruno Mars",

//     // });

//     // if (!name) {
//     //   vscode.window.showErrorMessage("name is required.");
//     //   return;
//     // }

//     // const email = await vscode.window.showInputBox({
//     //   prompt: "Enter your email",
//     //   placeHolder: "hardcoder@coolmail.com",
//     //   validateInput: (value) => {
//     //     return value.includes("@")
//     //       ? null
//     //       : "Please enter a valid email address";
//     //   },
//     // });

//     // if (!email) {
//     //   vscode.window.showErrorMessage("Email is required.");
//     //   return;
//     // }

//     // // Prompt for password (inputHidden makes it a password field)
//     // const password = await vscode.window.showInputBox({
//     //   prompt: "Enter your password",
//     //   password: true,
//     // });

//     // if (!password) {
//     //   vscode.window.showErrorMessage("Password is required.");
//     //   return;
//     // }

//     const result = await axios.post(
//       "http://localhost:8000/signup",
//       {
//         email: email,
//         name: name,
//         password: password,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const data = result.data
//     // storing the id
//     await saveUserId(context, data.result._id);

//     console.log(`Account created for Email: ${email}, Password: ${password}`);
//     vscode.window.showInformationMessage(data.message);
//   } catch (error) {
//     vscode.window.showErrorMessage(`registration failed: ${error.message}`);
//   }
// };
exports.getUserId = async (context) => {
  try {
    const userId = await context.secrets.get('userId');
    if (!userId) {

    vscode.window.showErrorMessage("No userid found, login first");
    } else {
      vscode.window.showInformationMessage("UserId: ", userId);
    }
    
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to get User ID: ${error.message}`);
    
  }
};

exports.getId = async (context) => {
  try {
    const userId = await context.secrets.get('userId');
    if (!userId) {

    return null
    } else {
      return userId;
    }
    
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to get User ID: ${error.message}`);
    
  }
};

exports.deleteUserId = async (context) => {
  try {
    
    await context.secrets.delete('userId');
      vscode.window.showInformationMessage('User ID deleted successfully.');
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to delete User ID: ${error.message}`);
  }
};

async function saveUserId(context, userId) {
  await context.secrets.store('userId', userId);
  vscode.window.showInformationMessage("UserId saved securely.");
}

