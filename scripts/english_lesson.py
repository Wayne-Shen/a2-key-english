"""English presentation text; original course data and answers remain the source of truth."""
import re
from pathlib import Path

TRANSLATIONS = {}
def pairs(text):
    for line in text.strip().splitlines():
        source, english = line.split('\t', 1)
        TRANSLATIONS[source] = english

pairs('''
今天练习问候、自我介绍、家庭和学校词汇，并学习 am、is、are。新词有 60 项，按课程要求完整保留；孩子可以分两次学习，不需要一次背完。	Practise greetings, introductions, family and school words, and am, is and are. All 60 new words are included. Split them into two sessions; there is no need to memorise them all at once.
今天学习学校用品、科目和课堂用语，并练习 a/an、the 与名词复数。今日 60 个新词可分成两组复习。	Learn school supplies, subjects and classroom language. Practise a/an, the and plural nouns. Review the 60 new words in two groups.
今天围绕家和房间学习 60 个新词，练习用 there is / there are 描述物品数量与位置。复习词可分两轮完成。	Learn 60 words about home and rooms. Use there is and there are to describe quantities and positions. Split the review words into two rounds.
今天通过校园日常情境学习 60 个新词，并练习一般现在时、do/does 和频率副词。	Learn 60 words through school routines. Practise the present simple, do/does and adverbs of frequency.
今天通过朋友、家庭和职业话题学习新词，重点练习疑问句、宾格代词和名词性物主代词。	Learn words about friends, family and jobs. Focus on questions, object pronouns and possessive pronouns.
第 6 天通过午餐场景学习可数/不可数名词及 some/any。完整新词 60 项、复习词 120 项分轮接触，不要求一次熟练掌握。	Use a lunch scene to learn countable and uncountable nouns and some/any. Cover the 60 new words and 120 review words in short rounds; fluency does not have to come all at once.
第 7 天学习购物数量表达及 too/enough。新词 60 项、复习词 120 项，完整清单分轮接触，价格可用纸币道具练习。	Practise shopping quantities and too/enough. Cover 60 new words and 120 review words in short rounds. Use pretend money to practise prices.
第 8 天围绕兴趣社团学习 can/cannot，以及 enjoy + -ing、want to + 原形。新词 60 项、到期复习词 180 项分轮接触，允许用虚构能力和社团作答。	Use clubs and hobbies to practise can/cannot, enjoy + -ing and want to + base verb. Cover 60 new words and 180 review words in short rounds. Imaginary abilities and clubs are welcome.
第 9 天学习现在进行时和方式副词，新词 60 项、到期复习词 180 项分轮接触。强调友善合作，不以输赢评价孩子。	Practise the present continuous and adverbs of manner. Cover 60 new words and 180 review words in short rounds. Encourage kind teamwork rather than judging success by winning.
先用 usual/now 对比口头热身，再按短路线练习；完整词表分轮复习。	Warm up by contrasting usual actions with actions happening now, then follow the short practice route. Review the full word list over several rounds.
用桌面物品模拟街角，练两步路线；开始标准 A2 阶段但仍分短轮完成。	Use objects on a table to model a street corner and practise two-step directions. This starts the standard A2 stage; keep sessions short.
用真实周末安排练 going to，用天气图标练 may；分短轮完成新词与复习。	Use real weekend plans to practise going to, and weather pictures to practise may. Work through new and review words in short rounds.
用家庭真实预约区分个人安排与时刻表；路线变化练找证据。	Use family appointments to distinguish arrangements from timetables. Find evidence when a route changes.
用昨天的真实活动练过去式，并把短句连接成小邮件。	Use yesterday's activities to practise past forms, then join short sentences into a brief email.
把不规则动词放进真实小故事；Day 1 首次进入 D+14 复习，复习总量增加，要分轮完成。	Practise irregular verbs in short real-life stories. Day 1 reaches its first 14-day review, so divide the larger review set into short rounds.
用昨天看过的节目或活动练 Did 问句，再区分动作否定与 was/were 否定。	Use yesterday's programme or activity to practise Did questions. Compare action negatives with was/were negatives.
拿两张动物图片比较外形，再用真实动作比较 faster、more carefully、better。	Compare two animal pictures, then compare real actions with faster, more carefully and better.
用三个物品明确比较范围；先说两者比较，再说整组最高级，避免只背形式。	Use three objects to make the comparison group clear. Compare two first, then use a superlative for the whole group rather than memorising forms alone.
只练日常建议及向成人求助；不要让孩子自行判断伤病或决定用药。	Practise everyday advice and asking an adult for help. Do not ask children to diagnose injuries or illnesses or make medicine decisions.
用真实校规区分 must 与 should；每条规则配一个孩子能理解的原因。	Use real school rules to distinguish must from should. Give a child-friendly reason for each rule.
先用分工清单练 have to，再用“自愿做”和“禁止做”区分 don’t have to 与 mustn’t。	Use a task list to practise have to. Contrast optional actions with forbidden actions to distinguish don't have to from mustn't.
做真实邀请卡，写清何时何地与携带物品；分别练 will 帮忙、would 请求、shall 提议。	Make an invitation showing when, where and what to bring. Practise will for offers, would for requests and shall for suggestions.
把 want to、enjoy doing、interested in doing 写成搭配卡，用真实兴趣替换，不把所有动词套同一种形式。	Make pattern cards for want to, enjoy doing and interested in doing. Use real interests and notice that verbs do not all follow the same pattern.
用时间线画正在进行的长动作与突然发生的短事件，再用 while 对比同时发生的两个动作。	Draw a timeline showing a long action and a short event that interrupts it. Use while to compare two simultaneous actions.
先区分“到现在的经历、结果”与“昨天的已结束事件”，再用日历画 since 的起点、for 的时长。饮食体验按实际情况回答，不要求孩子尝某种食物。	Distinguish experiences or results connected with now from finished events yesterday. Mark the starting point for since and the duration for for on a calendar. Answer food questions honestly; children do not need to try a particular food.
用两张人物卡和两张物品卡练“是哪一个”；解释 who/that、which/that 都可能正确，避免把合理替代词判错。	Use two people cards and two object cards to identify which one. Explain that who/that and which/that can both be correct; accept valid alternatives.
先问“谁做动作、谁被处理”，再选主动或被动。用熟悉物品配现在/昨天两条时间线，明确 is/are 与 was/were。	Ask who performs the action and who receives it before choosing active or passive. Use familiar objects and timelines for now and yesterday to distinguish is/are from was/were.
把“条件”和“结果”分成两张卡配对，再交换句子先后顺序。提醒 if 从句不用 will，结果才用 will + 原形。	Match a condition card with a result card, then reverse the clause order. Use the present simple in the if-clause and will + base verb for the result.
用孩子真实的一句陈述转述，先换代词再检查 say/tell 是否需要对象；本课不用过去转述动词强行练复杂时态后移。	Report a child's real statement. Change pronouns first, then check whether say/tell needs an object. Do not force complex tense shifts with past reporting verbs in this lesson.
先按时间、主语、句意找错因，不把一次失误当成不会。完成后选两项已经能做的事和一项下步目标；到期复习分轮完成。	Check time, subject and meaning to understand an error. One mistake does not mean a skill is missing. Finish by choosing two things you can do and one next goal. Divide due reviews into rounds.
45–60 分钟短路线：重点新词 10 个 → 语法 A → Reading 1、5 → Listening 2 → 5 分钟口语。	45–60-minute short route: 10 priority new words → Grammar A → Reading 1 and 5 → Listening 2 → five minutes of speaking.
45–60 分钟短路线：重点词 10 个 → 语法 A → Reading 2 → Listening 3 → 社团角色扮演。	45–60-minute short route: 10 priority words → Grammar A → Reading 2 → Listening 3 → club role-play.
45–60 分钟短路线：重点词 10 个 → 语法 A → Reading 3 → Listening 1、2 → 购物角色扮演。	45–60-minute short route: 10 priority words → Grammar A → Reading 3 → Listening 1 and 2 → shopping role-play.
45–60 分钟短路线：重点词 10 个 → 语法 A → Reading 3 → Listening 2、4 → 体育解说角色扮演。	45–60-minute short route: 10 priority words → Grammar A → Reading 3 → Listening 2 and 4 → sports-commentary role-play.
60 项新词分组接触，日期与月份先识别。	Cover 60 new words in groups. Begin by recognising dates and months.
60 项新词分组：交通、自然、旅行物品。	Group the 60 new words into transport, nature and travel items.
60 项新词分轮学习，地名以识别为主。	Learn the 60 new words in rounds. Focus on recognising place names.
60 项新词分轮接触，单位词用水瓶和简单距离举例。	Cover 60 new words in rounds. Use water bottles and simple distances to illustrate units.
Reading 3 先读后答，错题找原文依据；4、5 做完再听补全文。	Read before answering Reading 3 and find text evidence for corrections. Listen to the completed Reading 4 and 5 texts after attempting the questions.
Reading 3 关注改计划的原因；4、5 先做再听。	In Reading 3, notice why plans change. Attempt Reading 4 and 5 before listening.
Reading 3 核对错误转弯的依据，不依赖猜测。	In Reading 3, find evidence for the wrong turn rather than guessing.
Reading 4、5 音频含正确补全文，先尝试再播放。不要在选项旁直接提示答案。	Reading 4 and 5 recordings contain the completed correct texts. Attempt the questions before listening, without giving answer hints beside the options.
三句日记写出开始、变化、结果；新闻先听再跟读朗读。	Write a three-sentence diary showing the beginning, change and result. For news, listen first, then shadow and read aloud.
不要直接告诉匹配答案；让孩子指出文本或录音中的依据。	Do not give matching answers directly. Ask the learner to identify evidence in the text or recording.
从 60 个新词中分两组复习，每组约 30 个；让孩子说词义或读例句。	Review the 60 new words in two groups of about 30. Ask the learner to explain meanings or read example sentences.
做词汇快测与语法 A；用时间提示解释选择。	Complete the vocabulary quick check and Grammar A. Use time clues to explain choices.
做语法 A、B；分别圈动词原形和介词。	Complete Grammar A and B. Circle base verbs and prepositions separately.
先做题，再用左侧固定文本查找依据。	Attempt the question, then use the accompanying text to find evidence.
先判断代词在句中是动作执行者还是动作对象。	First decide whether a pronoun is the subject performing the action or the object receiving it.
先听或读 Part 1 的短通知，再说出关键信息。	Listen to or read the short Part 1 notice, then state its key information.
先听清 usual price、today、half-price 的关系，再选择，不只凭第一次听到的数字。	Understand the relationship between usual price, today and half-price before choosing. Do not rely on the first number you hear.
先让孩子听或读短文，再回答题目。	Ask the learner to listen to or read the passage before answering.
先说两条真实计划，标出 be 与动词原形。	Say two real plans and mark be and the base verb.
口头描述物品归属时可用 mine/hers/theirs。	Use mine, hers and theirs when describing who owns an item.
口语检查：How much 与 How many 是否合适，enough 的位置是否正确。	Speaking check: choose How much or How many appropriately and check the position of enough.
口语检查：can 后是否原形、enjoy 后是否 -ing、want 后是否有 to。	Speaking check: use a base verb after can, -ing after enjoy and to after want.
口语检查：是否说清“正在做”，是否用 carefully/slowly 描述动作。	Speaking check: make it clear that an action is happening now, and describe it with carefully or slowly.
口语检查：食物数量是否合理、some/any 是否合适、能否用 because 说明理由。	Speaking check: use sensible food quantities, choose some/any appropriately and give a reason with because.
听力两遍确认最终地点与时间；新闻模块只做听读。	Listen twice to confirm the final place and time. The news module is listening and reading practice only.
听力两遍：第一遍抓目的，第二遍核对最终时间；新闻三步听读。	Listen twice: first for the purpose, then to check the final time. Follow the three news-practice steps.
听力先读题再听两遍，关注更正后的时间、地点和决定。	Read the questions before listening twice. Notice corrected times, places and decisions.
听力先读题，再听两次；Reading 4、5 的补全文音频放在做题后。	Read the questions, then listen twice. Play the completed Reading 4 and 5 recordings after attempting the questions.
听力听两遍记最终计划；新闻按先听、跟读、朗读。	Listen twice and note the final plan. For news, listen, shadow and read aloud.
听力每段可重播；先听两遍再查看答案。	Recordings can be replayed. Listen twice before checking the answers.
听力每段播放两遍，完成题目后再核对。	Play each recording twice. Check answers after completing the questions.
听力注意 usually 与 this week，辨认集合地点和最终决定。每段可听两次。	Notice usually and this week. Identify the meeting place and final decision. Listen to each recording twice.
听力读题后听两遍；新闻模块单独先听、跟读、朗读。	Read the questions, then listen twice. In the separate news module, listen, shadow and read aloud.
回忆五岁能做的事，练 could + 原形。	Recall things you could do at five years old to practise could + base verb.
复习 Day 10、8、4 的到期词，不额外改排期。	Review the due words from Days 10, 8 and 4 without changing the schedule.
复习 Day 11、9、5 的到期词，先口头回忆再看释义。	Review the due words from Days 11, 9 and 5. Recall them aloud before checking the meanings.
复习 Day 12、10、6 到期词，每轮选五个回忆。	Review the due words from Days 12, 10 and 6, choosing five for recall in each round.
复习 Day 13、11、7 的到期词。	Review the due words from Days 13, 11 and 7.
复习 Day 14、12、8、1 的到期词，共 240 项；每轮只抽少量主动回忆。	Review 240 due words from Days 14, 12, 8 and 1. Choose a small set for active recall in each round.
复习 Day 9、7、3 的到期词，优先回忆衣物和日常动作。	Review the due words from Days 9, 7 and 3. Prioritise clothing and everyday actions.
复习词较多时分轮口头抽查；今天的新词不要求一次背完。	When there are many review words, use short spoken recall rounds. Today's new words do not have to be memorised all at once.
完整清单仍保留；新词可先接触例句，再分轮识别与口头回忆。复习词轮换，不要求一次熟练说出全部。	Keep the complete list. Start with examples, then recognise and recall new words over several rounds. Rotate review words without expecting fluent recall of all of them at once.
完整词表保留，其他新词通过例句分轮接触，到期旧词轮换回忆。	Keep the complete list. Meet other new words through examples over several rounds and rotate due words for recall.
完整阅读和听力可拆成两次；按原排期继续接触其他新词，不以短路线替代完整清单。	Split the full reading and listening practice into two sessions. Continue other new words on the original schedule; the short route does not replace the full list.
完整题包可拆成两次；先完成当天新词的例句接触，再轮换复习词，不改动排期。	Split the full practice pack into two sessions. Cover examples for the day's new words first, then rotate review words without changing the schedule.
描述房间时指明数量，再选择 is 或 are。	State the number of items in a room before choosing is or are.
新词 60 项分 3 轮接触，不要求一次背熟。	Cover 60 new words in three rounds. There is no need to memorise them all at once.
新词分 3 轮；先识别地名、工作人员和路线词。	Cover new words in three rounds. Start by recognising place names, staff and route words.
新闻先听、跟读、朗读；最后用三句话复述本课主题。	For news, listen, shadow and read aloud. Finish with a three-sentence retelling of the lesson topic.
检查 do/does 后的动词使用原形。	Check that a base verb follows do or does.
用 usually/often/never 说真实或想象的日常活动。	Use usually, often and never to describe real or imaginary routines.
用三四句描述一次出游；新闻按三步听读，不计考试分。	Describe an outing in three or four sentences. Complete the three news-practice steps without an exam score.
用两个物品作地标，让孩子发出 Turn/Go/Don’t 指示。	Use two objects as landmarks and ask the learner to give Turn, Go and Don't instructions.
用两种天气图说明 may 是可能，不是保证。	Use two weather pictures to show that may expresses possibility rather than certainty.
用已订好的活动说 be + -ing，加未来时间。	Use be + -ing and a future time to describe an agreed arrangement.
看到 he/she/it 时检查动词是否加 -s。	With he, she or it, check whether the verb needs -s.
看到名词先判断单数还是复数，再听名词开头的发音来选 a 或 an。	Decide whether a noun is singular or plural, then listen to its first sound to choose a or an.
练 was/were，先判断主语单复数。	Before choosing was or were, decide whether the subject is singular or plural.
练习 be 动词时，先找主语，再选 am、is 或 are。	Find the subject before choosing am, is or are.
给 walk、save、carry、stop 各做一张过去式卡。	Make a past-form card for walk, save, carry and stop.
若错题多，次日减少额外题量，保留当日新词接触和重点词回忆。	If there are many errors, reduce extra exercises the next day while keeping new-word exposure and priority-word recall.
让孩子同时检查 be 和 -ing，再检查单复数、run/swim 的拼写。	Check both be and -ing, then check singular/plural forms and the spelling of running and swimming.
让孩子说平时穿什么、今天穿什么，各一句。	Ask for one sentence about usual clothing and one about what the learner is wearing today.
语法先做再看解释；阅读指出答案的原文依据。	Attempt grammar questions before reading explanations. Find text evidence for reading answers.
读简短时刻表，比较 leaves 与 are taking。	Read a short timetable and compare leaves with are taking.
配对 go/went、get/got、have/had、see/saw，再各说一句。	Match go/went, get/got, have/had and see/saw, then use each pair in a sentence.
错很多时次日缩短额外练习，保留新词接触及本日重点词回忆。	After many errors, shorten extra practice the next day while keeping new-word exposure and today's priority-word recall.
错题多时减少次日额外题量；保留新词接触、重点词回忆和一句鼓励。	After many errors, reduce the next day's extra exercises. Keep new-word exposure, priority-word recall and a word of encouragement.
错题多时次日减少额外题量，保留新词接触和重点词回忆。	After many errors, reduce extra exercises the next day while keeping new-word exposure and priority-word recall.
阅读 4、5 补全文音频放在尝试之后；每段听力可播放两次。	Play completed Reading 4 and 5 recordings after attempting the questions. Each listening recording may be played twice.
阅读 4、5 音频含正确补全文，孩子尝试之后再播；听力各播两次。	Reading 4 and 5 recordings contain the completed correct texts. Play them after the learner attempts the questions. Play each listening recording twice.
阅读先做后听；错题指出原文证据。	Attempt reading questions before listening. Find text evidence when correcting mistakes.
阅读和听力比较先发生、后发生；用原文证据检查。	Compare the order of events in reading and listening. Check with evidence from the source.
阅读找 but/because/so 的连接作用；听力关注最后选定的活动。	Notice how but, because and so link ideas in reading. Listen for the activity that is finally chosen.
''')

