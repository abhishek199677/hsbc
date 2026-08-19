from dataclasses import dataclass, field


@dataclass
class ClientJDConfig:
    client_name: str
    job_title: str
    full_jd: str
    must_have_skills: list[str]
    nice_to_have_skills: list[str]
    experience_min: int
    experience_max: int
    mandatory_requirements: list[str] = field(default_factory=list)
    domain_requirements: list[str] = field(default_factory=list)


CLIENT_JDS: dict[str, ClientJDConfig] = {
    "VIRTUSA_ML_ENGINEER": ClientJDConfig(
        client_name="Virtusa",
        job_title="Machine Learning Engineer",
        full_jd="""We are seeking an experienced Machine Learning Engineer to design, develop, and deploy production-grade GenAI and Agentic AI solutions. The ideal candidate has strong Python engineering skills, hands-on experience building AI agents and orchestration frameworks, and proven expertise in deploying scalable cloud-native applications.

Key Responsibilities
- Design, develop, test, and deploy production-ready Agentic AI and GenAI services.
- Build and maintain AI agent workflows using frameworks such as LangGraph, Pydantic AI, AG2, LangChain, or similar technologies.
- Develop scalable APIs and microservices using FastAPI and related frameworks.
- Implement containerized solutions using Docker and support deployment across cloud environments.
- Collaborate with data scientists, product owners, and business stakeholders to translate requirements into robust AI solutions.
- Establish engineering best practices, including code reviews, testing, CI/CD pipelines, and Git-based development workflows.
- Monitor, troubleshoot, and optimize AI applications to ensure reliability, performance, and scalability.
- Create clear technical documentation and maintain high-quality, maintainable code.

Required Qualifications
- 5-10 years of software engineering, machine learning engineering, or AI engineering experience.
- Strong proficiency in Python and modern software engineering principles.
- Hands-on experience developing and deploying GenAI, Agentic AI, or LLM-powered applications.
- Experience with agent orchestration frameworks such as LangGraph, Pydantic AI, AG2, AutoGen, CrewAI, or similar technologies.
- Solid understanding of Retrieval-Augmented Generation (RAG), prompt engineering, tool calling, agent memory, and multi-agent architectures.
- Experience building RESTful APIs using FastAPI or equivalent frameworks.
- Strong experience with Docker, containerization, and cloud-native application development.
- Familiarity with Azure services, including Azure OpenAI, Azure AI Foundry, Azure ML, Azure Functions, App Services, or similar platforms.
- Experience implementing CI/CD pipelines and Git-based development workflows.
- Strong debugging, problem-solving, and performance optimization skills.
- Excellent communication and collaboration skills within cross-functional teams.""",
        must_have_skills=[
            "Python", "GenAI", "Agentic AI", "LLM", "LangGraph",
            "LangChain", "FastAPI", "Docker", "Azure", "RAG", "CI/CD",
        ],
        nice_to_have_skills=[
            "Pydantic AI", "AG2", "AutoGen", "CrewAI", "Kubernetes",
            "Azure OpenAI", "Azure ML", "prompt engineering", "multi-agent architectures",
        ],
        experience_min=5,
        experience_max=10,
        mandatory_requirements=[
            "Hands-on experience developing and deploying GenAI, Agentic AI, or LLM-powered applications",
            "Experience with agent orchestration frameworks (LangGraph, Pydantic AI, AG2, AutoGen, CrewAI)",
            "Solid understanding of RAG, prompt engineering, tool calling, agent memory",
        ],
    ),

    "IBM_DATA_ENGINEER": ClientJDConfig(
        client_name="IBM",
        job_title="Senior Data Engineer",
        full_jd="""IBM is seeking a Senior Data Engineer to join our data platform team. You will design and build scalable data pipelines, work with large-scale distributed systems, and enable data-driven decision-making across the organization.

Key Responsibilities
- Design, build, and maintain scalable ETL/ELT pipelines using modern data frameworks.
- Work with cloud-based data platforms (AWS/GCP/Azure) and ensure data availability.
- Develop and optimize data models, data warehouses, and data lakes.
- Implement data quality frameworks and monitoring solutions.
- Collaborate with data scientists and analysts to enable self-service analytics.
- Ensure data governance, security, and compliance with organizational policies.

Required Qualifications
- 5-8 years of experience in data engineering or related fields.
- Strong proficiency in SQL and Python.
- Experience with Apache Spark, Apache Kafka, and distributed computing.
- Hands-on experience with cloud data services (AWS Glue, Redshift, S3 or GCP BigQuery, Dataflow or Azure Data Factory, Synapse).
- Experience with data modeling and warehouse design (Star Schema, Snowflake).
- Proficiency with workflow orchestration tools (Airflow, Prefect, or Dagster).
- Experience with data quality and testing frameworks.
- Strong understanding of data governance and security best practices.""",
        must_have_skills=[
            "SQL", "Python", "Apache Spark", "Apache Kafka", "ETL",
            "Data Modeling", "Cloud Data Services", "Airflow",
        ],
        nice_to_have_skills=[
            "AWS Glue", "Redshift", "BigQuery", "Azure Data Factory",
            "Dagster", "Prefect", "dbt", "Data Governance",
        ],
        experience_min=5,
        experience_max=8,
        mandatory_requirements=[
            "Experience with Apache Spark and Apache Kafka",
            "Hands-on experience with cloud data services",
            "Experience with data modeling and warehouse design",
        ],
    ),

    "HSBC_BACKEND_DEVELOPER": ClientJDConfig(
        client_name="HSBC",
        job_title="Senior Backend Developer",
        full_jd="""HSBC is looking for a Senior Backend Developer to join our digital banking platform team. You will build and maintain high-performance, secure backend services that power our customer-facing banking applications.

Key Responsibilities
- Design and develop RESTful microservices using Java/Spring Boot or .NET.
- Build and maintain APIs serving millions of daily transactions.
- Implement security best practices for financial services (OAuth, encryption, PCI compliance).
- Work with relational databases (PostgreSQL, Oracle) and NoSQL databases (MongoDB, Redis).
- Participate in code reviews and mentor junior developers.
- Collaborate with frontend teams and DevOps to ensure seamless deployments.
- Monitor application performance and resolve production issues.

Required Qualifications
- 6-10 years of backend development experience.
- Strong proficiency in Java with Spring Boot OR C# with .NET Core.
- Experience building microservices architectures in regulated industries.
- Hands-on experience with PostgreSQL, Oracle, or similar RDBMS.
- Experience with message queues (RabbitMQ, Kafka, or IBM MQ).
- Understanding of banking/financial services domain and compliance requirements (PCI-DSS, SOX).
- Experience with Docker and Kubernetes.
- Strong understanding of RESTful API design and versioning.
- Experience with CI/CD pipelines and Git-based workflows.""",
        must_have_skills=[
            "Java", "Spring Boot", "Microservices", "PostgreSQL",
            "Docker", "Kubernetes", "REST API", "CI/CD",
        ],
        nice_to_have_skills=[
            ".NET Core", "Oracle", "MongoDB", "Redis", "RabbitMQ",
            "Kafka", "IBM MQ", "PCI-DSS", "OAuth",
        ],
        experience_min=6,
        experience_max=10,
        domain_requirements=[
            "Banking/financial services domain experience",
            "Understanding of PCI-DSS compliance",
            "Experience with regulated industry environments",
        ],
        mandatory_requirements=[
            "Strong proficiency in Java with Spring Boot OR C# with .NET Core",
            "Experience building microservices architectures in regulated industries",
            "Understanding of banking/financial services domain and compliance requirements",
        ],
    ),

    "GEL_FRONTEND_DEVELOPER": ClientJDConfig(
        client_name="Gel Company",
        job_title="Senior Frontend Developer",
        full_jd="""Gel Company is seeking a Senior Frontend Developer to build modern, responsive web applications. You will work closely with UX designers and backend engineers to deliver exceptional user experiences.

Key Responsibilities
- Build responsive, accessible web applications using React or Next.js.
- Implement state management solutions (Redux, Zustand, or Context API).
- Write clean, reusable, and well-tested components.
- Optimize application performance (Core Web Vitals, lazy loading, code splitting).
- Integrate with RESTful APIs and GraphQL endpoints.
- Collaborate with designers to implement pixel-perfect UI.
- Mentor junior developers and conduct code reviews.

Required Qualifications
- 4-7 years of frontend development experience.
- Strong proficiency in JavaScript/TypeScript and React.
- Experience with Next.js or similar SSR frameworks.
- Proficiency with CSS-in-JS solutions (Styled Components, Tailwind CSS, or Emotion).
- Experience with state management libraries (Redux, Zustand, MobX).
- Understanding of web accessibility standards (WCAG 2.1).
- Experience with testing frameworks (Jest, React Testing Library, Cypress).
- Familiarity with CI/CD pipelines and modern build tools.""",
        must_have_skills=[
            "JavaScript", "TypeScript", "React", "Next.js", "CSS",
            "REST API", "Jest",
        ],
        nice_to_have_skills=[
            "Redux", "Zustand", "Tailwind CSS", "GraphQL", "Cypress",
            "WCAG", "Storybook", "Vite",
        ],
        experience_min=4,
        experience_max=7,
        mandatory_requirements=[
            "Strong proficiency in JavaScript/TypeScript and React",
            "Experience with Next.js or similar SSR frameworks",
        ],
    ),

    "GINGERSOFT_FULLSTACK": ClientJDConfig(
        client_name="Gingersoft",
        job_title="Full Stack Developer",
        full_jd="""Gingersoft is looking for a Full Stack Developer to work on our SaaS product platform. You will handle both frontend and backend development, building features from concept to deployment.

Key Responsibilities
- Develop full-stack features using Node.js/Express and React/Angular.
- Design and implement RESTful APIs and WebSocket connections.
- Work with MongoDB and PostgreSQL databases.
- Deploy applications using Docker and AWS/Azure.
- Write unit and integration tests.
- Participate in agile ceremonies and sprint planning.
- Troubleshoot production issues and implement fixes.

Required Qualifications
- 3-6 years of full-stack development experience.
- Proficiency in Node.js with Express.js or NestJS.
- Experience with React or Angular for frontend development.
- Hands-on experience with MongoDB and PostgreSQL.
- Familiarity with cloud platforms (AWS or Azure).
- Experience with Docker and basic DevOps practices.
- Understanding of authentication mechanisms (JWT, OAuth).
- Good problem-solving and communication skills.""",
        must_have_skills=[
            "Node.js", "Express.js", "React", "MongoDB", "PostgreSQL",
            "Docker", "REST API", "JavaScript",
        ],
        nice_to_have_skills=[
            "NestJS", "Angular", "AWS", "Azure", "WebSocket",
            "JWT", "OAuth", "TypeScript",
        ],
        experience_min=3,
        experience_max=6,
        mandatory_requirements=[
            "Proficiency in Node.js with Express.js or NestJS",
            "Experience with React or Angular for frontend development",
        ],
    ),
}


def get_client_jd(client_name: str, job_title: str | None = None) -> ClientJDConfig | None:
    normalized = client_name.lower().strip()
    for config in CLIENT_JDS.values():
        config_client = config.client_name.lower()
        if normalized in config_client or config_client in normalized:
            if job_title:
                normalized_title = job_title.lower().strip()
                config_title = config.job_title.lower()
                if normalized_title in config_title or config_title in normalized_title:
                    return config
            else:
                return config
    return None


def list_clients() -> list[dict[str, str]]:
    return [
        {"client": c.client_name, "job_title": c.job_title, "key": k}
        for k, c in CLIENT_JDS.items()
    ]
