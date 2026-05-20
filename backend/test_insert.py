from db.supabase import supabase

data = supabase.table("documents").insert({
    "title": "Test Paper",
    "file_name": "test.pdf",
    "full_text": "Hello world"
}).execute()

print(data)