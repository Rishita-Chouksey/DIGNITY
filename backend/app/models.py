import uuid
from datetime import datetime, date
from sqlalchemy import String, Integer, Numeric, DateTime, Date, ForeignKey, CheckConstraint, Text
from sqlalchemy.types import UserDefinedType
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base
class Vector384(UserDefinedType):
    """PostgreSQL pgvector type, kept dependency-free for Supabase/Neon compatibility."""
    cache_ok=True
    def get_col_spec(self, **kw): return 'vector(384)'
class Category(Base):
    __tablename__='categories'; id: Mapped[uuid.UUID]=mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4); name: Mapped[str]=mapped_column(String, unique=True); description: Mapped[str|None]=mapped_column(Text)
class Scheme(Base):
    __tablename__='schemes'; __table_args__=(CheckConstraint("verification_status IN ('verified','verification_due')"),)
    id: Mapped[uuid.UUID]=mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4); scheme_name: Mapped[str]=mapped_column(String); description: Mapped[str]=mapped_column(Text); description_embedding: Mapped[str|None]=mapped_column(Vector384); category: Mapped[str|None]=mapped_column(ForeignKey('categories.name')); state: Mapped[str]=mapped_column(String)
    min_age: Mapped[int|None]=mapped_column(Integer); max_age: Mapped[int|None]=mapped_column(Integer); occupation: Mapped[str|None]=mapped_column(String); education_level: Mapped[str|None]=mapped_column(String); income_limit: Mapped[float|None]=mapped_column(Numeric); gender: Mapped[str|None]=mapped_column(String); special_category: Mapped[str|None]=mapped_column(String)
    eligibility_conditions: Mapped[dict]=mapped_column(JSONB, default=dict); required_documents: Mapped[list]=mapped_column(JSONB, default=list); benefits: Mapped[str|None]=mapped_column(Text); application_deadline: Mapped[date|None]=mapped_column(Date); official_url: Mapped[str]=mapped_column(Text); source_name: Mapped[str|None]=mapped_column(String); last_verified: Mapped[datetime|None]=mapped_column(DateTime); verification_status: Mapped[str]=mapped_column(String, default='verification_due'); created_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow); updated_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
class SearchQuery(Base):
    __tablename__='search_queries'; id: Mapped[uuid.UUID]=mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4); raw_text: Mapped[str]=mapped_column(Text); extracted_profile: Mapped[dict]=mapped_column(JSONB, default=dict); need_embedding: Mapped[str|None]=mapped_column(Vector384); top_results: Mapped[list]=mapped_column(JSONB, default=list); created_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow)
