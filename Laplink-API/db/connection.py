import os
from dotenv import load_dotenv
import mysql.connector.pooling
import queue

load_dotenv('.env.local')


db_config = {
    'host': os.getenv("DB_HOST"),
    'user': os.getenv("DB_USER"),
    'password': os.getenv("DB_PASSWORD"),
    'database': os.getenv("DB_DATABASE"),
    'port': os.getenv("DB_PORT", 3306),
}

# Vytvoření connection poolu
connection_pool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="laplink_pool",
    pool_size=10,
    **db_config
)

high_priority_queue = queue.Queue()
low_priority_queue = queue.Queue()

def get_db_connection():
    """
    Získání připojení z poolu.
    """
    try:
        return connection_pool.get_connection()
    except mysql.connector.Error as e:
        raise Exception(f"Chyba při získávání připojení k databázi: {e}")

def prioritized_get_db_connection(priority="low"):
    """
    Získá připojení z poolu s prioritizací požadavků.
    """
    if priority == "high":
        high_priority_queue.put(None)
    else:
        low_priority_queue.put(None)

    while not high_priority_queue.empty() or not low_priority_queue.empty():
        try:
            if not high_priority_queue.empty():
                high_priority_queue.get()
                return get_db_connection()
            elif not low_priority_queue.empty():
                low_priority_queue.get()
                return get_db_connection()
        except mysql.connector.pooling.PoolError:
            pass

    raise Exception("Všechna připojení jsou momentálně obsazena. Zkuste to prosím později.")