GRAMMAR_FIRST_FIVE = [
'Use am with I, is with he, she, it or one name, and are with you, we, they or plural nouns. Put am, is or are before the subject to make a question.',
'Use a or an before a singular countable noun: a book, an apple. Choose by the first sound, not just the first letter. Use the for something already known or specific. Most plural nouns add -s or -es; some have irregular forms.',
'Use there is with a singular or uncountable noun and there are with plural nouns. Put is or are before there for questions. Use is not or are not for negatives. Describe positions with in, on, under and next to.',
'Use the present simple for habits and routines. With he, she or it, add -s or -es to the verb. Use do or does to make questions and negatives, followed by the base verb. Use always, usually, often, sometimes and never to say how often something happens.',
'Put question words before the verb in a question: Where is she? What do you like? Use object pronouns such as me, him, her, us and them after verbs and prepositions. Use mine, yours, his, hers, ours and theirs on their own to show who owns something.'
]

def translate(text):
    if not re.search('[\u3400-\u9fff]', text): return text
    if text in TRANSLATIONS: return TRANSLATIONS[text]
    m=re.fullmatch(r'(59|60) 项新词分轮接触；优先主动运用：(.*)。',text)
    if m:return f'Cover {m[1]} new words in short rounds. Prioritise active use of: {m[2]}.'
    m=re.fullmatch(r'到期复习来自 Day (.*)，分轮回忆，避免一次背完。',text)
    if m:return f'Due reviews come from Days {m[1]}. Recall them in short rounds rather than memorising the whole set at once.'
    raise ValueError(f'Missing English presentation text: {text}')

