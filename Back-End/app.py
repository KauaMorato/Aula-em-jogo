import os
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv

root_dir = Path(__file__).resolve().parent.parent
backend_dir = Path(__file__).resolve().parent

for env_path in (root_dir / ".env", backend_dir / ".env"):
    if env_path.exists():
        load_dotenv(env_path)
        break

app = Flask(__name__)
CORS(app)

# Configuração segura via variáveis de ambiente
DEFAULT_SUPABASE_URL = "https://blwrjkpzimpxbubrgcna.supabase.co"
DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd3Jqa3B6aW1weGJ1YnJnY25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjc0MTEsImV4cCI6MjEwMTcwMzQxMX0.MNPXNuvw06TG2jRZKKuKb61_fdBEwVjAIcspeQ425bw"

SUPABASE_URL = (os.environ.get("SUPABASE_URL") or DEFAULT_SUPABASE_URL).strip().rstrip("/")
SUPABASE_KEY = (os.environ.get("SUPABASE_KEY") or DEFAULT_SUPABASE_KEY).strip()

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def resolver_tabela_cadastro():
    """Tenta identificar o nome real da tabela no Supabase, aceitando variações de caixa."""
    nomes = ["Cadastro", "cadastro", "cadastros", "cadastro_jogo"]
    for nome in nomes:
        try:
            supabase.table(nome).select("id").limit(1).execute()
            return nome
        except Exception:
            continue
    return "Cadastro"


def buscar_fase_por_usuario(usuario: str, usuario_id: str | None = None):
    tabela = resolver_tabela_cadastro()

    if usuario_id:
        try:
            res_db = supabase.table(tabela).select("fase").eq("id", usuario_id).execute()
            if res_db.data:
                return res_db.data[0].get("fase", 1)
        except Exception:
            pass

    try:
        res_db = supabase.table(tabela).select("fase").eq("usuario", usuario).execute()
        if res_db.data:
            return res_db.data[0].get("fase", 1)
    except Exception:
        pass

    return 1


# Rota para CADASTRAR novo usuário
@app.route('/api/cadastrar', methods=['POST'])
def cadastrar():
    data = request.json or {}
    usuario = (data.get('usuario') or '').strip()
    senha = data.get('senha') or ''

    if not usuario or not senha:
        return jsonify({'erro': 'Preencha usuário e senha!'}), 400

    try:
        email_ficticio = f"{usuario}@jogo.com"
        tabela = resolver_tabela_cadastro()

        # 1. Cria a conta no Supabase Auth
        res_auth = supabase.auth.sign_up({
            "email": email_ficticio,
            "password": senha
        })

        # 2. Salva na tabela de cadastro
        supabase.table(tabela).insert({
            "id": res_auth.user.id,
            "usuario": usuario,
            "fase": 1
        }).execute()

        return jsonify({'mensagem': 'Cadastrado com sucesso!'}), 201

    except Exception as e:
        print(f"Erro ao cadastrar usuário: {e}")
        return jsonify({
            'erro': 'Erro ao cadastrar. Verifique se a tabela "Cadastro" existe no Supabase e se as políticas de acesso estão corretas.'
        }), 400


# Rota para FAZER LOGIN
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    usuario = (data.get('usuario') or '').strip()
    senha = data.get('senha') or ''

    if not usuario or not senha:
        return jsonify({'erro': 'Preencha usuário e senha!'}), 400

    try:
        email_ficticio = f"{usuario}@jogo.com"

        # 1. Autentica no Supabase Auth
        res_auth = supabase.auth.sign_in_with_password({
            "email": email_ficticio,
            "password": senha
        })

        fase = buscar_fase_por_usuario(usuario, getattr(res_auth.user, 'id', None))

        return jsonify({
            'mensagem': 'Login com sucesso!',
            'progresso': {'fase': fase}
        }), 200

    except Exception as e:
        print(f"Erro ao autenticar usuário: {e}")
        return jsonify({'erro': 'Usuário ou senha incorretos'}), 401


# Rota para SALVAR A FASE do jogador
@app.route('/api/progresso', methods=['POST'])
def salvar_progresso():
    data = request.json or {}
    usuario = (data.get('usuario') or '').strip()
    fase = data.get('fase')

    if not usuario or fase is None:
        return jsonify({'erro': 'Dados incompletos'}), 400

    try:
        tabela = resolver_tabela_cadastro()
        supabase.table(tabela).update({"fase": fase}).eq("usuario", usuario).execute()
        return jsonify({'mensagem': 'Progresso salvo!'}), 200
    except Exception as e:
        print(f"Erro ao salvar progresso: {e}")
        return jsonify({'erro': 'Erro ao salvar no Supabase. Verifique a tabela e as políticas de acesso.'}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
