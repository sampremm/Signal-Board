#!/bin/bash
# Signal Board - Comprehensive API Test Suite
BASE="http://localhost:5001/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
  local label="$1"
  local status="$2"
  local body="$3"
  local expected_status="$4"
  local check_key="$5"

  local ok=true
  if [ "$status" != "$expected_status" ]; then ok=false; fi
  if [ -n "$check_key" ] && ! echo "$body" | grep -q "$check_key"; then ok=false; fi

  if $ok; then
    echo -e "  ${GREEN}✅ PASS${NC} $label (HTTP $status)"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}❌ FAIL${NC} $label (HTTP $status)"
    echo -e "       Response: $(echo $body | head -c 200)"
    FAIL=$((FAIL+1))
  fi
}

echo -e "\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║     Signal Board API Test Suite — Full Coverage      ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${NC}"

# 1. HEALTH
echo -e "\n${BOLD}[1] Health Check${NC}"
R=$(curl -s -o /tmp/sb_body -w "%{http_code}" "$BASE/health")
B=$(cat /tmp/sb_body)
check "GET /api/health" "$R" "$B" "200" "ANTIFRAGILE_ONLINE"

# 2. AUTH - Demo Login
echo -e "\n${BOLD}[2] Auth — Login${NC}"

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"candidate@signalboard.ai","password":"demo1234"}')
B=$(cat /tmp/sb_body)
check "POST /api/auth/login (demo candidate)" "$R" "$B" "200" "token"
CAND_TOKEN=$(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"employer@signalboard.ai","password":"demo1234"}')
B=$(cat /tmp/sb_body)
check "POST /api/auth/login (demo employer)" "$R" "$B" "200" "token"
EMP_TOKEN=$(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"bad@email.com","password":"wrongpass"}')
B=$(cat /tmp/sb_body)
check "POST /api/auth/login (wrong creds → 401)" "$R" "$B" "401" "Invalid"

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nopassword@test.com"}')
B=$(cat /tmp/sb_body)
check "POST /api/auth/login (missing fields → 400)" "$R" "$B" "400" ""

# 3. Auth - Register + /me
echo -e "\n${BOLD}[3] Auth — Register & /me${NC}"
TEMAIL="tester_$(date +%s)@test.com"
R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEMAIL\",\"password\":\"test1234\",\"role\":\"CANDIDATE\",\"firstName\":\"Test\",\"lastName\":\"User\"}")
B=$(cat /tmp/sb_body)
check "POST /api/auth/register (new candidate)" "$R" "$B" "201" "token"

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"incomplete@test.com"}')
B=$(cat /tmp/sb_body)
check "POST /api/auth/register (missing fields → 400)" "$R" "$B" "400" ""

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer $CAND_TOKEN")
B=$(cat /tmp/sb_body)
check "GET /api/auth/me (valid token)" "$R" "$B" "200" "CANDIDATE"

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer INVALIDTOKEN")
B=$(cat /tmp/sb_body)
check "GET /api/auth/me (invalid token → 401)" "$R" "$B" "401" ""

# 4. JOBS Listing
echo -e "\n${BOLD}[4] Jobs — Listing & Details${NC}"
R=$(curl -s -o /tmp/sb_body -w "%{http_code}" "$BASE/jobs")
B=$(cat /tmp/sb_body)
check "GET /api/jobs (list all jobs)" "$R" "$B" "200" "jobs"
JOB_COUNT=$(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('count',0))" 2>/dev/null)
JOB_ID=$(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); jobs=d.get('jobs',[]); print(jobs[0]['id'] if jobs else 'job_1')" 2>/dev/null)
echo "    → Total jobs returned: $JOB_COUNT"

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" "$BASE/jobs/$JOB_ID")
B=$(cat /tmp/sb_body)
check "GET /api/jobs/:id (valid job detail)" "$R" "$B" "200" "job"

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" "$BASE/jobs/nonexistent_id_xyz")
B=$(cat /tmp/sb_body)
check "GET /api/jobs/:id (invalid id → 404)" "$R" "$B" "404" ""

# 5. Jobs Create
echo -e "\n${BOLD}[5] Jobs — Create (EMPLOYER)${NC}"
R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -d '{"title":"API Test Engineer","description":"We need a great test engineer with automation expertise","location":"Remote","isRemote":true,"salaryRange":"$100k-$130k","skills":["Jest","Cypress","Node.js"]}')
B=$(cat /tmp/sb_body)
check "POST /api/jobs (employer creates job)" "$R" "$B" "201" "job"
NEW_JOB_ID=$(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('job',{}).get('id','job_1'))" 2>/dev/null)

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CAND_TOKEN" \
  -d '{"title":"Sneaky Job","description":"Candidate trying to post","location":"Remote"}')
B=$(cat /tmp/sb_body)
check "POST /api/jobs (candidate tries → 403)" "$R" "$B" "403" ""

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/jobs" \
  -H "Content-Type: application/json" \
  -d '{"title":"No Auth Job","description":"no auth","location":"Remote"}')
B=$(cat /tmp/sb_body)
check "POST /api/jobs (no auth → 401)" "$R" "$B" "401" ""

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/jobs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -d '{"title":"Missing Fields Only"}')
B=$(cat /tmp/sb_body)
check "POST /api/jobs (missing fields → 400)" "$R" "$B" "400" ""