def content(data):
    mistakes=[]
    for mistake in data.get('common_mistakes',[]):
        if isinstance(mistake,dict):
            mistakes.append(' '.join(str(mistake.get(k,'')) for k in ['wrong','right','why']))
        elif re.search('[\u3400-\u9fff]',mistake):
            # Supplied translations retain the original correction and its explanation.
            mistakes.append(translate(mistake))
        else:mistakes.append(mistake)
    return {'grammar':data['grammar'].get('explanation_en') or GRAMMAR_FIRST_FIVE[data['day']-1],
            'parent':{'summary':translate(data['parent_guidance']['summary']), 'steps':[translate(s) for s in data['parent_guidance'].get('steps',[])]},'mistakes':mistakes}
pairs('''
Sam says I am ready（I 指 Sam）→ Sam says he is ready.	Sam says, "I am ready." → Sam says he is ready. Change I to he when reporting Sam's words.
❌ Do you can sing? → ✅ Can you sing?：can 直接提前，不用 do。	❌ Do you can sing? → ✅ Can you sing? Put can first; do not add do.
❌ Do you swimming? → ✅ Are you swimming?：进行时用 be 提问。	❌ Do you swimming? → ✅ Are you swimming? Use be to make a present continuous question.
❌ He moves slow. → ✅ He moves slowly.：动作方式用副词 slowly。	❌ He moves slow. → ✅ He moves slowly. Use the adverb slowly to describe how he moves.
❌ I can to draw. → ✅ I can draw.：can 后不加 to。	❌ I can to draw. → ✅ I can draw. Do not add to after can.
❌ I do not can dance. → ✅ I cannot dance.：否定用 cannot/can’t。	❌ I do not can dance. → ✅ I cannot dance. Use cannot or can't for the negative.
❌ I enjoy draw. → ✅ I enjoy drawing.：enjoy 后用 -ing。	❌ I enjoy draw. → ✅ I enjoy drawing. Use -ing after enjoy.
❌ I running. → ✅ I am running.：不要漏掉 be。	❌ I running. → ✅ I am running. Remember the verb be.
❌ I want join. → ✅ I want to join.：want to + 原形。	❌ I want join. → ✅ I want to join. Use want to + base verb.
❌ She can plays. → ✅ She can play.：can 后用原形。	❌ She can plays. → ✅ She can play. Use the base verb after can.
❌ The shirt is too enough small. → ✅ The shirt is too small.：too 与 enough 不这样连用。	❌ The shirt is too enough small. → ✅ The shirt is too small. Do not combine too and enough in this way.
❌ There are some juice. → ✅ There is some juice.：juice 不可数，用 is。	❌ There are some juice. → ✅ There is some juice. Juice is uncountable, so use is.
❌ They is playing. → ✅ They are playing.：复数用 are。	❌ They is playing. → ✅ They are playing. Use are with a plural subject.
❌ We do not have some grapes. → ✅ We do not have any grapes.：一般否定句用 any。	❌ We do not have some grapes. → ✅ We do not have any grapes. Use any in most negative sentences.
❌ a bread → ✅ a piece of bread：bread 通常不可数，用 piece 表示数量。	❌ a bread → ✅ a piece of bread. Bread is usually uncountable; use piece to give a quantity.
❌ a cheese → ✅ some cheese：这里 cheese 不可数。	❌ a cheese → ✅ some cheese. Cheese is uncountable here.
❌ an banana → ✅ a banana：看开头音素，banana 是辅音音素开头。	❌ an banana → ✅ a banana. Choose by the first sound: banana starts with a consonant sound.
❌ enough big → ✅ big enough：enough 放在形容词后。	❌ enough big → ✅ big enough. Put enough after an adjective.
❌ many money → ✅ much money：money 不可数。	❌ many money → ✅ much money. Money is uncountable.
❌ money enough → ✅ enough money：enough 放在名词前。	❌ money enough → ✅ enough money. Put enough before a noun.
❌ much apples → ✅ many apples：apples 可数复数。	❌ much apples → ✅ many apples. Apples is a countable plural.
❌ rideing → ✅ riding：去 e 加 -ing。	❌ rideing → ✅ riding. Drop the final e before adding -ing.
❌ runing → ✅ running：双写 n。	❌ runing → ✅ running. Double the final n.
❌ two tomato → ✅ two tomatoes：可数复数要加 -es。	❌ two tomato → ✅ two tomatoes. Add -es for this countable plural.
❌ 半价 £10 是 £8 → ✅ 半价 £10 是 £5：half-price 是原价的一半。	❌ Half of £10 is £8. → ✅ Half of £10 is £5. Half-price means half the original price.
''')

