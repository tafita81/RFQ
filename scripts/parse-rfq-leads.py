#!/usr/bin/env python3
"""
Parse RFQ leads from uploaded files with better CSV handling
"""

import re
import json
import csv
from pathlib import Path

upload_dir = Path('/home/ubuntu/upload')
output_dir = Path('/home/ubuntu/leads-dashboard/data')
output_dir.mkdir(exist_ok=True)

# Read all files
all_content = ''
files = [
    'Pasted_content.txt',
    'Pasted_content_01.txt',
    'Pasted_content_02.txt',
    'Pasted_content_03.txt',
    'Pasted_content_04.txt',
    'Pasted_content_05.txt'
]

print('🔍 Reading uploaded files...\n')
for filename in files:
    filepath = upload_dir / filename
    if filepath.exists():
        content = filepath.read_text(encoding='utf-8')
        all_content += content + '\n'
        print(f'✅ Read {filename} ({len(content) // 1024} KB)')

# Extract leads using regex for CSV lines
print('\n📊 Extracting leads...\n')

# Pattern: number,text,text,date,description,email,phone,url,category,leverage
pattern = r'^(\d+),([^,]+),([^,]+),(\d{2}/\d{2}/\d{4}),"([^"]+)",([^,]+),([^,]+),(https?://[^,]+),([^,]+),(.+)$'

leads = []
for line in all_content.split('\n'):
    line = line.strip()
    if not line or not line[0].isdigit():
        continue
    
    # Try to match the pattern
    match = re.match(pattern, line)
    if match:
        lead = {
            'id': int(match.group(1)),
            'title': match.group(2).strip(),
            'source': match.group(3).strip(),
            'postedDate': match.group(4),
            'description': match.group(5).strip(),
            'contactEmail': match.group(6).strip(),
            'contactPhone': match.group(7).strip(),
            'proofLink': match.group(8).strip(),
            'category': match.group(9).strip(),
            'brokerLeverage': match.group(10).strip()
        }
        leads.append(lead)
        print(f'✅ Lead {lead["id"]}: {lead["title"][:50]}...')

print(f'\n✅ Extracted {len(leads)} leads\n')

# Save to JSON
json_file = output_dir / 'rfq-leads.json'
with open(json_file, 'w', encoding='utf-8') as f:
    json.dump(leads, f, indent=2, ensure_ascii=False)
print(f'💾 Saved to {json_file}')

# Save to CSV
csv_file = output_dir / 'rfq-leads.csv'
if leads:
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=leads[0].keys())
        writer.writeheader()
        writer.writerows(leads)
    print(f'💾 Saved to {csv_file}')

# Show statistics
print('\n📈 Statistics:')
print(f'Total leads: {len(leads)}')

categories = {}
for lead in leads:
    cat = lead['category']
    categories[cat] = categories.get(cat, 0) + 1

print('\nBy category:')
for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
    print(f'  {cat}: {count} leads')

print('\n✅ Extraction completed!')
