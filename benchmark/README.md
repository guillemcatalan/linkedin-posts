# Benchmark Posts

Posts de referencia que definen el estilo objetivo. El sistema los usa como few-shot examples para Claude.

## Cómo añadir posts

Edita `reference_posts.json` y añade un objeto por cada post:

```json
{
  "id": "unique-id",
  "text": "El texto completo del post tal cual aparece en LinkedIn",
  "author": "Nombre del autor",
  "source": "enginy / factorial / other",
  "why_its_good": "Por qué este post es buena referencia",
  "tags": ["hook", "storytelling", "CTA", "humor", "data"]
}
```

## Tags disponibles

- `hook` — buen hook que engancha
- `storytelling` — buena narrativa / story arc
- `CTA` — call to action específico y bueno
- `humor` — humor bien usado
- `data` — usa datos/números de forma efectiva
- `personal` — tono personal auténtico
- `short` — post corto y efectivo
