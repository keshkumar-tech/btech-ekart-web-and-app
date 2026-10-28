"""Repair mojibake in seeded review text (em-dash / apostrophes).

The seed script was once piped through a cp1252 stdout, which mangled UTF-8
punctuation into sequences like "a€"" and "a€™". This rewrites the affected
rows with clean ASCII punctuation. Safe to run repeatedly.
"""
from apps.reviews.models import Review

# cp1252-mangled -> intended
REPLACEMENTS = [
    ("\u00e2\u20ac\u201d", " - "),   # em dash
    ("\u00e2\u20ac\u201c", " - "),   # en dash
    ("\u00e2\u20ac\u2122", "'"),     # right single quote
    ("\u00e2\u20ac\u0153", '"'),     # left double quote
    ("\u00e2\u20ac\u009d", '"'),     # right double quote
    ("\u00e2\u20ac\u00a6", "..."),   # ellipsis
]


def clean(text: str) -> str:
    for bad, good in REPLACEMENTS:
        text = text.replace(bad, good)
    return text


fixed = 0
for review in Review.objects.all():
    new_title = clean(review.title or "")
    new_comment = clean(review.comment or "")
    if new_title != (review.title or "") or new_comment != (review.comment or ""):
        review.title = new_title
        review.comment = new_comment
        review.save(update_fields=["title", "comment"])
        fixed += 1

print(f"Mojibake repair complete - {fixed} review(s) fixed.")
