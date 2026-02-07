# API Contracts

This directory contains API contracts created by PM Agent and referenced by backend/frontend/mobile agents.

## Usage

### PM Agent (Author)
Create API contracts here during planning phase:
```
write_memory("api-contracts/{domain}.md", contract content)
```

Or create files directly in this directory if Serena is not available.

### Backend Agent (Implementer)
Read contracts and implement exactly as specified:
```
read_memory("api-contracts/{domain}.md")
```

### Frontend / Mobile Agent (Consumer)
Read contracts and integrate API client exactly as specified:
```
read_memory("api-contracts/{domain}.md")
```

## Contract Format

```markdown
# {Domain} API Contract

## POST /api/{resource}
- **Auth**: Required (JWT Bearer)
- **Request Body**:
  ```json
  { "field": "type", "field2": "type" }
  ```
- **Response 200**:
  ```json
  { "id": "uuid", "field": "value", "created_at": "ISO8601" }
  ```
- **Response 401**: `{ "detail": "Not authenticated" }`
- **Response 422**: `{ "detail": [{ "field": "error message" }] }`
```

## Rules
1. PM Agent must create during planning
2. Backend Agent must not implement differently from contract
3. Frontend/Mobile Agent defines types based on contract
4. If changes needed, request re-planning from PM Agent
