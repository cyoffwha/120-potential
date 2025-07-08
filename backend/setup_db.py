import os
import psycopg2
from sqlalchemy.ext.asyncio import create_async_engine
from db import Base, engine
from dotenv import load_dotenv

load_dotenv()

# Parse DB info from DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

# Extract db name and admin connection string
import re
match = re.match(r"postgresql\+asyncpg://(.*):(.*)@(.*):(\d+)/(.*)", DATABASE_URL)
if not match:
    raise Exception("DATABASE_URL is not in the expected format!")
user, password, host, port, dbname = match.groups()
admin_url = f"postgresql://{user}:{password}@{host}:{port}/postgres"

# 1. Create database if not exists
conn = psycopg2.connect(admin_url)
conn.autocommit = True
cur = conn.cursor()
cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{dbname}'")
if not cur.fetchone():
    cur.execute(f"CREATE DATABASE {dbname}")
    print(f"Database '{dbname}' created.")
else:
    print(f"Database '{dbname}' already exists.")
cur.close()
conn.close()

# 2. Create tables if not exists (async)
import asyncio
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created (if not exist). Done!")

asyncio.run(create_tables())
