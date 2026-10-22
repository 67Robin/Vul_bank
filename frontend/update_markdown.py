import re

with open('src/app/page.js', 'r') as f:
    content = f.read()

# Find the block
start_marker = '<p>\n               # StellarX'
end_marker = '              </p>\n              <div className="sx-modal-actions">'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    markdown_text = content[start_idx+4:end_idx].strip()
    
    # We will format this into a raw string wrapped in a terminal-like box, keeping the markdown!
    # Because doing perfect markdown-to-html in a simple script is buggy (lists, etc).
    
    # But wait, we can just replace the <p> with a <div> that has pre-wrap and nice styling.
    
    replacement = """
              <div className="sx-policy-scroll">
                {`""" + markdown_text.replace('`', '\\`') + """`}
              </div>
              <div className="sx-modal-actions">
"""
    
    new_content = content[:start_idx] + replacement + content[end_idx+len(end_marker):]
    
    # Also add the CSS for sx-policy-scroll
    css_insert = """
        .sx-policy-scroll {
          max-height: 50vh;
          overflow-y: auto;
          background: #0a0a0a;
          border: 1px solid #222;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 25px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          line-height: 1.6;
          color: #a0a0a0;
          white-space: pre-wrap;
        }
        .sx-policy-scroll::-webkit-scrollbar { width: 6px; }
        .sx-policy-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
"""
    
    # Insert CSS before `      `}</style>`
    style_end = new_content.rfind('      `}</style>')
    if style_end != -1:
        new_content = new_content[:style_end] + css_insert + new_content[style_end:]
        
    with open('src/app/page.js', 'w') as f:
        f.write(new_content)
    print("Successfully updated page.js")
else:
    print("Could not find the markdown block")
