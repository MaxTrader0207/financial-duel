import json, sys, statistics as st
d = json.load(open(sys.argv[1])); g = d['grid']; A = [0.5, 0.6, 0.7, 0.8, 0.9]
for deck in [k for k in ['starter', 'full'] if f'{k}|easy|0.5' in g]:
    print(f'\n[{deck}]  勝率 by 答對率'); print('diff     ' + '  '.join(f'{int(a*100):>4}%' for a in A) + '   回合(70%)')
    for diff in ['easy', 'normal', 'hard']:
        print(f'{diff:7}  ' + '  '.join(f"{g[f'{deck}|{diff}|{a}']['win']*100:4.0f}%" for a in A) + f"   {g[f'{deck}|{diff}|0.7']['turns']:.1f}")
if len(sys.argv) > 2 and sys.argv[2] == 'cards':
    C = d['cards']
    for key, label, n in [('atk', '攻擊時平均淨效益（我方使用）', 'atkN'), ('def', '防禦時平均淨效益（我方使用）', 'defN'), ('foe', '對手使用時平均造成傷害', 'foeN')]:
        print(f'\n== {label}')
        for r in [1, 2, 3, 4]:
            rows = [(v[key], cid, v) for cid, v in C.items() if v['rank'] == r and v[key] is not None and v[n] >= 30]
            if not rows: continue
            med = st.median(x[0] for x in rows)
            hi = sorted(rows, reverse=True)[:3]; lo = sorted(rows)[:2]
            print(f'  ★{r} 中位數 {med:.0f} | 最高 ' + '、'.join(f"{v['name']} {x:.0f}({x/med:.2f}x)" for x, _, v in hi) + ' | 最低 ' + '、'.join(f"{v['name']} {x:.0f}({x/med:.2f}x)" for x, _, v in lo))
