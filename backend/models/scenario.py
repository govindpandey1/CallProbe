import datetime
import uuid
from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class ScenarioSuite(Base):
    __tablename__ = "scenario_suites"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(120), nullable=False)
    domain = Column(String(50), nullable=False, default="banking")
    is_regression_suite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scenarios = relationship("Scenario", back_populates="suite", cascade="all, delete-orphan")


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    suite_id = Column(String(36), ForeignKey("scenario_suites.id"), nullable=False)
    persona = Column(String(50), nullable=False) # impatient, confused_elder, angry, noisy_line, policy_violator, interrupter
    caller_goal = Column(Text, nullable=False)
    language_mix = Column(String(20), nullable=False, default="hinglish") # hindi, english, hinglish
    difficulty = Column(Integer, default=3) # 1 to 5
    initial_utterance = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True) # JSON config (noise_level, interrupt_turn, etc.)

    suite = relationship("ScenarioSuite", back_populates="scenarios")
