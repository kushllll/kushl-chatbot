# from flask import Flask, request, jsonify, render_template
# import os
# import requests

# app = Flask(__name__)

# OPENROUTER_API_KEY = os.getenv("OPENAI_API_KEY")
# OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# @app.route('/')
# def home():
#     return render_template("index.html")

# @app.route('/chat', methods=['POST'])
# def chat():
#     user_input = request.json.get("message")

#     headers = {
#         "Authorization": f"Bearer {OPENROUTER_API_KEY}",
#         "Content-Type": "application/json"
#     }

#     data = {
#         "model": "mistralai/mistral-7b-instruct",
#         "messages": [
#             {"role": "user", "content": user_input}
#         ]
#     }

#     try:
#         res = requests.post(OPENROUTER_URL, headers=headers, json=data)
#         result = res.json()

#         if res.status_code == 200:
#             return jsonify({"response": result['choices'][0]['message']['content']})
#         else:
#             return jsonify({"error": result.get("error", "Error from OpenRouter")})
#     except Exception as e:
#         return jsonify({"error": str(e)})

# if __name__ == "__main__":
#    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))

from flask import Flask, render_template, request, jsonify, session
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)

@app.route('/')
def home():
    session['history'] = []  # Initialize chat history
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json['message']
    
    # Add your chatbot logic here (replace with actual model integration)
    response = f"Echo: {user_input}"  
    
    # Update session history
    history = session.get('history', [])
    history.append({'user': user_input, 'bot': response})
    session['history'] = history
    
    return jsonify({'response': response})

@app.route('/clear', methods=['POST'])
def clear_history():
    session['history'] = []
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)