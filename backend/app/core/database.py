from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    connect_args={"prepare_threshold": None, "connect_timeout": 20},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)
