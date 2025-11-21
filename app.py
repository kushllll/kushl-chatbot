from flask import Flask, request, jsonify, render_template, session
import os
import requests
import json
import uuid
from datetime import datetime
import sqlite3

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-this")

OPENROUTER_API_KEY = os.getenv("OPENAI_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Initialize database with better error handling
def init_db():
    try:
        # Use absolute path for database
        db_path = os.path.join(os.getcwd(), 'chat_history.db')
        conn = sqlite3.connect(db_path)
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
        print("Database initialized successfully!")
    except Exception as e:
        print(f"Database initialization error: {e}")

# Database connection helper
def get_db_connection():
    try:
        db_path = os.path.join(os.getcwd(), 'chat_history.db')
        conn = sqlite3.connect(db_path)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

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
    try:
        session_id = get_session_id()
        chat_id = str(uuid.uuid4())
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO chat_sessions (id, session_id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (chat_id, session_id, "New Chat", datetime.now(), datetime.now()))
        
        conn.commit()
        conn.close()
        
        print(f"New chat created: {chat_id}")
        return jsonify({"chat_id": chat_id, "success": True})
    except Exception as e:
        print(f"Error creating new chat: {e}")
        return jsonify({"error": "Failed to create new chat"}), 500

@app.route('/api/chat/history')
def get_chat_history():
    try:
        session_id = get_session_id()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, created_at, updated_at
            FROM chat_sessions 
            WHERE session_id = ? 
            ORDER BY updated_at DESC
        ''', (session_id,))
        
        chats = []
        for row in cursor.fetchall():
            chat_id, title, created_at, updated_at = row
            
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
    except Exception as e:
        print(f"Error loading chat history: {e}")
        return jsonify({"error": "Failed to load chat history"}), 500

@app.route('/api/chat/<chat_id>/messages')
def get_chat_messages(chat_id):
    try:
        session_id = get_session_id()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM chat_sessions WHERE id = ? AND session_id = ?', (chat_id, session_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Chat not found"}), 404
        
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
    except Exception as e:
        print(f"Error loading messages: {e}")
        return jsonify({"error": "Failed to load messages"}), 500

@app.route('/api/chat/<chat_id>', methods=['POST'])
def chat_with_bot(chat_id):
    try:
        session_id = get_session_id()
        user_input = request.json.get("message")
        
        if not user_input:
            return jsonify({"error": "No message provided"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM chat_sessions WHERE id = ? AND session_id = ?', (chat_id, session_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Chat not found"}), 404
        
        cursor.execute('''
            INSERT INTO chat_messages (session_id, chat_id, role, content, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ''', (session_id, chat_id, "user", user_input, datetime.now()))
        
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
        
        messages.append({"role": "user", "content": user_input})

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "openai/gpt-3.5-turbo-0613",
            "messages": messages,
            "max_tokens": 2000,
            "temperature": 0.7
        }

        res = requests.post(OPENROUTER_URL, headers=headers, json=data, timeout=30)
        result = res.json()

        if res.status_code == 200:
            bot_response = result['choices'][0]['message']['content']
            
            cursor.execute('''
                INSERT INTO chat_messages (session_id, chat_id, role, content, timestamp)
                VALUES (?, ?, ?, ?, ?)
            ''', (session_id, chat_id, "assistant", bot_response, datetime.now()))
            
            cursor.execute('SELECT COUNT(*) FROM chat_messages WHERE chat_id = ? AND role = "user"', (chat_id,))
            user_message_count = cursor.fetchone()[0]
            
            if user_message_count == 1:
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
        if 'conn' in locals():
            conn.close()
        return jsonify({"error": "Request timeout. Please try again."}), 408
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        print(f"Error in chat: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/<chat_id>', methods=['DELETE'])
def delete_chat(chat_id):
    try:
        session_id = get_session_id()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM chat_sessions WHERE id = ? AND session_id = ?', (chat_id, session_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Chat not found"}), 404
        
        cursor.execute('DELETE FROM chat_messages WHERE chat_id = ?', (chat_id,))
        cursor.execute('DELETE FROM chat_sessions WHERE id = ?', (chat_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True})
    except Exception as e:
        print(f"Error deleting chat: {e}")
        return jsonify({"error": "Failed to delete chat"}), 500

@app.route('/api/chat/clear-all', methods=['POST'])
def clear_all_chats():
    try:
        session_id = get_session_id()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM chat_sessions WHERE session_id = ?', (session_id,))
        chat_ids = [row[0] for row in cursor.fetchall()]
        
        for chat_id in chat_ids:
            cursor.execute('DELETE FROM chat_messages WHERE chat_id = ?', (chat_id,))
        
        cursor.execute('DELETE FROM chat_sessions WHERE session_id = ?', (session_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({"success": True})
    except Exception as e:
        print(f"Error clearing chats: {e}")
        return jsonify({"error": "Failed to clear chats"}), 500

@app.route('/api/health')
def health_check():
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "ai_provider": "openrouter",
        "model": "gpt-3.5-turbo-0613"
    })

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))