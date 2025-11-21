from flask import Flask, request, jsonify, render_template, session
import os
import requests
import json
import uuid
from datetime import datetime
import sqlite3
from functools import wraps

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-this")

OPENROUTER_API_KEY = os.getenv("OPENAI_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Initialize database
def init_db():
    conn = sqlite3.connect('chat_history.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            chat_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chat_sessions (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

def get_session_id():
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    return session['session_id']

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/dashboard')
def dashboard():
    return render_template("dashboard.html")

@app.route('/api/chat/new', methods=['POST'])
def new_chat():
    session_id = get_session_id()
    chat_id = str(uuid.uuid4())
    
    conn = sqlite3.connect('chat_history.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO chat_sessions (id, session_id, title, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (chat_id, session_id, "New Chat", datetime.now(), datetime.now()))
    
    conn.commit()
    conn.close()
    
    return jsonify({"chat_id": chat_id, "success": True})

@app.route('/api/chat/history')
def get_chat_history():
    session_id = get_session_id()
    
    conn = sqlite3.connect('chat_history.db')
    cursor = conn.cursor()
    
    # Get all chats for this session
    cursor.execute('''
        SELECT id, title, created_at, updated_at
        FROM chat_sessions 
        WHERE session_id = ? 
        ORDER BY updated_at DESC
    ''', (session_id,))
    
    chats = []
    for row in cursor.fetchall():
        chat_id, title, created_at, updated_at = row
        
        # Get message count for this chat
        cursor.execute('SELECT COUNT(*) FROM chat_messages WHERE chat_id = ?', (chat_id,))
        message_count = cursor.fetchone()[0]
        
        chats.append({
            "id": chat_id,
            "title": title,
            "created_at": created_at,
            "updated_at": updated_at,
            "message_count": message_count
        })
    
    conn.close()
    return jsonify({"chats": chats})

@app.route('/api/chat/<chat_id>/messages')
def get_chat_messages(chat_id):
    session_id = get_session_id()
    
    conn = sqlite3.connect('chat_history.db')
    cursor = conn.cursor()
    
    # Verify chat belongs to this session
    cursor.execute('SELECT id FROM chat_sessions WHERE id = ? AND session_id = ?', (chat_id, session_id))
    if not cursor.fetchone():
        return jsonify({"error": "Chat not found"}), 404
    
    # Get messages
    cursor.execute('''
        SELECT role, content, timestamp 
        FROM chat_messages 
        WHERE chat_id = ? 
        ORDER BY timestamp ASC
    ''', (chat_id,))
    
    messages = []
    for row in cursor.fetchall():
        role, content, timestamp = row
        messages.append({
            "role": role,
            "content": content,
            "timestamp": timestamp
        })
    
    conn.close()
    return jsonify({"messages": messages})

@app.route('/api/chat/<chat_id>', methods=['POST'])
def chat_with_bot(chat_id):
    session_id = get_session_id()
    user_input = request.json.get("message")
    
    if not user_input:
        return jsonify({"error": "No message provided"}), 400

    conn = sqlite3.connect('chat_history.db')
    cursor = conn.cursor()
    
    # Verify chat belongs to this session
    cursor.execute('SELECT id FROM chat_sessions WHERE id = ? AND session_id = ?', (chat_id, session_id))
    if not cursor.fetchone():
        return jsonify({"error": "Chat not found"}), 404
    
    # Save user message
    cursor.execute('''
        INSERT INTO chat_messages (session_id, chat_id, role, content, timestamp)
        VALUES (?, ?, ?, ?, ?)
    ''', (session_id, chat_id, "user", user_input, datetime.now()))
    
    # Get chat context (last 10 messages)
    cursor.execute('''
        SELECT role, content 
        FROM chat_messages 
        WHERE chat_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 10
    ''', (chat_id,))
    
    messages = []
    for row in reversed(cursor.fetchall()):
        role, content = row
        messages.append({"role": role, "content": content})
    
    # Add current message
    messages.append({"role": "user", "content": user_input})

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": messages,
        "max_tokens": 1000,
        "temperature": 0.7
    }

    try:
        res = requests.post(OPENROUTER_URL, headers=headers, json=data, timeout=30)
        result = res.json()

        if res.status_code == 200:
            bot_response = result['choices'][0]['message']['content']
            
            # Save bot response
            cursor.execute('''
                INSERT INTO chat_messages (session_id, chat_id, role, content, timestamp)
                VALUES (?, ?, ?, ?, ?)
            ''', (session_id, chat_id, "assistant", bot_response, datetime.now()))
            
            # Update chat title if it's the first user message
            cursor.execute('SELECT COUNT(*) FROM chat_messages WHERE chat_id = ? AND role = "user"', (chat_id,))
            user_message_count = cursor.fetchone()[0]
            
            if user_message_count == 1:
                # Generate title from first message (first 50 chars)
                title = user_input[:50] + "..." if len(user_input) > 50 else user_input
                cursor.execute('''
                    UPDATE chat_sessions 
                    SET title = ?, updated_at = ? 
                    WHERE id = ?
                ''', (title, datetime.now(), chat_id))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                "response": bot_response,
                "timestamp": datetime.now().isoformat()
            })
        else:
            conn.close()
            return jsonify({"error": result.get("error", "Error from OpenRouter")}), 500
            
    except requests.exceptions.Timeout:
        conn.close()
        return jsonify({"error": "Request timeout. Please try again."}), 408
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/<chat_id>', methods=['DELETE'])
def delete_chat(chat_id):
    session_id = get_session_id()
    
    conn = sqlite3.connect('chat_history.db')
    cursor = conn.cursor()
    
    # Verify chat belongs to this session
    cursor.execute('SELECT id FROM chat_sessions WHERE id = ? AND session_id = ?', (chat_id, session_id))
    if not cursor.fetchone():
        return jsonify({"error": "Chat not found"}), 404
    
    # Delete messages and chat
    cursor.execute('DELETE FROM chat_messages WHERE chat_id = ?', (chat_id,))
    cursor.execute('DELETE FROM chat_sessions WHERE id = ?', (chat_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True})

@app.route('/api/chat/clear-all', methods=['POST'])
def clear_all_chats():
    session_id = get_session_id()
    
    conn = sqlite3.connect('chat_history.db')
    cursor = conn.cursor()
    
    # Get all chat IDs for this session
    cursor.execute('SELECT id FROM chat_sessions WHERE session_id = ?', (session_id,))
    chat_ids = [row[0] for row in cursor.fetchall()]
    
    # Delete all messages and chats for this session
    for chat_id in chat_ids:
        cursor.execute('DELETE FROM chat_messages WHERE chat_id = ?', (chat_id,))
    
    cursor.execute('DELETE FROM chat_sessions WHERE session_id = ?', (session_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True})

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))