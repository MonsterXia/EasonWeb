"""Reduce a pinned CEP game-data checkout to factual cultivation tables.
Usage: python3 scripts/import-endfield-growth.py /path/to/cep /path/to/CharGrowthTable.json
No upstream application code is evaluated or copied.
"""
import hashlib
import json
import pathlib
import subprocess
import sys

root = pathlib.Path(sys.argv[1])
visual_table_path = pathlib.Path(sys.argv[2])
visual_table_hash = hashlib.sha256(visual_table_path.read_bytes()).hexdigest()
if visual_table_hash != '8a6bad97c01bf74243f64e5acd4412fdf03946aa0309fdf5f1ffdbf749a81202':
    raise SystemExit('Review the pinned CharGrowthTable before importing visual metadata.')
visual_table = json.loads(visual_table_path.read_text())
revision = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()
expected = '286962b95408078ca91c99dece748d74166e74b1'
if revision != expected:
    raise SystemExit('Review the upstream version and update the pinned revision before importing.')

def generated(path):
    text = (root / path).read_text()
    return json.JSONDecoder().raw_decode(text.split(' = ', 1)[1].strip())[0]

def load(path):
    return json.loads((root / path).read_text())

data = generated('src/generated/data/planner.ts')
translations = {lang: {category: load(f'src/generated/i18n/{category}/{lang}.json') for category in ['characters', 'weapons', 'wikiData']} for lang in ['zh-CN', 'en']}
images = load('public/images/characters/sources.json')

def name(category, key):
    return {lang: translations[lang][category][key] for lang in translations}

catalog_path = pathlib.Path('src/constant/game/hypergryph/endfield/catalog.json')
catalog = json.loads(catalog_path.read_text())
existing_weapons = {entry['id']: entry for entry in catalog['weapons']}

result = {'version': '1.5', 'updatedAt': '2026-10-05', 'characters': [], 'weapons': [], 'materials': {}, 'filters': {}}
for group in ['elements', 'professions', 'weaponTypes']:
    result['filters'][group] = {key: name('wikiData', f'enum|{group}|{key}') for key in load('src/generated/data/wiki/enums.json')[group]}
used = set()

def costs(rows):
    used.update(r[0] for r in rows)
    return rows

