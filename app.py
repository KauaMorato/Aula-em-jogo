from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app) 

DB_NAME = "jogo_python.db"

# Função que cria a tabela no Banco de Dados automaticamente
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            fase INTEGER DEFAULT 1
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Rota para CADASTRAR novo usuário
@app.route('/api/cadastrar', methods=['POST'])
def cadastrar():
    data = request.json
    usuario = data.get('usuario')
    senha = data.get('senha')

    if not usuario or not senha:
        return jsonify({'erro': 'Preencha usuário e senha!'}), 400

    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('INSERT INTO usuarios (usuario, senha, fase) VALUES (?, ?, 1)', (usuario, senha))
        conn.commit()
        conn.close()
        return jsonify({'mensagem': 'Cadastrado com sucesso!'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'erro': 'Usuário já existe!'}), 400

# Rota para FAZER LOGIN
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    usuario = data.get('usuario')
    senha = data.get('senha')

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('SELECT senha, fase FROM usuarios WHERE usuario = ?', (usuario,))
    row = cursor.fetchone()
    conn.close()

    if row and row[0] == senha:
        return jsonify({
            'mensagem': 'Login com sucesso!',
            'progresso': {'fase': row[1]}
        }), 200
    else:
        return jsonify({'erro': 'Usuário ou senha incorretos'}), 401

# Rota para SALVAR A FASE do jogador
@app.route('/api/progresso', methods=['POST'])
def salvar_progresso():
    data = request.json
    usuario = data.get('usuario')
    fase = data.get('fase')

    if not usuario or fase is None:
        return jsonify({'erro': 'Dados incompletos'}), 400

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('UPDATE usuarios SET fase = ? WHERE usuario = ?', (fase, usuario))
    conn.commit()
    conn.close()

    return jsonify({'mensagem': 'Progresso salvo!'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)