import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

async function fetchWithRetry(url, options, maxRetries = 3, initialDelayMs = 2000) {
  let retries = 0;
  while (true) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      const shouldRetry = response.status === 429 || (response.status >= 500 && response.status < 600);
      if (shouldRetry && retries < maxRetries) {
        retries++;
        const delay = initialDelayMs * Math.pow(2, retries - 1);
        console.warn(`API returned status ${response.status}. Retrying in ${delay}ms (Attempt ${retries}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      if (retries < maxRetries) {
        retries++;
        const delay = initialDelayMs * Math.pow(2, retries - 1);
        console.warn(`Network error: ${error.message}. Retrying in ${delay}ms (Attempt ${retries}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// 1. 모든 로컬 마크다운 파일 수집 및 요약 컨텍스트 생성
function getPostSummaries() {
  const categories = ['essays', 'conversations'];
  const summaries = [];

  for (const cat of categories) {
    const dirPath = path.join(PROJECT_ROOT, 'src', 'content', cat);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
      
      // Frontmatter 파싱
      const titleMatch = content.match(/title:\s*"(.*?)"/);
      const title = titleMatch ? titleMatch[1] : file;
      
      // 본문 정제 및 앞부분 약 450자 추출 (압축 컨텍스트)
      const body = content.replace(/---[\s\S]*?---/, '').trim();
      const summary = body.substring(0, 450).replace(/\s+/g, ' ') + '...';

      summaries.push({
        id: file.replace('.md', ''),
        category: cat,
        title: title,
        summary: summary
      });
    }
  }
  return summaries;
}

// 2. 메인 실행 함수
async function run() {
  const summaries = getPostSummaries();

  // CLI Arguments 파싱 (--force: 전체 재생성, --recurate <id>: 특정 포스트 재생성)
  const args = process.argv.slice(2);
  const forceAll = args.includes('--force');
  const recurateIndex = args.indexOf('--recurate');
  const recurateId = recurateIndex !== -1 ? args[recurateIndex + 1] : null;

  // 로컬 큐레이션 데이터 불러오기
  let existingData = {};
  const curatedFilePath = path.join(PROJECT_ROOT, 'src', 'data', 'curated-links.json');
  
  if (forceAll) {
    console.log("Force option enabled. Clearing existing curation data for full re-generation.");
  } else {
    if (fs.existsSync(curatedFilePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(curatedFilePath, 'utf-8'));
        console.log("Loaded existing curation data from src/data/curated-links.json successfully.");
      } catch (e) {
        console.warn("Failed to parse existing curated links. Starting fresh.", e);
      }
    }
  }

  // 특정 포스트만 재큐레이션 하려는 경우 해당 키 삭제
  if (recurateId && existingData[recurateId]) {
    console.log(`Removing curation entry for '${recurateId}' to force re-curation.`);
    delete existingData[recurateId];
  }

  // 3. 삭제된 포스트 정리 (Orphaned entries cleanup)
  const postIds = new Set(summaries.map(s => s.id));
  let cleanedCount = 0;
  for (const key of Object.keys(existingData)) {
    if (!postIds.has(key)) {
      delete existingData[key];
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} orphaned curation entries.`);
  }

  // 4. 새 글(큐레이션 대상) 분류
  const newPosts = summaries.filter(s => !existingData[s.id]);

  if (newPosts.length === 0) {
    console.log("No new posts to curate. Curation map is up to date.");
    const targetDir = path.dirname(curatedFilePath);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(curatedFilePath, JSON.stringify(existingData, null, 2), 'utf-8');
    return;
  }

  // 5. API 호출이 필요한 시점에만 API 키 검사
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is missing. Skipping curation.");
    return;
  }

  console.log(`Found ${newPosts.length} new post(s) to curate: ${newPosts.map(p => p.id).join(', ')}`);

  const prompt = `
  다음은 내 블로그에 새로 추가된 글 목록(New Posts)과, 추천 대상이 될 수 있는 전체 블로그 글 목록(All Posts Pool)입니다.
  새로 추가된 각 글에 대해 시맨틱 추천 링크(내부 연결 1개, 외부 연결 1~2개)를 생성해 주세요.

  [새로 추가된 글 목록 (New Posts)]
  ${JSON.stringify(newPosts, null, 2)}

  [전체 블로그 글 목록 (All Posts Pool)]
  ${JSON.stringify(summaries, null, 2)}

  [요구 사항]
  1. 아래 명시된 신규 글(New Posts) 각각에 대해서만 추천 정보를 생성해 주세요.
  2. internal: 각 신규 글마다 가장 의미적으로 강하게 연결되는 All Posts Pool 내의 다른 연관 글 1개를 선별해 주세요. (자기 자신 제외, essays와 conversations 카테고리를 교차해서 넘나들 수 있습니다.)
  3. external: 각 신규 글마다, 당신의 사전 학습된 풍부한 지식(Pre-trained Knowledge)을 바탕으로 글의 주제나 비유적 사유를 더 넓은 컨텍스트로 확장하여 읽을 수 있는 인터넷상의 아주 유명하고 공신력 있는 외부 웹 아티클, 위키백과(Wikipedia) 페이지, 스탠포드 철학 백과(Stanford Encyclopedia of Philosophy) 문서, 유명 저널 칼럼 등을 1~2개 매핑해 주세요. 실제 존재하는 정확한 URL 주소를 포함시켜 주셔야 합니다. (무료 API 티어 제약으로 실시간 검색을 수행하지 못하므로, 본인의 내장 지식을 바탕으로 확실한 실제 URL을 작성해 주세요.)
  4. 각 추천 글마다 왜 연결되는지에 대한 큐레이션 한 줄 평(reason, 한국어 1문장)을 정교하게 작성해 주세요.

  다음 JSON 구조를 엄격히 지켜 답변해 주세요. JSON 외에 다른 설명 문구 나 마크다운 코드 블록(\`\`\`) 등은 절대로 넣지 마세요:
  {
    "신규_포스트_ID_1": {
      "internal": [
        { "id": "내부_연관_포스트_ID", "reason": "이 둘은 ~한 연결고리를 가집니다." }
      ],
      "external": [
        { "title": "외부 글 제목", "url": "외부_글_URL", "reason": "이 외부 글은 ~한 점을 깊게 다루고 있어..." }
      ]
    }
  }
  `;

  try {
    console.log("Calling Gemini v1beta API (gemini-3.5-flash) in standard mode for new posts...");
    const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    let jsonText = data.candidates[0].content.parts[0].text;
    
    // 마크다운 백틱 및 공백 제거
    jsonText = jsonText.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim();
    
    // JSON 유효성 테스트
    const newCuration = JSON.parse(jsonText);

    // 기존 데이터와 신규 데이터 병합
    for (const [id, curation] of Object.entries(newCuration)) {
      existingData[id] = curation;
    }

    // 디렉토리 생성 및 파일 쓰기
    const targetDir = path.dirname(curatedFilePath);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    
    fs.writeFileSync(curatedFilePath, JSON.stringify(existingData, null, 2), 'utf-8');
    console.log(`Curation map successfully saved to: ${curatedFilePath}`);
  } catch (err) {
    console.error("Curation process failed, keeping existing file if any. Error:", err);
  }
}

run();
