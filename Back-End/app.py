import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client

app = Flask(__name__)
CORS(app)

# Configuração Segura via Variáveis de Ambiente
SUPABASE_URL = os.environ.get("SUPABASE_URL", "SUA_URL_DO_SUPABASE")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "SUA_CHAVE_ANON_PUBLIC_AQUI")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# Rota para CADASTRAR novo usuário
@app.route('/api/cadastrar', methods=['POST'])
def cadastrar():
    data = request.json
    usuario = data.get('usuario')
    senha = data.get('senha')

    if not usuario or not senha:
        return jsonify({'erro': 'Preencha usuário e senha!'}), 400

    try:
        email_ficticio = f"{usuario}@jogo.com"
        
        # 1. Cria a conta no Supabase Auth
        res_auth = supabase.auth.sign_up({
            "email": email_ficticio,
            "password": senha
        })

        # 2. Salva na tabela "Cadastro"
        supabase.table("Cadastro").insert({
            "id": res_auth.user.id,
            "usuario": usuario,
            "fase": 1
        }).execute()

        return jsonify({'mensagem': 'Cadastrado com sucesso!'}), 201

    except Exception as e:
        return jsonify({'erro': 'Erro ao cadastrar ou usuário já existe.'}), 400


# Rota para FAZER LOGIN
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    usuario = data.get('usuario')
    senha = data.get('senha')

    if not usuario or not senha:
        return jsonify({'erro': 'Preencha usuário e senha!'}), 400

    try:
        email_ficticio = f"{usuario}@jogo.com"

        # 1. Autentica no Supabase Auth
        res_auth = supabase.auth.sign_in_with_password({
            "email": email_ficticio,
            "password": senha
        })

        # 2. Busca a fase na tabela "Cadastro"
        res_db = supabase.table("Cadastro").select("fase").eq("id", res_auth.user.id).execute()

        fase = 1
        if res_db.data:
            fase = res_db.data[0].get('fase', 1)

        return jsonify({
            'mensagem': 'Login com sucesso!',
            'progresso': {'fase': fase}
        }), 200

    except Exception:
        return jsonify({'erro': 'Usuário ou senha incorretos'}), 401


# Rota para SALVAR A FASE do jogador
@app.route('/api/progresso', methods=['POST'])
def salvar_progresso():
    data = request.json
    usuario = data.get('usuario')
    fase = data.get('fase')

    if not usuario or fase is None:
        return jsonify({'erro': 'Dados incompletos'}), 400

    try:
        supabase.table("Cadastro").update({"fase": fase}).eq("usuario", usuario).execute()
        return jsonify({'mensagem': 'Progresso salvo!'}), 200
    except Exception as e:
        return jsonify({'erro': 'Erro ao salvar no Supabase'}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
