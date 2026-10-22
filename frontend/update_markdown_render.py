import re

with open('src/app/page.js', 'r') as f:
    content = f.read()

# Add import
if 'import ReactMarkdown from "react-markdown";' not in content:
    content = content.replace('import { useRouter } from "next/navigation";', 'import { useRouter } from "next/navigation";\nimport ReactMarkdown from "react-markdown";')

# Add ReactMarkdown component wrapping the string literal inside sx-policy-scroll
# Find `<div className="sx-policy-scroll">`
start_marker = '<div className="sx-policy-scroll">\n                {`'
end_marker = '`}\n              </div>'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    markdown_text = content[start_idx+len(start_marker):end_idx]
    
    replacement = f"""<div className="sx-policy-scroll">
                <ReactMarkdown>{{`{markdown_text}`}}</ReactMarkdown>
              </div>"""
    
    content = content[:start_idx] + replacement + content[end_idx+len(end_marker):]

# Add CSS for markdown elements inside sx-policy-scroll
css_insert = """
        .sx-policy-scroll h1 { font-family: 'Syne', sans-serif; font-size: 24px; color: #115fe8; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #222; padding-bottom: 5px; }
        .sx-policy-scroll h2 { font-family: 'Syne', sans-serif; font-size: 18px; color: #0d4fd0; margin-top: 15px; margin-bottom: 8px; }
        .sx-policy-scroll p { font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.7; color: #bbb; margin-bottom: 15px; }
        .sx-policy-scroll ul { font-family: 'Inter', sans-serif; font-size: 13px; color: #bbb; margin-bottom: 15px; padding-left: 20px; }
        .sx-policy-scroll li { margin-bottom: 5px; }
        .sx-policy-scroll strong { color: #fff; }
        .sx-policy-scroll hr { border: none; border-top: 1px solid #333; margin: 20px 0; }
"""

if '.sx-policy-scroll h1' not in content:
    # Insert CSS after .sx-policy-scroll::-webkit-scrollbar-thumb { ... }
    scroll_css_end = content.find('.sx-policy-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }')
    if scroll_css_end != -1:
        insert_pos = scroll_css_end + len('.sx-policy-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }')
        content = content[:insert_pos] + css_insert + content[insert_pos:]

with open('src/app/page.js', 'w') as f:
    f.write(content)
print("Updated page.js to use ReactMarkdown")
