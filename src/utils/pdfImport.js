// Lightweight PDF import utility for the Prior Auth form.
// If pdfjs-dist is available, we'll extract text and try some basic regex mappings.
// If not installed, this will safely return an empty object so the app still runs.

/**
 * Attempt to import a scanned Prior Authorization PDF and map fields.
 * @param {File} file - A PDF file selected from an <input type="file" />
 * @returns {Promise<Object>} A partial formData object to merge into state
 */
export async function importPreAuthPdf(file) {
  if (!file || file.type !== 'application/pdf') return {};

  // Read file into ArrayBuffer
  const buffer = await file.arrayBuffer();

  // Try dynamic import of pdfjs-dist only if it's present in the app.
  // This keeps the project from breaking if the dependency hasn't been installed yet.
  let pdfjsLib;
  try {
    pdfjsLib = await import('pdfjs-dist/build/pdf');
    try {
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
      // eslint-disable-next-line no-underscore-dangle
      pdfjsLib.GlobalWorkerOptions.workerSrc = worker && worker.default ? worker.default : undefined;
    } catch {
      // Worker import failed; pdf.js can still run in "fake worker" mode in modern bundlers.
    }
  } catch {
    // pdfjs-dist not installed; return gracefully.
    return {};
  }

  try {
    const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = '';
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      // eslint-disable-next-line no-await-in-loop
      const page = await doc.getPage(pageNum);
      // eslint-disable-next-line no-await-in-loop
      const content = await page.getTextContent();
      const pageText = content.items.map((i) => (i.str || '')).join(' ');
      text += `\n${pageText}`;
    }

    const out = {};

    // Simple helpers
    const pick = (v) => (v ? v.trim() : '');
    const by = (re, idx = 1) => {
      const m = text.match(re);
      return m ? pick(m[idx]) : '';
    };

    // Heuristic mappings for common fields
    out.healthPlan = by(/Health\s*Plan\s*:?\s*([^\n]+?)(?:Health\s*Plan\s*Fax|Service\s*Type|Provider|$)/i);
    out.healthPlanFax = by(/Health\s*Plan\s*Fax\s*#?\s*:?\s*([+\-()\d\s]{7,})/i);

    // Patient name
    out.name = by(/\*?Patient\s*Name\s*:?\s*([^\n]+?)(?:Male|Female|DOB|Health\s*Insurance|$)/i);

    // DOB
    out.dob = by(/DOB\s*:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i);

    // Gender (best-effort)
    const genderBlock = by(/Male\s*Female[^\n]*/i);
    if (genderBlock) {
      if (/Male\s*\[?x?\]?/i.test(genderBlock) || /Male\s*✓/i.test(genderBlock)) out.gender = 'male';
      if (/Female\s*\[?x?\]?/i.test(genderBlock) || /Female\s*✓/i.test(genderBlock)) out.gender = 'female';
    }

    // Address
    out.address = by(/Address\s*:?\s*([^\n]+?)(?:Email|Phone|Health\s*Insurance|$)/i);

    // Contact info
    const email = by(/Email\s*:?\s*([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/i);
    if (email) out.email = email;
    const phone = by(/Phone\s*Number\s*\*?\s*:?\s*([+\-()\d\s]{10,})/i) || by(/Phone\s*:?\s*([+\-()\d\s]{10,})/i);
    if (phone) out.phoneNumber = phone;

    // Member info
    out.healthInsuranceId = by(/Health\s*Insurance\s*ID#?\s*:?\s*([^\s\n]+)/i);
    out.patientAccountNumber = by(/Patient\s*Account\s*\/\s*Control\s*Number\s*:?\s*([^\s\n]+)/i);

    // Diagnosis snippets (keep as free text)
    out.principalDiagnosisDescription = by(/\*?Principal\s*Diagnosis\s*Description\s*:?\s*([^\n]+)/i);
    out.principalDiagnosisICD10 = by(/ICD-10\s*Codes?\s*:?\s*([A-Z0-9.,\s-]+)/i);

    // Normalize some fields if present
    if (out.age) {
      const ageNum = String(out.age).match(/\d{1,3}/);
      out.age = ageNum ? ageNum[0] : '';
    }

    return out;
  } catch (err) {
    console.error('PDF parse error:', err);
    return {};
  }
}

export default importPreAuthPdf;
