# EventCard

A poster-style card: a neon poster with a big emoji and an optional sticker on top, then the title, date and time, location, host, and an avatar stack of who's going.

- `tone` sets the poster fill (pop by default). Vary tones across a list so a feed looks like a wall of flyers.
- `sticker` puts a tilted badge on the poster ("Hosting", "NEW", "🔥 Hot"). It defaults to zap, or sun when the poster is zap.
- `going` is a sample of people for the avatars. Pass `goingCount` for the real total so the "+N" and the caption match.
- Children render in an actions row at the bottom, usually one `sm` primary button plus a secondary.
- **The page provides:** real poster images later, if wanted. Put a blurred copy behind the card with `blur-heavy` to keep the glass feel.
- The pattern also works beyond events: a person card (poster = avatar color, title = name, meta = role and company) or an opportunity card.