for category in ['characters', 'weapons']:
    for summary in generated(f'src/generated/data/wiki/{category}.ts'):
        id = summary['id']
        source = data[category][id]
        entry = {'id': id, 'name': name(category, id), 'rarity': summary['rarity'], 'weaponType': summary['weaponTypeId'], 'levels': [[r['levelUpExp'], r['levelUpGold']] for r in source['levels'] if r['level'] < 90], 'promotions': [], 'equipment': [], 'skills': [], 'nodes': []}
        if category == 'characters':
            wiki = load(f'src/generated/data/wiki/characters/{id}.json')
            visual_nodes = visual_table[id]['talentNodeMap']
            entry['element'] = summary['elementId']
            entry['profession'] = summary['professionId']
            image = images.get('avatar/' + summary['imageId'], {})
            if image.get('url', '').startswith('https://bbs.hycdn.cn/'):
                entry['avatar'] = image['url']
            boundaries = {r['breakStage']: r['level'] for r in source['levels'] if r['isBreakthrough']}
            for promotion in source['promotions']:
                stage = promotion['breakStage']
                mats = list(promotion['materials'])
                entry['promotions'].append({'stage': stage, 'level': boundaries[stage], 'materials': costs(mats)})
            entry['equipment'] = [{'stage': n['breakStage'], 'materials': costs(n['materials'])} for n in source['equipmentNodes']]
            for skill in source['skills']:
                entry['skills'].append({'id': skill['id'], 'name': name('wikiData', f"character|{id}|skill|{skill['id']}|name"), 'type': skill['typeId'], 'icon': 'skill-' + skill['iconId'], 'costs': [costs(r['materials']) for r in skill['materialsByLevel']]})
            for group, key in [('talents', 'talent'), ('attributeNodes', 'attribute'), ('logisticsNodes', 'logistics')]:
                for index, node in enumerate(source[group]):
                    name_id = f"spaceship_skill_{id}_{node['index'] + 1}_{node['level']}" if key == 'logistics' else node['id']
                    nkey = f"character|{id}|{key}|{name_id}|name"
                    names = name('wikiData', nkey) if nkey in translations['zh-CN']['wikiData'] else {'zh-CN': f"后勤技能 {index + 1}", 'en': f'Base skill {index + 1}'}
                    visual = {}
                    if key == 'talent':
                        info = next(v['passiveSkillNodeInfo'] for v in visual_nodes.values() if v['passiveSkillNodeInfo']['talentEffectId'] == node['id'])
                        visual = {'icon': 'skill-' + info['iconId'], 'rank': str(info['level'])}
                    elif key == 'logistics':
                        info = next(v for v in wiki['logisticsSkills'] if v['index'] == node['index'] and v['level'] == node['level'])
                        visual = {'icon': 'logistics-' + info['iconId'], 'rank': names['zh-CN'].rsplit('·', 1)[-1]}
                    else:
                        info = visual_nodes[node['id']]['attributeNodeInfo']
                        attr = {39: 'str', 40: 'agi', 41: 'wisd', 42: 'will'}.get(info['attributeModifiers'][0]['attrType'])
                        visual = {'icon': 'skill-' + info['customIcon'] if info['customIcon'] else 'attribute-' + attr, 'rank': str(node['breakStage'])}
                    entry['nodes'].append({'id': node['id'], 'group': key, 'chain': node['id'].rsplit('_', 1)[0] if key == 'talent' else (f'logistics_{node["index"]}' if key == 'logistics' else node['id']), 'name': names, 'stage': node['breakStage'], 'materials': costs(node['materials']), **visual})
        else:
            existing = existing_weapons.get(id)
            if not existing:
                raise SystemExit(f'Add reviewed essence data to catalog.json for new weapon {id} before importing.')
            if (existing['rarity'], existing['weaponType']) != (entry['rarity'], entry['weaponType']):
                raise SystemExit(f'Review changed shared rarity/type for weapon {id} before importing.')
            entry['essence'] = existing['essence']
            entry['essenceOrder'] = existing['essenceOrder']
            for promotion in source['breakthroughs']:
                entry['promotions'].append({'stage': promotion['stage'], 'level': promotion['requiredLevel'], 'materials': costs(promotion['materials'])})
        result[category].append(entry)
for id in ['item_expcard_stage1_high', 'item_expcard_stage2_high', 'item_weapon_expcard_high', 'item_gold']:
    used.add(id)
if set(existing_weapons) != {entry['id'] for entry in result['weapons']}:
    raise SystemExit('Review removed weapons before replacing the shared catalog.')
result['regions'] = catalog['regions']
result['experienceGroups'] = catalog['experienceGroups']
low_materials = {row['id'] for group in result['experienceGroups'] for row in group['low']}
used.update(low_materials)
for id in sorted(used):
    result['materials'][id] = catalog['materials'][id] if id in low_materials else {'name': name('wikiData', f'item|{id}')}
output = catalog_path
output.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
sources_path = output.with_name('sources.json')
metadata = json.loads(sources_path.read_text())
metadata['growth'].update({'gameVersion': '1.5', 'checkedAt': '2026-10-05', 'source': f'https://github.com/cmyyx/cep/tree/{revision}/src/generated', 'upstreamCommit': revision})
metadata['growth']['visualMetadata'] = {'url': 'https://data.akedata.wiki/public/1.5.3/10506507-7/TableCfg/CharGrowthTable.json', 'sha256': visual_table_hash, 'checkedAt': '2026-10-06'}
metadata['catalog'].update({'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'characters': len(result['characters']), 'weapons': len(result['weapons']), 'regions': len(result['regions']), 'materials': len(result['materials'])})
sources_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
print(f"Imported {len(result['characters'])} operators, {len(result['weapons'])} weapons, {len(used)} materials ({output.stat().st_size} bytes); preserved shared essence data")
