#!/usr/bin/env python3
"""
数据库初始化：添加 ref_pinyin 列 + 补全所有拼音数据（63 条）
用法: python3 db_setup.py
"""
import psycopg2

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "pinyin_learning",
    "user": "balanceearnest",
}

# (pinyin_char, pinyin_type, ref_char, ref_pinyin)
PINYIN_DATA = [
    # ========== 声母 23 个 ==========
    ("b",  "shengmu", "波", "bo1"),
    ("p",  "shengmu", "泼", "po1"),
    ("m",  "shengmu", "摸", "mo1"),
    ("f",  "shengmu", "佛", "fo2"),
    ("d",  "shengmu", "嘚", "de1"),
    ("t",  "shengmu", "特", "te4"),
    ("n",  "shengmu", "讷", "ne4"),
    ("l",  "shengmu", "嘞", "le1"),
    ("g",  "shengmu", "哥", "ge1"),
    ("k",  "shengmu", "科", "ke1"),
    ("h",  "shengmu", "喝", "he1"),
    ("j",  "shengmu", "鸡", "ji1"),
    ("q",  "shengmu", "七", "qi1"),
    ("x",  "shengmu", "西", "xi1"),
    ("zh", "shengmu", "知", "zhi1"),
    ("ch", "shengmu", "吃", "chi1"),
    ("sh", "shengmu", "诗", "shi1"),
    ("r",  "shengmu", "日", "ri4"),
    ("z",  "shengmu", "资", "zi1"),
    ("c",  "shengmu", "呲", "ci1"),
    ("s",  "shengmu", "思", "si1"),
    ("y",  "shengmu", "衣", "yi1"),
    ("w",  "shengmu", "乌", "wu1"),
    # ========== 韵母 24 个 ==========
    ("a",   "yunmu", "啊", "a1"),
    ("o",   "yunmu", "喔", "o1"),
    ("e",   "yunmu", "婀", "e1"),
    ("i",   "yunmu", "衣", "yi1"),
    ("u",   "yunmu", "乌", "wu1"),
    ("ü",   "yunmu", "迂", "yu1"),
    ("ai",  "yunmu", "爱", "ai4"),
    ("ei",  "yunmu", "诶", "ei2"),
    ("ui",  "yunmu", "威", "wei1"),
    ("ao",  "yunmu", "奥", "ao4"),
    ("ou",  "yunmu", "欧", "ou1"),
    ("iu",  "yunmu", "优", "you1"),
    ("ie",  "yunmu", "耶", "ye1"),
    ("üe",  "yunmu", "约", "yue1"),
    ("er",  "yunmu", "儿", "er2"),
    ("an",  "yunmu", "安", "an1"),
    ("en",  "yunmu", "恩", "en1"),
    ("in",  "yunmu", "因", "yin1"),
    ("un",  "yunmu", "温", "wen1"),
    ("ün",  "yunmu", "晕", "yun1"),
    ("ang", "yunmu", "肮", "ang1"),
    ("eng", "yunmu", "鞥", "eng1"),
    ("ing", "yunmu", "英", "ying1"),
    ("ong", "yunmu", "轰", "hong1"),
    # ========== 整体认读音节 16 个 ==========
    ("zhi",  "zhengti", "知", "zhi1"),
    ("chi",  "zhengti", "吃", "chi1"),
    ("shi",  "zhengti", "诗", "shi1"),
    ("ri",   "zhengti", "日", "ri4"),
    ("zi",   "zhengti", "资", "zi1"),
    ("ci",   "zhengti", "呲", "ci1"),
    ("si",   "zhengti", "思", "si1"),
    ("yi",   "zhengti", "衣", "yi1"),
    ("wu",   "zhengti", "乌", "wu1"),
    ("yu",   "zhengti", "迂", "yu1"),
    ("ye",   "zhengti", "耶", "ye1"),
    ("yue",  "zhengti", "约", "yue1"),
    ("yuan", "zhengti", "冤", "yuan1"),
    ("yin",  "zhengti", "因", "yin1"),
    ("yun",  "zhengti", "晕", "yun1"),
    ("ying", "zhengti", "英", "ying1"),
]


def setup():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. 添加 ref_pinyin 列（如果不存在）
    cur.execute("""
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pinyin_content' AND column_name = 'ref_pinyin'
    """)
    if not cur.fetchone():
        cur.execute("ALTER TABLE pinyin_content ADD COLUMN ref_pinyin VARCHAR(20)")
        print("✓ 已添加 ref_pinyin 列")

    # 2. 添加 passed 列到 evaluation_results（如果不存在）
    cur.execute("""
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'evaluation_results' AND column_name = 'passed'
    """)
    if not cur.fetchone():
        cur.execute("ALTER TABLE evaluation_results ADD COLUMN passed BOOLEAN DEFAULT FALSE")
        print("✓ 已添加 passed 列")

    # 3. 添加 pinyin_char 列到 evaluation_results（如果不存在），方便按拼音查询
    cur.execute("""
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'evaluation_results' AND column_name = 'pinyin_char'
    """)
    if not cur.fetchone():
        cur.execute("ALTER TABLE evaluation_results ADD COLUMN pinyin_char VARCHAR(10)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_eval_results_pinyin ON evaluation_results(pinyin_char)")
        print("✓ 已添加 pinyin_char 列")

    # 4. 插入/更新拼音数据
    inserted = 0
    updated = 0
    for pinyin_char, pinyin_type, ref_char, ref_pinyin in PINYIN_DATA:
        cur.execute("SELECT id FROM pinyin_content WHERE pinyin_char = %s", (pinyin_char,))
        row = cur.fetchone()
        if row:
            cur.execute("""
                UPDATE pinyin_content
                SET ref_char = %s, ref_pinyin = %s, pinyin_type = %s
                WHERE pinyin_char = %s
            """, (ref_char, ref_pinyin, pinyin_type, pinyin_char))
            updated += 1
        else:
            cur.execute("""
                INSERT INTO pinyin_content
                    (pinyin_char, pinyin_type, ref_char, ref_pinyin, tone_variants,
                     pronunciation_tips, teaching_script, example_words)
                VALUES (%s, %s, %s, %s, '{}', '', '', '[]')
            """, (pinyin_char, pinyin_type, ref_char, ref_pinyin))
            inserted += 1

    print(f"✓ 拼音数据: 新增 {inserted} 条, 更新 {updated} 条, 共 {len(PINYIN_DATA)} 条")

    cur.close()
    conn.close()
    print("✓ 数据库初始化完成")


if __name__ == "__main__":
    setup()
