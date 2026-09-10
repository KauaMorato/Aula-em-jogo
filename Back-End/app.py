import os
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from typing import Any

# Import third-party libraries defensively so import-time failures
# (e.g. missing packages in the environment) don't crash module import.
try:
    from supabase import create_client, Client  # type: ignore
except Exception:
    create_client = None  # type: ignore
    Client = None  # type: ignore

try:
    from dotenv import load_dotenv  # type: ignore
except Exception:
    load_dotenv = None  # type: ignore

root_dir = Path(__file__).resolve().parent.parent
backend_dir = Path(__file__).resolve().parent

# Load environment files if python-dotenv is available
for env_path in (root_dir / ".env", backend_dir / ".env"):
    if env_path.exists() and load_dotenv:
        try:
            load_dotenv(env_path)
            break
        except Exception:
            break

app = Flask(__name__)
CORS(app)

# Configuração via variáveis de ambiente (valores default mantidos)
DEFAULT_SUPABASE_URL = "https://blwrjkpzimpxbubrgcna.supabase.co/rest/v1/"
DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd3Jqa3B6aW1weGJ1YnJnY25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjc0MTEsImV4cCI6MjEwMTcwMzQxMX0.MNPXNuvw06TG2jRZKKuKb61_fdBEwVjAIcspeQ425bw"

SUPABASE_URL = (os.environ.get("SUPABASE_URL") or DEFAULT_SUPABASE_URL).strip().rstrip("/")
SUPABASE_KEY = (os.environ.get("SUPABASE_KEY") or DEFAULT_SUPABASE_KEY).strip()

# Lazy initialization for supabase client so module import doesn't fail
_supabase_client: Any | None = None

def get_supabase() -> Any | None:
    """Cria o cliente Supabase na primeira chamada e retorna None se não disponível."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    if create_client is None:
        print("supabase package not available; skipping client creation")
        return None
    try:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return _supabase_client
    except Exception as e:
        print(f"Erro ao criar supabase client: {e}")
        return None


def resolver_tabela_cadastro():
    """Tenta identificar o nome real da tabela no Supabase, aceitando variações de caixa.

    Se o cliente Supabase não estiver disponível, retorna o nome padrão.
    """
    sup = get_supabase()
    nomes = ["Cadastro", "cadastro", "cadastros", "cadastro_jogo"]
    if not sup:
        return "Cadastro"
    for nome in nomes:
        try:
            sup.table(nome).select("id").limit(1).execute()
            return nome
        except Exception:
            continue
    return "Cadastro"


def buscar_fase_por_usuario(usuario: str, usuario_id: str | None = None):
    tabela = resolver_tabela_cadastro()
    sup = get_supabase()

    if not sup:
        return 1

    if usuario_id:
        try:
            res_db = sup.table(tabela).select("fase").eq("id", usuario_id).execute()
            if getattr(res_db, "data", None):
                return res_db.data[0].get("fase", 1)
        except Exception:
            pass

    try:
        res_db = sup.table(tabela).select("fase").eq("usuario", usuario).execute()
        if getattr(res_db, "data", None):
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

    sup = get_supabase()
    if not sup:
        return jsonify({'erro': 'Serviço Supabase não disponível no ambiente.'}), 500

    try:
        email_ficticio = f"{usuario}@jogo.com"
        tabela = resolver_tabela_cadastro()

        # 1. Cria a conta no Supabase Auth
        res_auth = sup.auth.sign_up({
            "email": email_ficticio,
            "password": senha
        })

        # 2. Salva na tabela de cadastro
        sup.table(tabela).insert({
            "id": getattr(res_auth.user, 'id', None),
            "usuario": usuario,
            "fase": 1
        }).execute()

        return jsonify({'mensagem': 'Cadastrado com sucesso!'}), 201

    except Exception as e:
        print(f"Erro ao cadastrar usuário: {e}")
        return jsonify({
            'erro': 'Erro ao cadastrar. Verifique a configuração do Supabase e as variáveis de ambiente.'
        }), 400


# Rota para FAZER LOGIN
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    usuario = (data.get('usuario') or '').strip()
    senha = data.get('senha') or ''

    if not usuario or not senha:
        return jsonify({'erro': 'Preencha usuário e senha!'}), 400

    sup = get_supabase()
    if not sup:
        return jsonify({'erro': 'Serviço Supabase não disponível no ambiente.'}), 500

    try:
        email_ficticio = f"{usuario}@jogo.com"

        # 1. Autentica no Supabase Auth
        res_auth = sup.auth.sign_in_with_password({
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

    sup = get_supabase()
    if not sup:
        return jsonify({'erro': 'Serviço Supabase não disponível no ambiente.'}), 500

    try:
        tabela = resolver_tabela_cadastro()
        sup.table(tabela).update({"fase": fase}).eq("usuario", usuario).execute()
        return jsonify({'mensagem': 'Progresso salvo!'}), 200
    except Exception as e:
        print(f"Erro ao salvar progresso: {e}")
        return jsonify({'erro': 'Erro ao salvar no Supabase. Verifique a tabela e as políticas de acesso.'}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
