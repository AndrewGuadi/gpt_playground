import os
from dir_tools.file_utils import FileUtils

def field_html(field):
    # Short label = first phrase before ":", "?" or max 7 words
    label_txt = field.question
    short_label = label_txt.split(":")[0][:40]
    name = short_label.lower().replace(" ", "_").replace("?", "").replace("/", "_")
    placeholder = field.question if len(field.question) > 40 else ""
    # Use textarea if question is long or field_type is 'paragraph', 'list', or 'object'
    use_textarea = field.html_input_field_type in ['paragraph', 'list', 'object'] or len(field.question) > 70
    if field.html_input_field_type == 'file':
        input_html = f'<input type="file" name="{name}">'
    elif use_textarea:
        input_html = f'<textarea name="{name}" placeholder="{placeholder}"></textarea>'
    else:
        input_html = f'<input type="text" name="{name}" placeholder="{placeholder}">'
    return f'<div class="form-group"><label>{short_label}</label><br>{input_html}</div>\n'


def generate_html_form(forms, title="Client Questionnaire"):
    html_parts = ["""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{}</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 2rem; }}
    .form-group {{ margin-bottom: 1.25rem; }}
    label {{ font-weight: bold; }}
    input, textarea {{ width: 100%; padding: 0.5rem; }}
    h3 {{ margin-top: 2rem; color: #234; }}
  </style>
</head>
<body>
  <h2>{}</h2>
  <form method="post" enctype="multipart/form-data">""".format(title, title)]
    for form in forms:
        html_parts.append(f'<h3>{form.formTitle}</h3>')
        for f in form.userForm:
            html_parts.append(field_html(f))
    html_parts.append('<button type="submit">Submit</button></form></body></html>')
    return "\n".join(html_parts)


def create_project_documentation(gpt, project_dir, project_filepath):
    document_details = {
        "document_title": str,
        "document_text":  str
    }
    document_outline = gpt.create_pydantic_model("document_outline", document_details)
    # we want to read into the file the list of documents, probably a list to iterate through, but grab dynamically
    CURRENT_DIR = os.path.dirname(__file__)         # directory where this file is
    BASE_DIR = os.path.dirname(CURRENT_DIR)
    questionaire_filepath = os.path.join(BASE_DIR, 'resources', project_dir, project_filepath)
    user_questionaire = FileUtils.read_file(questionaire_filepath)

    information_outline_path = os.path.join(BASE_DIR, 'resources', 'templates', 'document_outline.json')
    information_outline = FileUtils.read_json(information_outline_path)

    for item in information_outline:
        print(item)
        prompt = f"Using the user questionaire only: {user_questionaire}.\n\n, We must complete the following information: {item['document_title']}\n\n with the following details: {item['details']}"
        document_list = gpt.structured_response(prompt, document_outline)
        # we want to call a generator that generates the document in its completion and then writes it the the correct local client directory
            # we iterate until each document is written.

        new_path = os.path.join(BASE_DIR, 'resources', project_dir, 'project-documents', document_list.document_title+".txt")
        FileUtils.write_file(new_path, document_list.document_text)
        print(document_list.document_title)
        print(document_list.document_text)
