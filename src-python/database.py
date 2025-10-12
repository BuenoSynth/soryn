import sqlite3
import uuid
import json
from datetime import datetime, timezone
import logging
from typing import List, Dict, Any, Optional

# --- Configuração ---
DATABASE_FILE = "soryn_history.db"
logger = logging.getLogger(__name__)

# --- Funções Auxiliares ---

def get_db_connection():
    """Cria e retorna uma conexão com o banco de dados."""
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row  # Permite acessar colunas pelo nome
    conn.execute("PRAGMA foreign_keys = ON;") # Garante que as chaves estrangeiras funcionem
    return conn

# --- Funções de Inicialização ---

def initialize_database():
    """
    Cria o banco de dados e as tabelas se não existirem, com o schema embutido no código.
    Esta função deve ser chamada na inicialização do servidor Flask.
    """
    schema = """
    CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        model_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS debates (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        winner_model_id TEXT,
        evaluation_reasoning TEXT,
        total_time_ms INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        responses TEXT NOT NULL
    );
    """
        
    try:
        with get_db_connection() as conn:
            conn.executescript(schema)
        logger.info("Banco de dados inicializado com sucesso.")
    except sqlite3.Error as e:
        logger.error(f"Erro ao inicializar o banco de dados: {e}")

# --- Funções de Gerenciamento de Chats e Mensagens ---

def create_new_chat(model_id: str, first_user_message: str) -> Optional[str]:
    """Cria um novo chat e salva a primeira mensagem do usuário."""
    chat_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Gera um título a partir dos primeiros 50 caracteres da mensagem
    title = first_user_message[:50] + "..." if len(first_user_message) > 50 else first_user_message

    try:
        with get_db_connection() as conn:
            # Insere o novo chat
            conn.execute(
                "INSERT INTO chats (id, model_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (chat_id, model_id, title, now, now)
            )
            # Insere a primeira mensagem do usuário
            conn.execute(
                "INSERT INTO messages (id, chat_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), chat_id, 'user', first_user_message, now)
            )
        logger.info(f"Novo chat criado com ID: {chat_id}")
        return chat_id
    except sqlite3.Error as e:
        logger.error(f"Erro ao criar novo chat: {e}")
        return None

def add_message_to_chat(chat_id: str, role: str, content: str) -> bool:
    """Adiciona uma nova mensagem a um chat existente."""
    now = datetime.now(timezone.utc).isoformat()
    try:
        with get_db_connection() as conn:
            # Insere a nova mensagem
            conn.execute(
                "INSERT INTO messages (id, chat_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), chat_id, role, content, now)
            )
            # Atualiza o timestamp 'updated_at' do chat
            conn.execute(
                "UPDATE chats SET updated_at = ? WHERE id = ?",
                (now, chat_id)
            )
        return True
    except sqlite3.Error as e:
        logger.error(f"Erro ao adicionar mensagem ao chat {chat_id}: {e}")
        return False

def get_chat_history(chat_id: str) -> Optional[Dict[str, Any]]:
    """Busca os detalhes de um chat, incluindo todas as suas mensagens."""
    try:
        with get_db_connection() as conn:
            chat_row = conn.execute("SELECT * FROM chats WHERE id = ?", (chat_id,)).fetchone()
            if not chat_row:
                return None
            
            messages_rows = conn.execute(
                "SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC", (chat_id,)
            ).fetchall()
            
            chat_details = dict(chat_row)
            chat_details['messages'] = [dict(msg) for msg in messages_rows]
            return chat_details
    except sqlite3.Error as e:
        logger.error(f"Erro ao buscar histórico do chat {chat_id}: {e}")
        return None

# --- Funções de Gerenciamento de Debates ---

def save_debate_result(debate_data: Dict[str, Any]) -> Optional[str]:
    """Salva o resultado de um debate no banco de dados."""
    debate_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Serializa a lista de respostas para uma string JSON
    responses_json = json.dumps(debate_data.get('responses', []))

    try:
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO debates (id, prompt, winner_model_id, evaluation_reasoning, total_time_ms, timestamp, responses)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    debate_id,
                    debate_data.get('prompt'),
                    debate_data.get('winner_model_id'),
                    debate_data.get('evaluation_reasoning'),
                    debate_data.get('total_time_ms'),
                    now,
                    responses_json
                )
            )
        logger.info(f"Resultado do debate salvo com ID: {debate_id}")
        return debate_id
    except sqlite3.Error as e:
        logger.error(f"Erro ao salvar resultado do debate: {e}")
        return None

def get_debate_details(debate_id: str) -> Optional[Dict[str, Any]]:
    """Busca os detalhes de um debate específico."""
    try:
        with get_db_connection() as conn:
            debate_row = conn.execute("SELECT * FROM debates WHERE id = ?", (debate_id,)).fetchone()
            if not debate_row:
                return None
            
            debate_details = dict(debate_row)
            # Desserializa a string JSON de volta para uma lista Python
            debate_details['responses'] = json.loads(debate_details['responses'])
            return debate_details
    except (sqlite3.Error, json.JSONDecodeError) as e:
        logger.error(f"Erro ao buscar detalhes do debate {debate_id}: {e}")
        return None
        
# --- Funções para a Tela de Histórico ---

def get_all_history_previews() -> List[Dict[str, Any]]:
    """
    Busca uma lista simplificada de todos os chats e debates para a tela de histórico.
    """
    query = """
    SELECT 
        id, 
        title, 
        updated_at AS sort_date, 
        'chat' AS type 
    FROM chats
    UNION ALL
    SELECT 
        id, 
        prompt AS title, 
        timestamp AS sort_date, 
        'debate' AS type 
    FROM debates
    ORDER BY sort_date DESC;
    """
    try:
        with get_db_connection() as conn:
            history_rows = conn.execute(query).fetchall()
            return [dict(row) for row in history_rows]
    except sqlite3.Error as e:
        logger.error(f"Erro ao buscar previews do histórico: {e}")
        return []

def delete_history_item(item_id: str, item_type: str) -> bool:
    """Deleta um item do histórico (chat ou debate)."""
    if item_type not in ['chat', 'debate']:
        logger.warning(f"Tipo de item inválido para exclusão: {item_type}")
        return False
        
    table_name = "chats" if item_type == 'chat' else 'debates'
    
    try:
        with get_db_connection() as conn:
            cursor = conn.execute(f"DELETE FROM {table_name} WHERE id = ?", (item_id,))
            # A deleção de mensagens de chat é tratada por 'ON DELETE CASCADE'
            if cursor.rowcount > 0:
                logger.info(f"Item '{item_id}' do tipo '{item_type}' deletado com sucesso.")
                return True
            else:
                logger.warning(f"Nenhum item encontrado para deletar com ID '{item_id}' do tipo '{item_type}'.")
                return False
    except sqlite3.Error as e:
        logger.error(f"Erro ao deletar item {item_id}: {e}")
        return False

