from typing import Optional
from pydantic import BaseModel

class Request(BaseModel):
    """
    Defines request object.
    """
    handler: Optional[str] = None
    data: list
