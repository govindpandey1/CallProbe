import datetime
import uuid
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False)
    suite_id = Column(String(36), ForeignKey("scenario_suites.id"), nullable=False)
    status = Column(String(20), default="queued") # queued, running, completed, failed
    total_scenarios = Column(Integer, default=0)
    completed_scenarios = Column(Integer, default=0)
    pass_rate = Column(Float, default=0.0)
    resolution_rate = Column(Float, default=0.0)
    compliance_fail_rate = Column(Float, default=0.0)
    p50_latency_ms = Column(Float, default=0.0)
    p95_latency_ms = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)

    transcripts = relationship("Transcript", back_populates="run", cascade="all, delete-orphan")


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(36), ForeignKey("simulation_runs.id"), nullable=False)
    scenario_id = Column(String(36), ForeignKey("scenarios.id"), nullable=False)
    turns_json = Column(Text, nullable=False) # JSON list of {turn, speaker, text, latency_ms, interrupted}
    passed = Column(Boolean, default=False)
    failure_tag = Column(String(100), nullable=True) # e.g., "Policy Violation", "Hallucination", "Unresolved Goal"

    run = relationship("SimulationRun", back_populates="transcripts")
    evaluations = relationship("Evaluation", back_populates="transcript", cascade="all, delete-orphan")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transcript_id = Column(String(36), ForeignKey("transcripts.id"), nullable=False)
    metric_name = Column(String(50), nullable=False) # resolution, hallucination, compliance, latency, sentiment
    score = Column(String(50), nullable=False) # e.g., "yes", "partial", "no", "pass", "fail"
    passed = Column(Boolean, default=False)
    culprit_turn = Column(Integer, nullable=True)
    reason = Column(Text, nullable=False)
    raw_metadata_json = Column(Text, nullable=True)

    transcript = relationship("Transcript", back_populates="evaluations")
    human_reviews = relationship("HumanReview", back_populates="evaluation", cascade="all, delete-orphan")
