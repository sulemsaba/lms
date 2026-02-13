from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_with_tenant, require_permission
from app.models.iam import User
from app.services.venue import VenueService

router = APIRouter()


@router.get("/route-preview")
async def route_preview(
    from_venue_id: str,
    to_venue_id: str,
    db: AsyncSession = Depends(get_db_with_tenant),
    current_user: User = Depends(require_permission("map.read")),
) -> dict:
    route = await VenueService(db).get_route(current_user.institution_id, from_venue_id, to_venue_id)
    return {
        "from_venue_id": str(route.from_venue_id),
        "to_venue_id": str(route.to_venue_id),
        "polyline": route.polyline,
        "distance_m": route.distance_m,
        "duration_sec": route.duration_sec,
    }
