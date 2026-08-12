from src.articles import service


def test_normalize_concept_applies_alias_mapping() -> None:
    assert service._normalize_concept("React.js") == "react"
    assert service._normalize_concept("  타입스크립트 배우기  ") == "typescript"


def test_resolve_concept_candidates_reuses_similar_existing_norm() -> None:
    root_label, root_norm, concept_labels = service.resolve_concept_candidates(
        root_concept_label="Type Script",
        concepts=["TypeScript", "FastAPI", "Type Script Tutorial"],
        existing_norms=["typescript"],
        max_candidates=2,
    )

    assert root_label == "typescript"
    assert root_norm == "typescript"
    assert concept_labels == ["typescript", "fastapi"]
