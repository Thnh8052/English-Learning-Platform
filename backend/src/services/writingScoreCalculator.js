/**
 * Làm tròn điểm theo hệ điểm IELTS (0.5)
 */
function roundToIELTSBand(score) {
  return Math.round(score * 2) / 2;
}

/**
 * Kiểm tra tính hợp lệ của dữ liệu đầu vào
 */
function validateCriteria(criteria) {
  const requiredKeys = [
    "taskResponse",
    "coherence",
    "lexical",
    "grammar"
  ];

  for (const key of requiredKeys) {
    if (!criteria[key] || typeof criteria[key].score !== "number") {
      throw new Error(`Thiếu hoặc sai dữ liệu tiêu chí: ${key}`);
    }
  }
}

/**
 * Tính điểm trung bình cộng của 4 tiêu chí
 */
function calculateAverage(criteria) {
  const scores = [
    criteria.taskResponse.score,
    criteria.coherence.score,
    criteria.lexical.score,
    criteria.grammar.score
  ];
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * 🚨 LOGIC CHẤM ĐIỂM NGHIÊM NGẶT
 * Áp dụng các mức điểm trần (Hard Caps) dựa trên lỗi lạc đề
 */
function calculateOverall(criteria, isOffTopic) {
  validateCriteria(criteria);

  let average = calculateAverage(criteria);
  let overall = roundToIELTSBand(average);

  // 1. TRƯỜNG HỢP LẠC ĐỀ HOÀN TOÀN
  // Khóa điểm ở mức 4.0 bất kể các tiêu chí khác
  if (isOffTopic === true) {
    return Math.min(4.0, overall);
  }

  // 2. TRƯỜNG HỢP TASK RESPONSE YẾU (Lạc đề một phần)
  // Nếu TR <= 5.0, điểm Overall tối đa là 5.5
  if (criteria.taskResponse.score <= 5.0) {
    return Math.min(5.5, overall);
  }

  // 3. TRƯỜNG HỢP NGỮ PHÁP HOẶC TỪ VỰNG QUÁ YẾU
  if (criteria.grammar.score < 5.0 || criteria.lexical.score < 5.0) {
    return Math.min(5.5, overall);
  }

  return overall;
}

/**
 * Trả về kết quả đầy đủ bao gồm cả các cảnh báo vi phạm
 */
export function calculateFullResult(criteria, isOffTopic) {
  const average = calculateAverage(criteria);
  // Bây giờ hàm này sẽ tìm thấy calculateOverall vì nó đã được khai báo ở trên
  const overall = calculateOverall(criteria, isOffTopic);

  return {
    averageScore: roundToIELTSBand(average),
    overallScore: overall,
    isOffTopic: isOffTopic === true,
    gatesTriggered: {
      offTopic: isOffTopic === true,
      weakTaskResponse: criteria.taskResponse.score <= 5.0,
      weakGrammar: criteria.grammar.score < 5.0,
      weakLexical: criteria.lexical.score < 5.0
    }
  };
}

// Export default ở cuối file để đảm bảo tính nhất quán
export default calculateOverall;