from pydantic import BaseModel


class TaskPayload(BaseModel):
    task_type: str
    data: dict[str, object]
