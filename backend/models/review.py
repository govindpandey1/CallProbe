import datetime
import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class HumanReview(Base):
    __tablename__ = "human_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String(36), ForeignKey("evaluations.id"), nullable=False)
    reviewer_decision = Column(String(20), nullable=False) # "agree", "disagree"
    reviewer_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=datetime.datetime.utcnow)

    evaluation = relationship("Evaluation", back_populates="human_reviews")
