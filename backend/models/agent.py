import datetime
import uuid
from sqlalchemy import Column, String, Text, DateTime
from backend.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False, default="v1.0.0")
    connector_type = Column(String(20), nullable=False, default="prompt") # "webhook" or "prompt"
    webhook_url = Column(String(255), nullable=True)
    system_prompt = Column(Text, nullable=True)
    knowledge_base = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
