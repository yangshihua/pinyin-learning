-- 拼音测评模块数据库初始化 SQL
-- 在目标项目的 PostgreSQL 中运行此脚本创建表结构

-- ========== 1. pinyin_content 表 ==========

CREATE TABLE IF NOT EXISTS pinyin_content (
    id              SERIAL PRIMARY KEY,
    pinyin_char     VARCHAR(10) NOT NULL,
    pinyin_type     VARCHAR(10) NOT NULL,       -- shengmu / yunmu / zhengti
    ref_char        VARCHAR(10) NOT NULL,       -- 参考汉字（讯飞评测 refText）
    ref_pinyin      VARCHAR(20) NOT NULL,       -- 参考拼音数字声调（讯飞评测 refPinyin）
    tone_variants   JSONB NOT NULL DEFAULT '{}', -- 声调变体（韵母用）
    pronunciation_tips TEXT NOT NULL DEFAULT '',
    teaching_script    TEXT NOT NULL DEFAULT '',
    example_words     JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS pinyin_content_pinyin_char_key ON pinyin_content(pinyin_char);
CREATE INDEX IF NOT EXISTS idx_pinyin_content_char ON pinyin_content(pinyin_char);

-- ========== 2. evaluation_results 表 ==========

CREATE TABLE IF NOT EXISTS evaluation_results (
    id              SERIAL PRIMARY KEY,
    child_id        INTEGER,                    -- 可选，关联用户表
    learning_record_id INTEGER,                 -- 可选，关联学习记录表
    ref_text        TEXT NOT NULL,               -- 参考汉字
    ref_pinyin      TEXT NOT NULL,               -- 参考拼音
    overall_score   DECIMAL(5,1),
    pronunciation   DECIMAL(5,1),
    tone_score      DECIMAL(5,1),
    integrity       DECIMAL(5,1),
    rhythm          DECIMAL(5,1),
    detail_json     JSONB,                       -- 讯飞完整返回结果
    audio_url       VARCHAR(500),
    api_sid         VARCHAR(100),
    passed          BOOLEAN DEFAULT FALSE,       -- overall >= 60
    pinyin_char     VARCHAR(10),                 -- 评测的拼音字母
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_results_created ON evaluation_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eval_results_pinyin ON evaluation_results(pinyin_char);

-- ========== 3. 拼音数据（63 条） ==========

INSERT INTO pinyin_content (pinyin_char, pinyin_type, ref_char, ref_pinyin) VALUES
-- 声母 23 个
('b',  'shengmu', '波', 'bo1'),
('p',  'shengmu', '泼', 'po1'),
('m',  'shengmu', '摸', 'mo1'),
('f',  'shengmu', '佛', 'fo2'),
('d',  'shengmu', '嘚', 'de1'),
('t',  'shengmu', '特', 'te4'),
('n',  'shengmu', '讷', 'ne4'),
('l',  'shengmu', '嘞', 'le1'),
('g',  'shengmu', '哥', 'ge1'),
('k',  'shengmu', '科', 'ke1'),
('h',  'shengmu', '喝', 'he1'),
('j',  'shengmu', '鸡', 'ji1'),
('q',  'shengmu', '七', 'qi1'),
('x',  'shengmu', '西', 'xi1'),
('zh', 'shengmu', '知', 'zhi1'),
('ch', 'shengmu', '吃', 'chi1'),
('sh', 'shengmu', '诗', 'shi1'),
('r',  'shengmu', '日', 'ri4'),
('z',  'shengmu', '资', 'zi1'),
('c',  'shengmu', '呲', 'ci1'),
('s',  'shengmu', '思', 'si1'),
('y',  'shengmu', '衣', 'yi1'),
('w',  'shengmu', '乌', 'wu1'),
-- 韵母 24 个
('a',   'yunmu', '啊', 'a1'),
('o',   'yunmu', '喔', 'o1'),
('e',   'yunmu', '婀', 'e1'),
('i',   'yunmu', '衣', 'yi1'),
('u',   'yunmu', '乌', 'wu1'),
('ü',   'yunmu', '迂', 'yu1'),
('ai',  'yunmu', '爱', 'ai4'),
('ei',  'yunmu', '诶', 'ei2'),
('ui',  'yunmu', '威', 'wei1'),
('ao',  'yunmu', '奥', 'ao4'),
('ou',  'yunmu', '欧', 'ou1'),
('iu',  'yunmu', '优', 'you1'),
('ie',  'yunmu', '耶', 'ye1'),
('üe',  'yunmu', '约', 'yue1'),
('er',  'yunmu', '儿', 'er2'),
('an',  'yunmu', '安', 'an1'),
('en',  'yunmu', '恩', 'en1'),
('in',  'yunmu', '因', 'yin1'),
('un',  'yunmu', '温', 'wen1'),
('ün',  'yunmu', '晕', 'yun1'),
('ang', 'yunmu', '肮', 'ang1'),
('eng', 'yunmu', '鞥', 'eng1'),
('ing', 'yunmu', '英', 'ying1'),
('ong', 'yunmu', '轰', 'hong1'),
-- 整体认读音节 16 个
('zhi',  'zhengti', '知', 'zhi1'),
('chi',  'zhengti', '吃', 'chi1'),
('shi',  'zhengti', '诗', 'shi1'),
('ri',   'zhengti', '日', 'ri4'),
('zi',   'zhengti', '资', 'zi1'),
('ci',   'zhengti', '呲', 'ci1'),
('si',   'zhengti', '思', 'si1'),
('yi',   'zhengti', '衣', 'yi1'),
('wu',   'zhengti', '乌', 'wu1'),
('yu',   'zhengti', '迂', 'yu1'),
('ye',   'zhengti', '耶', 'ye1'),
('yue',  'zhengti', '约', 'yue1'),
('yuan', 'zhengti', '冤', 'yuan1'),
('yin',  'zhengti', '因', 'yin1'),
('yun',  'zhengti', '晕', 'yun1'),
('ying', 'zhengti', '英', 'ying1')
ON CONFLICT (pinyin_char) DO UPDATE SET
    ref_char = EXCLUDED.ref_char,
    ref_pinyin = EXCLUDED.ref_pinyin,
    pinyin_type = EXCLUDED.pinyin_type;