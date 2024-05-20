import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AIzaSyACqWDyX1U4_WPJl0KM08_r69XEdNMRuwY');

export function activate(context: vscode.ExtensionContext) {
	// for opening the chat view
	context.subscriptions.push(
		vscode.commands.registerCommand('chat-ai.startChat', () => {
			const panel = vscode.window.createWebviewPanel(
				'chatView', // My type for the webview
				'Chat AI',  // Title
				vscode.ViewColumn.One, // For panel show view 
				{ enableScripts: true }
			);

			panel.webview.html = getWebviewContent();

			panel.webview.onDidReceiveMessage(
				async message => {
					if (message.command === 'sendMessage') {
						console.log('Message received from webview:', message.text);
						try {
							const aiResponse = await getAIResponse(message.text);
							console.log('AI response:', aiResponse);
							panel.webview.postMessage({ command: 'receiveMessage', text: aiResponse });
						} catch (error) {
							console.error('Failed to get AI response:', error);
						}
					}
				},
				undefined,
				context.subscriptions
			);
		})
	);
}

// Function to get AI response from Google AI
async function getAIResponse(prompt: string): Promise<string> {
	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
		const result = await model.generateContent(prompt);
		const response = await result.response;
		const text = response.text();
		console.log('Generated text:', text);
		return text;
	} catch (error) {
		console.error('Error generating AI response:', error);
		return 'Error generating AI response.';
	}
}

// this function returns the actual web view that how my extension will look like
function getWebviewContent() {
	return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chat AI</title>
	  <style>
	  body {
		font-family: Arial, sans-serif;
		padding: 20px;
		background-color: black;
	  }
	  .heading{
		color:white; 
		font-weight: bold;
		font-size:20px;
		border-radius:16px;
		background: radial-gradient(circle, rgba(247, 150, 192, 1) 0%, rgba(118, 174, 241, 1) 100%);
		padding:7px;
		width:fit-content;
	  }
	  .userheading{
		color:white; 
		font-weight: bold;
		font-size:20px;
		border-radius:16px;
		background: radial-gradient(circle, rgba(247, 150, 192, 1) 0%, rgba(118, 174, 241, 1) 100%);
		padding:7px;
	  }
	  .aiheading{
		color:white; 
		font-weight: bold;
		font-size:20px;
		border-radius:16px;
		margin-top:10px;
		background: radial-gradient(circle, rgba(247, 150, 192, 1) 0%, rgba(118, 174, 241, 1) 100%);
		padding:7px;
		
	  }
	  #chat-container {
		display: flex;
		flex-direction: column;
		height: 80vh;
		
	  }
	  #chat-output {
		flex: 1;
		padding: 10px;
		border: 1px solid #ccc;
		background-color: #FEC400;
		color:black;
		overflow-y: auto;
		margin-bottom: 10px;
		font-size:16px;
		border-radius:16px;
	  }
	  #user-input {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
		margin-bottom: 10px;
	  }
	  button {
		padding: 10px 20px;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		background: radial-gradient(circle, rgba(247, 150, 192, 1) 0%, rgba(118, 174, 241, 1) 100%);
	  }

	</style>
    </head>
    <body>
      <h1 class="heading">Chat with AI</h1>
      <div id="chat-container">
        <div id="chat-output"></div>
        <input type="text" id="user-input" placeholder="Type a message..." />
        <button onclick="sendMessage()">Send</button>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        const chatOutput = document.getElementById('chat-output');
        const userInput = document.getElementById('user-input');

        function sendMessage() {
          const userMessage = userInput.value;
          if (userMessage.trim()) {
            chatOutput.innerHTML += '<div style="margin-top:20px;"><span class="userheading">User:</span> ' + userMessage + '</div>';
            userInput.value = '';

            // Send message to the extension
            vscode.postMessage({
              command: 'sendMessage',
              text: userMessage
            });
          }
        }

        window.addEventListener('message', event => {
          const message = event.data;
          switch (message.command) {
            case 'receiveMessage':
              chatOutput.innerHTML += '<div style="margin-top:20px;"><span class="aiheading">AI:</span> ' + message.text + '</div>';
              break;
          }
        });
      </script>
    </body>
    </html>
  `;
}

// This method is called when your extension is deactivated
export function deactivate() { }
