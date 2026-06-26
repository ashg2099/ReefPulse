import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import litellm

_original_completion = litellm.completion

def _patched_completion(**kwargs):
    if "messages" in kwargs:
        for msg in kwargs["messages"]:
            msg.pop("cache_breakpoint", None)
            msg.pop("cache_control", None)
    return _original_completion(**kwargs)

litellm.completion = _patched_completion
litellm.drop_params = True

from crewai import Crew, Process
from agents.reef_agents import data_collector_agent, rag_analyst_agent, health_assessor_agent
from agents.reef_tasks import create_data_collection_task, create_rag_analysis_task, create_health_assessment_task
from tools.reef_data_aggregator import get_reef_snapshot

def run_reef_analysis(lat: float = -18.0, lon: float = 147.0) -> dict:
    print(f"\n🪸 Starting ReefPulse analysis for ({lat}, {lon})...\n")

    # Fetch live data
    snapshot = get_reef_snapshot(lat, lon)

    # Create agents
    collector = data_collector_agent()
    analyst = rag_analyst_agent()
    assessor = health_assessor_agent()

    # Create tasks
    task1 = create_data_collection_task(snapshot)
    task2 = create_rag_analysis_task(snapshot)
    task3 = create_health_assessment_task()

    # Assign agents to tasks
    task1.agent = collector
    task2.agent = analyst
    task3.agent = assessor

    # Build and run crew
    crew = Crew(
        agents=[collector, analyst, assessor],
        tasks=[task1, task2, task3],
        process=Process.sequential,
        verbose=True
    )

    result = crew.kickoff()

    return {
        "location": snapshot["location"],
        "snapshot": snapshot,
        "analysis": str(result)
    }

if __name__ == "__main__":
    import json
    result = run_reef_analysis()
    print("\n" + "="*60)
    print("FINAL REPORT:")
    print("="*60)
    print(result["analysis"])