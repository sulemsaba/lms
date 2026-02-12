from uuid import UUID

from pydantic import BaseModel


class VenueRead(BaseModel):
    id: UUID
    name: str
    campus: str
    building: str | None
    floor: str | None
    capacity: int | None
    gps_lat: float
    gps_lng: float

    model_config = {"from_attributes": True}


class RouteResponse(BaseModel):
    from_venue_id: UUID
    to_venue_id: UUID
    polyline: str
    distance_m: float
    duration_sec: int
    travel_mode: str
