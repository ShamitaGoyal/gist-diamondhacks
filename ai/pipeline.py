from ai.parser import classify, generate_concept_map, generate_data_sketch, generate_explanation

async def process_highlight(text, context=None):
    task_type = await classify(text)

    explanation = await generate_explanation(text)

    if "data" in task_type:
        visual = await generate_data_sketch(text)
    else:
        visual = await generate_concept_map(text, context)

    return {
        "type": task_type,
        "explanation": explanation,
        "visual": visual
    }
