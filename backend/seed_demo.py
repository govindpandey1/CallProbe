import asyncio
import json
import logging
from backend.database import engine, SessionLocal, Base
from backend.models.agent import Agent
from backend.models.scenario import ScenarioSuite, Scenario
from backend.models.run import SimulationRun, Transcript, Evaluation
from backend.models.review import HumanReview
from backend.agents.demo_bank_agent import DEMO_BANK_AGENT_V1_FLAWED, DEMO_BANK_AGENT_V2_FIXED
from backend.engine.generator import ScenarioGenerator
from backend.engine.simulator import SimulationEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("callprobe.seed")

async def run_seed():
    print("🌱 [CallProbe] Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Clear old demo records
        db.query(HumanReview).delete()
        db.query(Evaluation).delete()
        db.query(Transcript).delete()
        db.query(SimulationRun).delete()
        db.query(Scenario).delete()
        db.query(ScenarioSuite).delete()
        db.query(Agent).delete()
        db.commit()

        # 2. Seed Agents
        print("🤖 [CallProbe] Registering Demo Agents...")
        agent_v1 = Agent(**DEMO_BANK_AGENT_V1_FLAWED)
        agent_v2 = Agent(**DEMO_BANK_AGENT_V2_FIXED)
        db.add(agent_v1)
        db.add(agent_v2)
        db.commit()
        db.refresh(agent_v1)
        db.refresh(agent_v2)
        print(f"   ✓ Agent v1 (Flawed): {agent_v1.id}")
        print(f"   ✓ Agent v2 (Fixed):  {agent_v2.id}")

        # 3. Create Scenario Suite
        print("📝 [CallProbe] Generating 18 Diverse Hinglish Voice Scenarios...")
        suite = ScenarioSuite(
            name="ApnaBank Core Regressions Suite",
            domain="banking",
            is_regression_suite=True
        )
        db.add(suite)
        db.commit()
        db.refresh(suite)

        scenarios_data = ScenarioGenerator.generate_batch(
            domain="banking",
            count=18,
            suite_name=suite.name,
            language_mix="hinglish"
        )

        created_scenarios = []
        for s_data in scenarios_data:
            sc = Scenario(
                suite_id=suite.id,
                persona=s_data["persona"],
                caller_goal=s_data["caller_goal"],
                language_mix=s_data["language_mix"],
                difficulty=s_data["difficulty"],
                initial_utterance=s_data["initial_utterance"],
                metadata_json=json.dumps(s_data.get("metadata_json", {}))
            )
            db.add(sc)
            created_scenarios.append(sc)
        db.commit()
        print(f"   ✓ Scenario Suite ID: {suite.id} (18 scenarios)")

        # 4. Run Baseline: Agent v1 (Flawed)
        print("⚡ [CallProbe] Executing Run 1 with Flawed Agent v1...")
        run_v1 = SimulationRun(
            agent_id=agent_v1.id,
            suite_id=suite.id,
            status="queued",
            total_scenarios=len(created_scenarios),
            completed_scenarios=0
        )
        db.add(run_v1)
        db.commit()
        db.refresh(run_v1)

        await SimulationEngine.execute_run(run_id=run_v1.id, concurrency=6, max_turns=6)
        db.refresh(run_v1)
        print(f"   ✓ Run 1 Completed! Pass Rate: {run_v1.pass_rate}%, Compliance Fails: {run_v1.compliance_fail_rate}%")

        # 5. Run Candidate: Agent v2 (Fixed)
        print("⚡ [CallProbe] Executing Run 2 with Hardened Agent v2...")
        run_v2 = SimulationRun(
            agent_id=agent_v2.id,
            suite_id=suite.id,
            status="queued",
            total_scenarios=len(created_scenarios),
            completed_scenarios=0
        )
        db.add(run_v2)
        db.commit()
        db.refresh(run_v2)

        await SimulationEngine.execute_run(run_id=run_v2.id, concurrency=6, max_turns=6)
        db.refresh(run_v2)
        print(f"   ✓ Run 2 Completed! Pass Rate: {run_v2.pass_rate}%, Compliance Fails: {run_v2.compliance_fail_rate}%")

        # 6. Seed Human Review Queue ratings
        sample_evals = db.query(Evaluation).limit(5).all()
        for idx, ev in enumerate(sample_evals):
            decision = "agree" if idx != 1 else "disagree"
            notes = "Human auditor verified judge verdict." if decision == "agree" else "Auditor judged caller intent as borderline."
            review = HumanReview(
                evaluation_id=ev.id,
                reviewer_decision=decision,
                reviewer_notes=notes
            )
            db.add(review)
        db.commit()
        print(f"   ✓ Seeded {len(sample_evals)} human review queue audits.")

        print("\n🎉 Seed Complete! Telemetry and regression diffs ready on dashboard.")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_seed())