CODE_TEXT = {
'已完成 ${count} / 30 天':'${count} / 30 days completed',
'${count} / 30 已完成':'${count} / 30 completed',
'今日已完成':'Day complete','标记完成':'Mark day complete','待开放':'Not available yet','✓ 已完成':'✓ Completed','正在学习':'Current lesson','开始练习':'Start practice',
'显示中文':'Reveal Chinese','隐藏中文':'Hide Chinese',
'1 · 先听 Listen':'1 · Listen','2 · 跟读 Shadow':'2 · Shadow','3 · 朗读 Read aloud':'3 · Read aloud',
'先不看原文听两遍。抓住主题，留意熟悉的词，不做题。':'Listen twice without reading. Follow the main idea and notice familiar words. There are no questions.',
'看原文跟读，逐句暂停后模仿重音和语调。':'Follow the text. Pause after each sentence and copy its stress and rhythm.',
'独立读完整篇，再听一遍对照节奏。读顺即可，不必背诵。':'Read the whole story aloud, then listen again to check your rhythm. Aim for a smooth reading; there is no need to memorise it.',
'新闻听读 · ${step.label}':'News practice · ${step.label}',
'${n.practice_minutes} 分钟':'${n.practice_minutes} minutes',
'美式英语 · Annie · 合成语音，可反复播放':'American English · Annie · Synthetic voice. Replay as needed.',
'原报道更新：${n.source.published_or_updated_date} · 选取：${n.selected_date}':'Source updated: ${n.source.published_or_updated_date} · Selected: ${n.selected_date}',
'下载语音文本 TXT':'Download transcript TXT','下载 MP3':'Download MP3','这一遍练习完成':'I completed this practice','重点复习：':'Priority review: ',
'Useful expressions: ':'Useful expressions: '
}

