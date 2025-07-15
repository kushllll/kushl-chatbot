from flask import Flask, request, jsonify, render_template
import os
import requests

app = Flask(__name__)

OPENROUTER_API_KEY = os.getenv("OPENAI_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get("message")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": [
            {"role": "user", "content": user_input}
        ]
    }

    try:
        res = requests.post(OPENROUTER_URL, headers=headers, json=data)
        result = res.json()

        if res.status_code == 200:
            return jsonify({"response": result['choices'][0]['message']['content']})
        else:
            return jsonify({"error": result.get("error", "Error from OpenRouter")})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
   app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))

