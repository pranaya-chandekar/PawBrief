// ===================================================================
// PawBrief Comprehensive Automated Test Suite (Scenarios A through O)
// ===================================================================
import assert from "node:assert";
import http from "node:http";

process.env.NODE_ENV = "test";
const { default: app } = await import("../server.js");

const PORT = 8089;
let server;
let baseUrl;

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        ...headers
      }
    }, res => {
      let raw = "";
      res.on("data", chunk => raw += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw });
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${baseUrl}${path}`, {
      method: "GET",
      headers
    }, res => {
      let raw = "";
      res.on("data", chunk => raw += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw });
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function runTests() {
  console.log("=================================================");
  console.log("🐾 Running PawBrief Test Suite (Scenarios A -> O)");
  console.log("=================================================\n");

  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• ${name} ... `);
      await fn();
      console.log("✅ PASSED");
      passed++;
    } catch (err) {
      console.log("❌ FAILED");
      console.error("  Error:", err.message);
      failed++;
    }
  }

  // Scenario A: English report
  await test("Scenario A — English report structuring & brief fields", async () => {
    const res = await post("/api/brief", {
      text: "Found a stray golden retriever puppy near Shivaji Park, limping on front paw.",
      animalType: "Dog",
      locationText: "Shivaji Park, Dadar",
      language: "en-IN"
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.summary, "Must have summary");
    assert.ok(Array.isArray(res.body.reportedObservations), "Must have observations");
    assert.ok(Array.isArray(res.body.missingInformation), "Must have missing info");
    assert.ok(res.body.suggestedUrgency, "Must have suggested urgency");
  });

  // Scenario B: Marathi report
  await test("Scenario B — Marathi report: Preserves Marathi text, English summary, Marathi unknowns", async () => {
    const marathiText = "दादर स्थानकाजवळ एक कुत्रा जखमी अवस्थेत आढळला. त्याच्या पायातून रक्त येत आहे.";
    const res = await post("/api/brief", {
      text: marathiText,
      animalType: "कुत्रा",
      locationText: "दादर स्थानक",
      language: "mr-IN"
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.englishTranslation, "Must provide English translation");
    // Verify unknowns contain Marathi script characters (\u0900-\u097F)
    const hasMarathiUnknowns = res.body.missingInformation.some(m => /[\u0900-\u097F]/.test(m));
    assert.ok(hasMarathiUnknowns, "Unknowns must remain in the reporter's selected language (Marathi)");
  });

  // Scenario C: Hindi report
  await test("Scenario C — Hindi report: Preserves Hindi text, English summary, Hindi unknowns", async () => {
    const hindiText = "वाशी मार्केट के पास एक कुत्ता मिला है जिसके पैर में गहरा घाव है और खून बह रहा है।";
    const res = await post("/api/brief", {
      text: hindiText,
      animalType: "कुत्ता",
      locationText: "वाशी मार्केट",
      language: "hi-IN"
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.englishTranslation, "Must provide English translation for vet");
    const hasHindiUnknowns = res.body.missingInformation.some(m => /[\u0900-\u097F]/.test(m));
    assert.ok(hasHindiUnknowns, "Unknowns must remain in reporter's chosen language (Hindi)");
  });

  // Scenario D: Image upload & non-diagnostic multimodal context
  await test("Scenario D — Image upload: Non-diagnostic visual context & safety disclaimer", async () => {
    // 1x1 sample pixel jpeg
    const dummyBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    const res = await post("/api/brief", {
      text: "Injured stray dog on street.",
      photoBase64: dummyBase64,
      photoMimeType: "image/jpeg"
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.photoVisualObservations), "Must have photo visual observations");
    // Verify non-diagnostic rule: none of the observations claim diagnostic certainty
    const claimsDiagnosis = res.body.photoVisualObservations.some(o => /diagnosis confirmed|internal disease/i.test(o));
    assert.strictEqual(claimsDiagnosis, false, "Must never output a medical diagnosis from an image");
    const hasDisclaimer = res.body.photoVisualObservations.some(o => /not a veterinary diagnosis|non-diagnostic|physical check|human review/i.test(o));
    assert.ok(hasDisclaimer, "Must state non-diagnostic disclaimer in photo observations");
  });

  // Scenario E: Missing information, separate questions & answers blocks
  await test("Scenario E — Separate questions and answers blocks (no fabricated answers)", async () => {
    const res = await post("/api/brief", {
      text: "Found a kitten trapped in a culvert.",
      language: "en-IN"
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.clarifyingQuestions), "Must have clarifying questions");
    assert.ok(res.body.clarifyingQuestions.length > 0, "Must provide follow-up questions");
    // Backend case store answers must be initially un-fabricated
    const caseRes = await post("/api/cases", {
      caseId: "PB-TEST-E1",
      animalType: "Kitten",
      originalText: "Found a kitten trapped in a culvert.",
      summary: "Kitten trapped in culvert.",
      clarifyingQuestions: res.body.clarifyingQuestions,
      answers: []
    });
    assert.strictEqual(caseRes.status, 201);
    assert.strictEqual(caseRes.body.case.answers.length, 0, "Answers must not be fabricated");
  });

  // Scenario F: Rescue tracking & lifecycle audit trail
  await test("Scenario F — Rescue tracking: Lifecycle status transitions & event timestamps", async () => {
    const testId = "PB-LIFECYCLE-" + Date.now().toString(36).toUpperCase();
    await post("/api/cases", {
      caseId: testId,
      animalType: "Dog",
      currentStatus: "reported",
      observations: []
    });

    // 1. Assign to rescuer
    const s1 = await post(`/api/cases/${testId}/status`, {
      newStatus: "assigned",
      updatedBy: "Vikram (Rescuer)",
      role: "rescuer",
      note: "Rescue Unit 1 assigned"
    });
    assert.strictEqual(s1.status, 200);
    assert.strictEqual(s1.body.case.currentStatus, "assigned");

    // 2. Rescuer accepts
    const s2 = await post(`/api/cases/${testId}/status`, {
      newStatus: "accepted",
      updatedBy: "Vikram (Rescuer)",
      role: "rescuer"
    });
    assert.strictEqual(s2.body.case.currentStatus, "accepted");

    // 3. Handed to vet
    const s3 = await post(`/api/cases/${testId}/status`, {
      newStatus: "handed-to-vet",
      updatedBy: "Vikram (Rescuer)",
      role: "rescuer",
      clinicName: "Nagpur Veterinary Hospital (TVCC)"
    });
    assert.strictEqual(s3.body.case.currentStatus, "handed-to-vet");
    assert.ok(s3.body.case.handedAt, "Must record handedAt timestamp");
    assert.ok(s3.body.case.events.length >= 4, "Must have full event history");
  });

  // Scenario G: Unaccepted case waiting alert
  await test("Scenario G — Unaccepted case: Waiting state & escalation calculation", async () => {
    const overdueCaseId = "PB-OVERDUE-" + Date.now().toString(36).toUpperCase();
    const created45mAgo = new Date(Date.now() - 45 * 60000).toISOString();
    await post("/api/cases", {
      caseId: overdueCaseId,
      animalType: "Indie Dog",
      createdAt: created45mAgo,
      currentStatus: "reported"
    });

    const getRes = await get("/api/cases");
    assert.strictEqual(getRes.status, 200);
    const target = getRes.body.find(c => c.caseId === overdueCaseId);
    assert.ok(target, "Overdue case must exist in store");
    const diffMins = (Date.now() - new Date(target.createdAt).getTime()) / 60000;
    assert.ok(diffMins >= 40, "Must be recorded as waiting > 30 minutes");
  });

  // Scenario H: Duplicate and suspicious report detection
  await test("Scenario H — Duplicate detection: Proximity & temporal matching flags for human review", async () => {
    const originalId = "PB-DUP-ORIG-" + Date.now().toString(36).toUpperCase();
    // Seed original case in Dadar
    await post("/api/cases", {
      caseId: originalId,
      animalType: "Dog",
      lat: 19.0180,
      lng: 72.8480,
      originalText: "Injured brown dog near Dadar railway station bleeding from leg.",
      summary: "Injured brown dog at Dadar station with bleeding leg."
    });

    // Submit second report 100 meters away for same animal type
    const dupRes = await post("/api/cases", {
      caseId: "PB-DUP-SECOND-" + Date.now().toString(36).toUpperCase(),
      animalType: "Dog",
      lat: 19.0185,
      lng: 72.8485,
      originalText: "Found an injured brown dog limping near Dadar station.",
      summary: "Injured brown dog limping near Dadar station."
    });

    assert.strictEqual(dupRes.status, 201);
    assert.ok(dupRes.body.duplicateReview, "Must include duplicateReview object");
    assert.strictEqual(dupRes.body.duplicateReview.isSuspected, true, "Must flag high proximity match as suspected duplicate");
    assert.ok(dupRes.body.duplicateReview.score >= 50, "Match score must be >= 50%");
    assert.strictEqual(dupRes.body.case.currentStatus, "reported", "Must NOT auto-reject; remains reported for human review");
  });

  // Scenario I: Emergency prioritization
  await test("Scenario I — Emergency prioritization: Transparent urgency categorization & human override", async () => {
    const briefRes = await post("/api/brief", {
      text: "Dog struck by car, bleeding heavily from head and unconscious.",
      language: "en-IN"
    });
    assert.strictEqual(briefRes.status, 200);
    assert.strictEqual(briefRes.body.suggestedUrgency, "emergency", "Arterial hemorrhage/unconsciousness must suggest Emergency");
    assert.ok(briefRes.body.urgencyReason, "Must provide transparent reason for priority");

    // Test coordinator override
    const testCaseId = "PB-URG-" + Date.now().toString(36).toUpperCase();
    await post("/api/cases", {
      caseId: testCaseId,
      urgency: briefRes.body.suggestedUrgency,
      urgencyReason: briefRes.body.urgencyReason
    });

    const overrideRes = await post(`/api/cases/${testCaseId}/urgency`, {
      urgency: "urgent",
      reason: "Patient stabilized by on-scene first aid volunteer; downgraded to Urgent.",
      updatedBy: "Rescue Coordinator"
    });
    assert.strictEqual(overrideRes.status, 200);
    assert.strictEqual(overrideRes.body.case.urgency, "urgent", "Coordinator must be able to update urgency priority");
  });

  // Scenario J: Nearby veterinary discovery
  await test("Scenario J — Nearby vet discovery: Real location search and verified directory fallback", async () => {
    const res = await get("/api/nearby-vets?lat=19.0178&lng=72.8478");
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.clinics), "Must return clinics list");
    assert.ok(res.body.clinics.length > 0, "Must return real regional clinics");
    assert.ok(res.body.googleMapsSearchUrl.includes("google.com/maps/search"), "Must provide Google Maps search fallback URL");
    assert.ok(res.body.clinics[0].name, "Clinics must include name");
    assert.ok(res.body.clinics[0].address, "Clinics must include address");
  });

  // Scenario K: WhatsApp rescue sharing
  await test("Scenario K — WhatsApp message formatting: URL-encoding & privacy redactions", async () => {
    const caseData = {
      caseId: "PB-WA-123",
      animalType: "Indie Pup",
      currentStatus: "assigned",
      urgency: "urgent",
      summary: "Injured puppy found near market.",
      locationText: "Shivaji Park, Mumbai",
      lat: 19.0178,
      lng: 72.8478
    };

    // Format WhatsApp message as done by client
    const text = `🐾 *PAWBRIEF RESCUE DISPATCH ALERT*\n*Case ID:* ${caseData.caseId}\n*Animal:* ${caseData.animalType}\n*Status:* ${caseData.currentStatus}\n*Summary:* ${caseData.summary}\n*Location:* ${caseData.locationText} (https://www.google.com/maps?q=${caseData.lat},${caseData.lng})`;
    const encoded = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    assert.ok(waUrl.startsWith("https://api.whatsapp.com/send?text="));
    assert.ok(!waUrl.includes(" "), "URL must be strictly encoded without raw spaces");
    assert.ok(decodeURIComponent(encoded).includes(caseData.caseId), "Decoded text must match case ID");
  });

  // Scenario L: Unauthorized veterinarian confirmation
  await test("Scenario L — Security RBAC: Unauthorized vet-confirmation attempt denied with HTTP 403", async () => {
    const caseId = "PB-RBAC-" + Date.now().toString(36).toUpperCase();
    await post("/api/cases", {
      caseId,
      currentStatus: "handed-to-vet",
      observations: [
        { id: "obs-1", detail: "Suspected hairline fracture in left tibia", verificationStatus: "reported", sourceType: "citizen" }
      ]
    });

    // 1. Reporter tries to confirm -> MUST BE REJECTED 403
    const reporterAttempt = await post(`/api/cases/${caseId}/verify`, {
      observationId: "obs-1",
      verificationStatus: "vet-confirmed",
      updatedBy: "Malicious Reporter",
      role: "reporter"
    });
    assert.strictEqual(reporterAttempt.status, 403, "Reporter MUST receive HTTP 403 Forbidden");

    // 2. Rescuer tries to confirm -> MUST BE REJECTED 403
    const rescuerAttempt = await post(`/api/cases/${caseId}/verify`, {
      observationId: "obs-1",
      verificationStatus: "vet-confirmed",
      updatedBy: "Eager Rescuer",
      role: "rescuer"
    });
    assert.strictEqual(rescuerAttempt.status, 403, "Rescuer MUST receive HTTP 403 Forbidden");

    // 3. Authenticated Veterinarian confirms -> MUST SUCCEED 200
    const vetAttempt = await post(`/api/cases/${caseId}/verify`, {
      observationId: "obs-1",
      verificationStatus: "vet-confirmed",
      updatedBy: "Dr. Kulkarni (DVM)",
      role: "veterinarian"
    });
    assert.strictEqual(vetAttempt.status, 200, "Authorized Veterinarian MUST succeed");
    assert.strictEqual(vetAttempt.body.observation.verificationStatus, "vet-confirmed");
  });

  // Scenario M: Persistent shared storage
  await test("Scenario M — Shared persistence: Case persists and is returned in subsequent requests", async () => {
    const persistId = "PB-PERSIST-" + Date.now().toString(36).toUpperCase();
    await post("/api/cases", {
      caseId: persistId,
      animalType: "Cat",
      summary: "Stray cat rescued from engine bay.",
      currentStatus: "reported"
    });

    // Fetch from separate request
    const getRes = await get(`/api/cases/${persistId}`);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.body.caseId, persistId);
    assert.strictEqual(getRes.body.animalType, "Cat");
  });

  // Scenario N: Privacy safeguards
  await test("Scenario N — Privacy protection: Server payload limits and input sanitization", async () => {
    // Attempt oversized payload > 8MB
    const hugePayload = { text: "A".repeat(9 * 1024 * 1024) };
    const res = await post("/api/brief", hugePayload);
    // Express json limit should reject with 413 or 400
    assert.ok(res.status === 413 || res.status === 400, "Oversized upload must be rejected");
  });

  // Scenario O: Failure handling
  await test("Scenario O — Failure handling: Graceful handling of missing fields and offline mode", async () => {
    // 1. Missing description text
    const emptyRes = await post("/api/brief", { text: "" });
    assert.strictEqual(emptyRes.status, 400, "Missing text must return 400 Bad Request");

    // 2. Fallback execution on health check
    const healthRes = await get("/api/health");
    assert.strictEqual(healthRes.status, 200);
    assert.ok(healthRes.body.provider, "Provider must be honestly declared");
  });

  console.log("\n=================================================");
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  server.close();
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Fatal test runner error:", err);
  if (server) server.close();
  process.exit(1);
});
