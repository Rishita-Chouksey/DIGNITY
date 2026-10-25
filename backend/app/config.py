from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    database_url: str = 'postgresql+psycopg://dignity:dignity@localhost:5433/dignity'
    admin_token: str = 'change-me-for-demo'
    llm_provider: str = 'none'
    openai_api_key: str | None = None
    embeddings_enabled: bool = False
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')
settings = Settings()
