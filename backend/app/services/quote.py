from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student_success import Quote, UserQuoteHistory


class QuoteService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def quote_of_the_day(self, institution_id, user_id=None):
        today = date.today()
        quotes_stmt = select(Quote).where(Quote.institution_id == institution_id, Quote.active.is_(True)).order_by(Quote.id)
        quotes = (await self.db.execute(quotes_stmt)).scalars().all()
        if not quotes:
            return None

        index = (today.toordinal() + int(str(institution_id.int)[:6])) % len(quotes)
        quote = quotes[index]

        quote.times_used += 1
        if user_id is not None:
            history = UserQuoteHistory(
                institution_id=institution_id,
                created_by=user_id,
                user_id=user_id,
                quote_id=quote.id,
                served_on=today,
            )
            self.db.add(history)

        await self.db.commit()
        await self.db.refresh(quote)
        return quote
