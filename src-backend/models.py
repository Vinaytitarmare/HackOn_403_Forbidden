from pydantic import BaseModel, UUID4, AwareDatetime, JsonValue


class DBFile(BaseModel):
    id: UUID4 | None
    created_at: AwareDatetime
    status: str
    location: str
    text: str | None
    summary: str | None
    metadata: JsonValue