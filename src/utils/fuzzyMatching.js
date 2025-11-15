// Fuzzy matching utilities for intelligent vendor/employee matching

// Levenshtein distance algorithm for string similarity
export const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Normalize string for comparison
const normalize = (str) => {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

// Find best match from a list with confidence score
export const findBestMatch = (searchName, dataList, threshold = 0.6) => {
  if (!searchName || !dataList || dataList.length === 0) return null;
  
  const searchNorm = normalize(searchName);
  
  let bestMatch = null;
  let bestScore = 0;
  
  dataList.forEach(item => {
    const itemName = item.name || item.payeeName || '';
    const itemNorm = normalize(itemName);
    
    // Exact match
    if (itemNorm === searchNorm) {
      bestMatch = item;
      bestScore = 1.0;
      return;
    }
    
    // Contains match (partial)
    if (itemNorm.includes(searchNorm) || searchNorm.includes(itemNorm)) {
      const longerLen = Math.max(searchNorm.length, itemNorm.length);
      const shorterLen = Math.min(searchNorm.length, itemNorm.length);
      const containsScore = shorterLen / longerLen;
      
      if (containsScore > bestScore) {
        bestMatch = item;
        bestScore = containsScore * 0.95; // Slightly lower than exact
      }
    }
    
    // Levenshtein distance for typo tolerance
    const distance = levenshteinDistance(searchNorm, itemNorm);
    const maxLen = Math.max(searchNorm.length, itemNorm.length);
    const similarity = 1 - (distance / maxLen);
    
    if (similarity > bestScore && similarity >= threshold) {
      bestMatch = item;
      bestScore = similarity;
    }
  });
  
  return bestMatch ? { match: bestMatch, confidence: bestScore } : null;
};

// Match multiple items at once (for bulk upload)
export const matchBatch = (items, masterDataList, threshold = 0.6) => {
  return items.map(item => ({
    original: item,
    match: findBestMatch(item.name, masterDataList, threshold)
  }));
};

// Get match confidence label
export const getConfidenceLabel = (score) => {
  if (score >= 0.95) return 'High';
  if (score >= 0.8) return 'Medium';
  if (score >= 0.6) return 'Low';
  return 'Very Low';
};

// Check if match needs user confirmation
export const needsConfirmation = (confidence) => {
  return confidence < 0.9;
};
