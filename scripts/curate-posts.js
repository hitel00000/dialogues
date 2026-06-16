import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

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
      
      // 본문 정제 및 앞부분 약 400자 추출 (압축 컨텍스트)
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
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is missing. Skipping curation.");
    return;
  }

  // 기존 큐레이션 데이터 불러오기 (점진적 갱신 및 보존을 위한 입력)
  let existingData = {};
  const curatedFilePath = path.join(PROJECT_ROOT, 'src', 'data', 'curated-links.json');
  if (fs.existsSync(curatedFilePath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(curatedFilePath, 'utf-8'));
      console.log("Loaded existing curation data successfully.");
    } catch (e) {
      console.warn("Failed to parse existing curated links. Proceeding fresh.", e);
    }
  }

  const prompt = `
  다음은 나의 블로그 글 목록(요약본)과 기존에 수집되어 있던 [기존 큐레이션 맵] 데이터입니다.
  글들 사이에 깊은 의미적/철학적/구조적 연결고리를 구축하여 시맨틱 추천 맵을 최신화해 주세요.

  [글 목록 데이터]
  ${JSON.stringify(summaries, null, 2)}

  [기존 큐레이션 맵]
  ${JSON.stringify(existingData, null, 2)}

  [요구 사항]
  1. internal: 각 글(ID)마다 가장 의미적으로 강하게 연결되는 이 블로그 내의 다른 연관 글 1개를 선별해 주세요. (자신 제외, essays와 conversations 카테고리를 교차해서 넘나들 수 있습니다.)
  2. external: 각 글(ID)마다 구글 검색 기능을 이용해, 글의 주제나 비유적 사유를 더 넓은 컨텍스트로 확장하여 읽을 수 있는 인터넷상의 아주 신뢰성 높고 훌륭한 외부 웹 아티클, 칼럼, 백과, 논문 등을 1~2개 찾아주세요.
  3. 각 추천 글마다 왜 연결되는지에 대한 큐레이션 한 줄 평(reason, 한국어 1문장)을 정교하게 작성해 주세요. (external의 경우 왜 외부의 이 글을 추천하는지)
  4. [중요] 기존 큐레이션 맵에 이미 연결된 internal/external 링크와 평이 있고, 연결 대상인 글이 여전히 [글 목록 데이터]에 존재한다면, 무작위 갱신으로 인한 정보 손실을 막기 위해 기존 데이터를 우선적으로 보존하고 유지해 주세요. 신규 글이나 끊어진 글 위주로만 추천을 갱신합니다.

  다음 JSON 구조를 엄격히 지켜 답변해 주세요. JSON 외에 다른 설명 문구 나 마크다운 코드 블록(\`\`\`) 등은 절대로 넣지 마세요:
  {
    "포스트_ID_1": {
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
    console.log("Calling Gemini v1beta API with Google Search tool enabled...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }], // 실시간 구글 검색 그라운딩 활성화
        generation_config: { response_mime_type: "application/json" }
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
    JSON.parse(jsonText);

    // 디렉토리 생성 및 파일 쓰기
    const targetDir = path.dirname(curatedFilePath);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(curatedFilePath, jsonText, 'utf-8');
    console.log(`Curation map successfully saved to: ${curatedFilePath}`);
  } catch (err) {
    console.error("Curation process failed, keeping existing file if any. Error:", err);
  }
}

run();
