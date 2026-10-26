import asyncio
import datetime
import json
import logging
import random
import time
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models.agent import Agent
from backend.models.scenario import Scenario, ScenarioSuite
from backend.models.run import SimulationRun, Transcript, Evaluation
from backend.agents.connector import AgentConnector
from backend.engine.personas import CORE_PERSONAS
from backend.evaluators.orchestrator import EvaluatorOrchestrator
from backend.llm.llm_client import get_llm_client

logger = logging.getLogger("callprobe.simulator")

def _truncate_mid_sentence(text: str) -> str:
    """Simulate an interruption by truncating agent reply mid-sentence."""
    words = text.split()
    if len(words) <= 4:
        return text[:max(len(text) // 2, 4)] + "..."
    cut_point = random.randint(3, min(len(words) - 1, 8))
    return " ".join(words[:cut_point]) + "..."

class SimulationEngine:
    """
    Simulates multi-turn voice conversations between caller personas and agents,
    supporting interruptions, latency tracking, and evaluator scoring.
    """

    @classmethod
    async def run_scenario_conversation(
        cls,
        agent: Agent,
        scenario: Scenario,
        max_turns: int = 8,
        llm_client=None
    ) -> Dict[str, Any]:
        client = llm_client or get_llm_client()
        persona_info = CORE_PERSONAS.get(scenario.persona, CORE_PERSONAS["impatient"])

        # Caller system prompt
        caller_sys = (
            f"{persona_info['system_prompt']}\n"
            f"YOUR GOAL: {scenario.caller_goal}\n"
            f"LANGUAGE: {scenario.language_mix}\n"
            "Respond in 1-2 realistic Hinglish voice turns. Keep your voice conversational."
        )

        turns = []
        messages_for_agent = []
        messages_for_caller = [{"role": "system", "content": caller_sys}]

        # Turn 1: Initial caller utterance
        current_caller_text = scenario.initial_utterance
        turns.append({
            "turn": 1,
            "speaker": "caller",
            "text": current_caller_text,
            "latency_ms": 120.0,
            "interrupted": False
        })
        messages_for_agent.append({"role": "user", "content": current_caller_text})
        messages_for_caller.append({"role": "assistant", "content": current_caller_text})

        is_interrupter = scenario.persona == "interrupter"

        # Multi-turn conversation loop
        for turn_idx in range(2, max_turns + 1, 2):
            # Agent turn
            agent_res = await AgentConnector.invoke(
                connector_type=agent.connector_type,
                webhook_url=agent.webhook_url,
                system_prompt=agent.system_prompt,
                knowledge_base=agent.knowledge_base,
                messages=messages_for_agent,
            )

            raw_agent_reply = agent_res.get("reply", "") or "Namaste, kaise madad kar sakta hoon?"
            agent_latency = agent_res.get("latency_ms", 350.0)

            # Check if caller interrupts this turn
            interrupted = False
            if is_interrupter and (turn_idx // 2) == 1:
                # Interrupt on first or second turn
                raw_agent_reply = _truncate_mid_sentence(raw_agent_reply)
                interrupted = True

            turns.append({
                "turn": turn_idx,
                "speaker": "agent",
                "text": raw_agent_reply,
                "latency_ms": agent_latency,
                "interrupted": interrupted
            })
            messages_for_agent.append({"role": "assistant", "content": raw_agent_reply})
            messages_for_caller.append({"role": "user", "content": raw_agent_reply})

            # Check if caller wants to conclude or continue
            if turn_idx >= max_turns:
                break

            # Next caller turn
            caller_turn_idx = turn_idx + 1
            caller_res = await client.chat_completion_async(messages_for_caller)
            caller_reply = caller_res.strip() if caller_res else "Theek hai, dhanyawad."

            turns.append({
                "turn": caller_turn_idx,
                "speaker": "caller",
                "text": caller_reply,
                "latency_ms": 150.0,
                "interrupted": False
            })
            messages_for_agent.append({"role": "user", "content": caller_reply})
            messages_for_caller.append({"role": "assistant", "content": caller_reply})

            # Early exit if conversation reached natural closure
            if any(term in caller_reply.lower() for term in ["bye", "dhanyawad", "thank you", "disconnect"]):
                break

        # Run Evaluators
        eval_result = await EvaluatorOrchestrator.evaluate_transcript(
            goal=scenario.caller_goal,
            knowledge_base=agent.knowledge_base,
            turns=turns,
            latency_threshold_ms=1500.0,
            llm_client=client
        )

        return {
            "scenario_id": scenario.id,
            "turns": turns,
            "passed": eval_result["passed"],
            "failure_tag": eval_result["failure_tag"],
            "evaluations": eval_result["evaluations"]
        }

    @classmethod
    async def execute_run(
        cls,
        run_id: str,
        concurrency: int = 5,
        max_turns: int = 8
    ):
        """Background task runner for executing an entire simulation run."""
        db = SessionLocal()
        try:
            run = db.query(SimulationRun).filter(SimulationRun.id == run_id).first()
            if not run:
                logger.error(f"Run {run_id} not found.")
                return

            agent = db.query(Agent).filter(Agent.id == run.agent_id).first()
            suite = db.query(ScenarioSuite).filter(ScenarioSuite.id == run.suite_id).first()
            scenarios = db.query(Scenario).filter(Scenario.suite_id == run.suite_id).all()

            if not agent or not suite or not scenarios:
                run.status = "failed"
                run.error_message = "Agent, suite, or scenarios missing."
                db.commit()
                return

            run.status = "running"
            run.total_scenarios = len(scenarios)
            run.completed_scenarios = 0
            db.commit()

            semaphore = asyncio.Semaphore(concurrency)
            all_latencies = []
            pass_count = 0
            res_pass_count = 0
            comp_fail_count = 0

            async def worker(sc: Scenario):
                nonlocal pass_count, res_pass_count, comp_fail_count
                async with semaphore:
                    try:
                        result = await cls.run_scenario_conversation(
                            agent=agent,
                            scenario=sc,
                            max_turns=max_turns
                        )

                        # Write transcript to DB in isolated session
                        w_db = SessionLocal()
                        try:
                            transcript = Transcript(
                                run_id=run_id,
                                scenario_id=sc.id,
                                turns_json=json.dumps(result["turns"]),
                                passed=result["passed"],
                                failure_tag=result["failure_tag"]
                            )
                            w_db.add(transcript)
                            w_db.commit()
                            w_db.refresh(transcript)

                            for ev in result["evaluations"]:
                                eval_rec = Evaluation(
                                    transcript_id=transcript.id,
                                    metric_name=ev["metric_name"],
                                    score=str(ev["score"]),
                                    passed=ev["passed"],
                                    culprit_turn=ev.get("culprit_turn"),
                                    reason=ev.get("reason", ""),
                                    raw_metadata_json=json.dumps(ev.get("trajectory", {})) if "trajectory" in ev else None
                                )
                                w_db.add(eval_rec)
                            w_db.commit()

                            # Track metrics
                            if result["passed"]:
                                pass_count += 1

                            for ev in result["evaluations"]:
                                if ev["metric_name"] == "resolution" and ev["passed"]:
                                    res_pass_count += 1
                                if ev["metric_name"] == "compliance" and not ev["passed"]:
                                    comp_fail_count += 1

                            for t in result["turns"]:
                                if t.get("speaker") == "agent" and t.get("latency_ms") is not None:
                                    all_latencies.append(float(t["latency_ms"]))

                            # Update run counter
                            w_run = w_db.query(SimulationRun).filter(SimulationRun.id == run_id).first()
                            if w_run:
                                w_run.completed_scenarios += 1
                                w_db.commit()
                        finally:
                            w_db.close()

                    except Exception as e:
                        logger.exception(f"Error evaluating scenario {sc.id}: {e}")

            # Run workers concurrently
            await asyncio.gather(*(worker(sc) for sc in scenarios))

            # Finalize run
            db.refresh(run)
            total = max(run.total_scenarios, 1)
            run.pass_rate = round((pass_count / total) * 100.0, 1)
            run.resolution_rate = round((res_pass_count / total) * 100.0, 1)
            run.compliance_fail_rate = round((comp_fail_count / total) * 100.0, 1)

            from backend.evaluators.latency import _percentile
            run.p50_latency_ms = round(_percentile(all_latencies, 50.0), 1) if all_latencies else 0.0
            run.p95_latency_ms = round(_percentile(all_latencies, 95.0), 1) if all_latencies else 0.0

            run.status = "completed"
            run.finished_at = datetime.datetime.utcnow()
            db.commit()
            logger.info(f"SimulationRun {run_id} completed successfully.")

        except Exception as e:
            logger.exception(f"Fatal run error in {run_id}: {e}")
            if run:
                run.status = "failed"
                run.error_message = str(e)
                db.commit()
        finally:
            db.close()