# 6. Apply
echo -e "\n${BOLD}[6] Jobs — Apply${NC}"
R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/jobs/$NEW_JOB_ID/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CAND_TOKEN" \
  -d '{"coverLetter":"I am very excited to apply for this position!"}')
B=$(cat /tmp/sb_body)
check "POST /api/jobs/:id/apply (candidate applies)" "$R" "$B" "201" "application"

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/jobs/job_1/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -d '{"coverLetter":"Employer trying to apply"}')
B=$(cat /tmp/sb_body)
check "POST /api/jobs/:id/apply (employer tries → 403)" "$R" "$B" "403" ""

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/jobs/job_1/apply" \
  -H "Content-Type: application/json" \
  -d '{"coverLetter":"No auth apply"}')
B=$(cat /tmp/sb_body)
check "POST /api/jobs/:id/apply (no auth → 401)" "$R" "$B" "401" ""

# 7. SEARCH - Heuristic
echo -e "\n${BOLD}[7] Smart Search — Heuristic Path${NC}"
R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/search/ai-search" \
  -H "Content-Type: application/json" \
  -d '{"query":"node developer"}')
B=$(cat /tmp/sb_body)
check "POST /api/search/ai-search (node developer)" "$R" "$B" "200" "jobs"
echo "    → Engine: $(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('searchEngine','?'))" 2>/dev/null) | Results: $(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('resultCount','?'))" 2>/dev/null)"

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/search/ai-search" \
  -H "Content-Type: application/json" \
  -d '{"query":"react remote"}')
B=$(cat /tmp/sb_body)
check "POST /api/search/ai-search (react remote)" "$R" "$B" "200" "jobs"
echo "    → Engine: $(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('searchEngine','?'))" 2>/dev/null) | Results: $(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('resultCount','?'))" 2>/dev/null)"

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/search/ai-search" \
  -H "Content-Type: application/json" \
  -d '{"query":"python india"}')
B=$(cat /tmp/sb_body)
check "POST /api/search/ai-search (python india)" "$R" "$B" "200" "jobs"
echo "    → Engine: $(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('searchEngine','?'))" 2>/dev/null) | Results: $(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('resultCount','?'))" 2>/dev/null)"

# 8. SEARCH - AI/Complex
echo -e "\n${BOLD}[8] Smart Search — AI/Complex Path${NC}"
R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/search/ai-search" \
  -H "Content-Type: application/json" \
  -d '{"query":"I want a remote senior react developer role with competitive salary"}')
B=$(cat /tmp/sb_body)
check "POST /api/search/ai-search (complex AI query)" "$R" "$B" "200" "jobs"
echo "    → Engine: $(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('searchEngine','?'))" 2>/dev/null) | Results: $(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('resultCount','?'))" 2>/dev/null)"

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/search/ai-search" \
  -H "Content-Type: application/json" \
  -d '{"query":"recommend me a node role based on my skills and experience"}')
B=$(cat /tmp/sb_body)
check "POST /api/search/ai-search (recommend query)" "$R" "$B" "200" "jobs"
echo "    → Engine: $(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('searchEngine','?'))" 2>/dev/null) | Results: $(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('resultCount','?'))" 2>/dev/null)"

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/search/ai-search" \
  -H "Content-Type: application/json" \
  -d '{}')
B=$(cat /tmp/sb_body)
check "POST /api/search/ai-search (empty → 400)" "$R" "$B" "400" ""

# 9. AI Generation
echo -e "\n${BOLD}[9] AI Job Generation${NC}"
R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/ai/generate-job" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -d '{"rawNotes":"5+ years node, microservices, kafka, docker, aws, team lead, agile","title":"Senior Backend Engineer","companyName":"Test Corp"}')
B=$(cat /tmp/sb_body)
check "POST /api/ai/generate-job (employer creates AI description)" "$R" "$B" "200" "formattedDescription"
DESC_LEN=$(echo $B | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',{}).get('formattedDescription','')))" 2>/dev/null)
echo "    → Description length: ${DESC_LEN} chars"

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/ai/generate-job" \
  -H "Content-Type: application/json" \
  -d '{"rawNotes":"test without auth"}')
B=$(cat /tmp/sb_body)
check "POST /api/ai/generate-job (no auth → 401)" "$R" "$B" "401" ""

R=$(curl -s -o /tmp/sb_body -w "%{http_code}" -X POST "$BASE/ai/generate-job" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -d '{"title":"No Notes provided"}')
B=$(cat /tmp/sb_body)
check "POST /api/ai/generate-job (missing rawNotes → 400)" "$R" "$B" "400" ""

# SUMMARY
TOTAL=$((PASS+FAIL))
echo -e "\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║                  TEST RESULTS SUMMARY               ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo -e "  Total Tests:  ${BOLD}$TOTAL${NC}"
echo -e "  ${GREEN}Passed:${NC}        ${BOLD}$PASS${NC}"
echo -e "  ${RED}Failed:${NC}        ${BOLD}$FAIL${NC}"
echo ""
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}🎉 ALL TESTS PASSED!${NC}"
else
  echo -e "  ${RED}${BOLD}⚠️  $FAIL TEST(S) FAILED — check details above${NC}"
fi
echo ""
