from crewai import Agent, LLM

def get_llm():
    return LLM(
        model = "groq/llama-3.3-70b-versatile",
        temperature = 0.3
    )
    
def data_collector_agent():
    return Agent(
        role = "Reef Data Collector",
        goal = "Gather real-time environmental data from all available sensors and APIs for the specified reef location",
        backstory="""You are a marine data specialist with expertise in oceanographic 
        sensor networks. You collect and validate data from satellite systems, 
        weather stations, and ocean buoys monitoring the Great Barrier Reef.""",
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )

def rag_analyst_agent():
    return Agent(
        role="Reef Science Analyst",
        goal="Query the reef knowledge base to provide scientific context and interpretation for current reef conditions",
        backstory="""You are a coral reef scientist with deep knowledge of bleaching 
        events, thermal stress, water quality impacts, and GBR ecosystem dynamics. 
        You use scientific literature and historical data to interpret current conditions.""",
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )

def health_assessor_agent():
    return Agent(
        role="Reef Health Assessor",
        goal="Synthesise sensor data and scientific context to produce an overall reef health assessment with risk level and recommendations",
        backstory="""You are a senior reef manager with 20 years of experience 
        assessing Great Barrier Reef health for GBRMPA. You combine real-time data 
        with scientific knowledge to make clear, actionable assessments that 
        non-scientists can understand.""",
        llm=get_llm(),
        verbose=True,
        allow_delegation=False
    )