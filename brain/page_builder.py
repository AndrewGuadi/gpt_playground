

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

