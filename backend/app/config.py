from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://esthe_user:esthe_password@db:5432/esthe_map"

    # Google APIs
    google_places_api_key: str = ""
    google_maps_api_key: str = ""

    # Gemini API
    gemini_api_key: str = ""

    # Apify API (Google Reviews Scraper)
    apify_api_token: str = ""

    # Application
    env: str = "development"
    debug: bool = True

    # API Settings
    api_v1_prefix: str = "/api/v1"

    # Places API Settings
    places_api_base_url: str = "https://places.googleapis.com/v1"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
