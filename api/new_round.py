import random
import json

SYMBOLS = ["★", "●", "■", "▲", "♥", "✦"]
COLORS = ["#ff4d4d", "#4d94ff", "#ffd24d", "#32c48d", "#cc5cff", "#ff7f3f"]


def make_round(difficulty: float) -> dict:
    difficulty = max(1.0, min(difficulty, 8.0))
    grid_size = 16
    target_symbol = random.choice(SYMBOLS)
    target_color = random.choice(COLORS)
    distractor_symbol = random.choice([s for s in SYMBOLS if s != target_symbol])
    distractor_color = random.choice([c for c in COLORS if c != target_color])

    min_targets = 3
    extra_targets = int(max(0, difficulty - 1))
    target_count = min(6, min_targets + extra_targets + random.randint(0, 2))
    target_count = min(target_count, grid_size - 4)

    tile_data = []
    all_positions = list(range(grid_size))
    random.shuffle(all_positions)

    target_positions = set(all_positions[:target_count])
    for index in range(grid_size):
        if index in target_positions:
            tile_data.append({
                "id": f"tile-{index}",
                "symbol": target_symbol,
                "color": target_color,
                "isTarget": True
            })
        else:
            symbol = random.choice([s for s in SYMBOLS if s != target_symbol])
            color = random.choice([c for c in COLORS if c != target_color])
            tile_data.append({
                "id": f"tile-{index}",
                "symbol": symbol,
                "color": color,
                "isTarget": False
            })

    random.shuffle(tile_data)

    time_limit = max(8, 14 - int(difficulty * 1.5))
    bonus = max(10, int(15 + difficulty * 2))

    tone = random.choice([
        f"Tap every {target_symbol} fast!",
        f"Find all {target_symbol} tiles before time runs out.",
        f"Collect the {target_symbol} icons and avoid the others.",
        f"Only {target_symbol} matters this round. Stay sharp!"
    ])

    return {
        "roundId": random.randint(100000, 999999),
        "targetSymbol": target_symbol,
        "targetColor": target_color,
        "targetCount": target_count,
        "gridSize": grid_size,
        "tiles": tile_data,
        "timeLimit": time_limit,
        "pointsPerHit": bonus,
        "hint": tone,
        "difficulty": difficulty
    }


def handler(request):
    query = request.args if hasattr(request, "args") else {}
    difficulty_input = query.get("difficulty") or query.get("score") or "1"
    try:
        difficulty = float(difficulty_input)
    except ValueError:
        difficulty = 1.0

    difficulty = max(1.0, min(difficulty, 8.0))
    payload = make_round(difficulty)
    return (json.dumps(payload), 200, {"Content-Type": "application/json"})
