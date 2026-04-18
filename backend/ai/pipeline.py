from ai.parser import (
    classify,
    generate_concept_map,
    generate_data_sketch,
    generate_explanation,
    generate_timeline,
    generate_comparison,
    generate_process_flow,
    generate_argument_tree,
)

async def process_highlight(text, context=None):
    task_type = await classify(text)
    explanation = await generate_explanation(text)

    if task_type == "data_sketch":
        visual = await generate_data_sketch(text)

    elif task_type == "timeline":
        visual = await generate_timeline(text)

    elif task_type == "comparison":
        visual = await generate_comparison(text)

    elif task_type == "process":
        visual = await generate_process_flow(text)

    elif task_type == "argument":
        visual = await generate_argument_tree(text)

    else:
        visual = await generate_concept_map(text, context)

    # 🔥 ADD IT HERE (RETURN BLOCK)
    return {
        "type": task_type,
        "explanation": explanation,
        "visual": visual,
        "insight": f"This was classified as '{task_type}' because the text structure suggests this is the most informative visualization."
    }