def localize(app,data):
    display=content(data)
    # Keep the embedded D and COURSE records unchanged; localise only rendering.
    lines=app.splitlines(keepends=True)
    cut=next(i for i,line in enumerate(lines) if line.startswith("const done="))
    original=''.join(lines[:cut]);code=''.join(lines[cut:])
    for before,after in CODE_TEXT.items():code=code.replace(before,after)
    old="...(D.grammar.explanation_en?[{type:'text',text:D.grammar.explanation_en}]:[]),{type:'text',text:D.grammar.explanation_zh,className:'context-cn'}"
    assert old in code
    code=code.replace(old,"{type:'text',text:ENGLISH.grammar}")
    code=code.replace('item.explanation_zh,','')
    code=code.replace("button.setAttribute('lang','zh-CN')","button.setAttribute('lang','en')")
    code=code.replace("el('p',`${word.word}: ${word.meaning_en} · ${word.meaning_zh}`)","el('p',`${word.word}: ${word.meaning_en} · ${word.meaning_zh}`,'word-definition-translation')")
    code=code.replace("D.parent_guidance?.summary||''",'ENGLISH.parent.summary')
    code=code.replace('D.parent_guidance?.steps||[]','ENGLISH.parent.steps')
    code=code.replace('D.common_mistakes||[]','ENGLISH.mistakes')
    code=code.replace("el('p',n.adaptation_label,'context-instructions')", "el('p','An original B1 practice adaptation based on the linked report; not the publisher’s text or an official exam task.','context-instructions')")
    # Keep the existing checker closure for radio.onchange; it is not a student action.
    code=code.replace("check.type='button';check.onclick", "check.type='button';check.hidden=Array.isArray(item.choices);check.onclick")
    # Embedded Chinese is permitted only for vocabulary meanings in the original data.
    assert not re.search('[\u3400-\u9fff]',code), 'Untranslated lesson interface text'
    import json
    return original+'const ENGLISH='+json.dumps(display,ensure_ascii=False,separators=(',',':'))+';\n'+code
