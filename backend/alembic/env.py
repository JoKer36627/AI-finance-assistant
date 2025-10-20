from logging.config import fileConfig
from sqlalchemy import pool, create_engine
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context

from app.db.base import Base
from app.config import settings

DATABASE_URL = str(settings.database_url)

config = context.config
fileConfig(config.config_file_name)

target_metadata = Base.metadata

async def run_migrations_online():
    connectable = create_async_engine(DATABASE_URL, poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True
    )
    with context.begin_transaction():
        context.run_migrations()

if context.is_offline_mode():
    raise NotImplementedError("Offline migrations not configured for async.")
else:
    import asyncio
    asyncio.run(run_migrations_online())
