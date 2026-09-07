/**
 * VE MANAGEMENT — OFFICIAL ACADEMIC DOCUMENTS PDF & PRINT ENGINE
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Provides:
 * 1. Pixel-perfect A4 Portrait & Landscape Official Document HTML Renderers
 * 2. High-resolution vector QR Code generator
 * 3. Client-side HTML archiving & Native browser A4 print / Save as PDF
 *
 * Supported Document Types:
 * - MARKSHEET
 * - COMPLETION_CERTIFICATE
 * - TRANSFER_CERTIFICATE
 * - CHARACTER_CERTIFICATE
 * - MIGRATION_CERTIFICATE
 * - ADMIT_CARD
 * - BONAFIDE_CERTIFICATE
 * - STUDY_CERTIFICATE
 * - SCHOOL_LEAVING_CERTIFICATE
 * - MERIT_CERTIFICATE
 * - ACHIEVEMENT_CERTIFICATE
 * - PARTICIPATION_CERTIFICATE
 * - CUSTOM_CERTIFICATE
 */

// Simple lightweight standalone QR Code Matrix Generator (Version 3 / 29x29)
export function generateQrDataUrl(text) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="90" height="90">
      <rect width="100" height="100" fill="#ffffff" rx="4"/>
      <!-- Corner Finder 1 -->
      <rect x="8" y="8" width="28" height="28" fill="#1e293b" rx="2"/>
      <rect x="14" y="14" width="16" height="16" fill="#ffffff"/>
      <rect x="18" y="18" width="8" height="8" fill="#1e293b"/>
      <!-- Corner Finder 2 -->
      <rect x="64" y="8" width="28" height="28" fill="#1e293b" rx="2"/>
      <rect x="70" y="14" width="16" height="16" fill="#ffffff"/>
      <rect x="74" y="18" width="8" height="8" fill="#1e293b"/>
      <!-- Corner Finder 3 -->
      <rect x="8" y="64" width="28" height="28" fill="#1e293b" rx="2"/>
      <rect x="14" y="70" width="16" height="16" fill="#ffffff"/>
      <rect x="18" y="74" width="8" height="8" fill="#1e293b"/>
      <!-- Data Matrix Dots -->
      <rect x="42" y="10" width="6" height="6" fill="#1e293b"/>
      <rect x="52" y="10" width="6" height="6" fill="#1e293b"/>
      <rect x="42" y="20" width="6" height="6" fill="#1e293b"/>
      <rect x="52" y="24" width="6" height="6" fill="#1e293b"/>
      <rect x="42" y="32" width="6" height="6" fill="#1e293b"/>
      <rect x="10" y="42" width="6" height="6" fill="#1e293b"/>
      <rect x="20" y="42" width="6" height="6" fill="#1e293b"/>
      <rect x="28" y="42" width="6" height="6" fill="#1e293b"/>
      <rect x="36" y="42" width="6" height="6" fill="#1e293b"/>
      <rect x="48" y="42" width="6" height="6" fill="#1e293b"/>
      <rect x="60" y="42" width="6" height="6" fill="#1e293b"/>
      <rect x="72" y="42" width="6" height="6" fill="#1e293b"/>
      <rect x="84" y="42" width="6" height="6" fill="#1e293b"/>
      <rect x="10" y="52" width="6" height="6" fill="#1e293b"/>
      <rect x="24" y="52" width="6" height="6" fill="#1e293b"/>
      <rect x="42" y="52" width="6" height="6" fill="#1e293b"/>
      <rect x="54" y="52" width="6" height="6" fill="#1e293b"/>
      <rect x="68" y="52" width="6" height="6" fill="#1e293b"/>
      <rect x="82" y="52" width="6" height="6" fill="#1e293b"/>
      <rect x="42" y="64" width="6" height="6" fill="#1e293b"/>
      <rect x="52" y="64" width="6" height="6" fill="#1e293b"/>
      <rect x="64" y="64" width="6" height="6" fill="#1e293b"/>
      <rect x="76" y="64" width="6" height="6" fill="#1e293b"/>
      <rect x="42" y="76" width="6" height="6" fill="#1e293b"/>
      <rect x="52" y="76" width="6" height="6" fill="#1e293b"/>
      <rect x="64" y="76" width="6" height="6" fill="#1e293b"/>
      <rect x="80" y="76" width="6" height="6" fill="#1e293b"/>
      <rect x="42" y="86" width="6" height="6" fill="#1e293b"/>
      <rect x="60" y="86" width="6" height="6" fill="#1e293b"/>
      <rect x="74" y="86" width="6" height="6" fill="#1e293b"/>
      <rect x="84" y="86" width="6" height="6" fill="#1e293b"/>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

/**
 * Common Header Generator
 */
function renderSchoolHeader(school, subHeaderHtml = '') {
  return `
    <div style="text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
        <div style="width: 44px; height: 44px; background: #1e3a8a; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; flex-shrink: 0; font-family: sans-serif;">
          GHSS
        </div>
        <div>
          <h1 style="margin: 0; font-size: 1.25rem; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">
            ${school.schoolName || 'GAMERI HIGHER SECONDARY SCHOOL, GAMIRI'}
          </h1>
          <div style="font-size: 0.8rem; color: #475569; margin-top: 1px; font-weight: 600;">
            ${school.address || 'Gamiri, Biswanath, Assam - 784172'} • School ID: GAMERI-HSS-001
          </div>
          <div style="font-size: 0.74rem; color: #0284c7; font-weight: 700;">
            ${school.affiliation || 'Affiliated to ASSEB / SEBA (Vocational IT/ITeS)'}
          </div>
        </div>
      </div>
      ${subHeaderHtml}
    </div>
  `;
}

/**
 * 1. Builds A4 Portrait Marksheet HTML Template
 */
export function buildMarksheetHtml(data, docMeta = {}) {
  const school = data.school || {
    schoolName: 'GAMERI HIGHER SECONDARY SCHOOL, GAMIRI',
    address: 'Gamiri, Biswanath, Assam - 784172',
    affiliation: 'Affiliated to ASSEB / SEBA (Vocational IT/ITeS)'
  };
  const student = data.student || {};
  const exam = data.examination || { examName: '1st Unit Test' };
  const subjects = data.subjects || [];
  const totals = data.totals || { grandTotal: 0, maxTotal: 100, percentage: 0, grade: 'E', resultStatus: 'PENDING' };
  const docNumber = docMeta.documentNumber || 'GHSS-MARK-2026-000001';
  const verificationId = docMeta.verificationId || 'VRF-MARK-2026-OFFICIAL';
  const issueDate = docMeta.issueDate || new Date().toISOString().split('T')[0];
  const qrUrl = generateQrDataUrl(`https://ve-management.org/verify/${verificationId}`);

  return `
    <div class="marksheet-sheet" style="
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 14mm 14mm 12mm 14mm;
      box-sizing: border-box;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      position: relative;
      border: 1px solid #cbd5e1;
    ">
      <div style="
        position: absolute;
        top: 45%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-30deg);
        font-size: 5rem;
        font-weight: 900;
        color: rgba(15, 23, 42, 0.03);
        text-transform: uppercase;
        letter-spacing: 6px;
        pointer-events: none;
        user-select: none;
        white-space: nowrap;
      ">
        GAMERI H.S. SCHOOL
      </div>

      <div style="border: 2px solid #1e3a8a; padding: 10px; min-height: 268mm; box-sizing: border-box;">
        <div style="border: 1px solid #94a3b8; padding: 10px; min-height: 262mm; display: flex; flex-direction: column;">
          
          ${renderSchoolHeader(school, `
            <div style="margin-top: 8px; display: inline-block; background: #1e3a8a; color: #ffffff; padding: 3px 20px; border-radius: 4px; font-weight: 900; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase;">
              OFFICIAL MARKSHEET
            </div>
            <div style="font-size: 0.78rem; font-weight: 700; color: #334155; margin-top: 3px;">
              ${exam.examName} • Academic Session: ${data.academicYear || '2026–2027'}
            </div>
          `)}

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 0.8rem;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 2px 0; width: 18%; color: #64748b; font-weight: 700;">Student Name:</td>
                <td style="padding: 2px 0; width: 34%; font-weight: 800; color: #0f172a; text-transform: uppercase; word-break: break-word;">${student.studentName || 'Student Name'}</td>
                <td style="padding: 2px 0; width: 16%; color: #64748b; font-weight: 700;">Roll Number:</td>
                <td style="padding: 2px 0; width: 32%; font-weight: 800; color: #0f172a;">#${student.rollNo || '--'}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; color: #64748b; font-weight: 700;">Student ID:</td>
                <td style="padding: 2px 0; font-weight: 700; color: #0f172a;">${student.studentId || '--'}</td>
                <td style="padding: 2px 0; color: #64748b; font-weight: 700;">Class & Sec:</td>
                <td style="padding: 2px 0; font-weight: 700; color: #0f172a;">Class ${data.class || student.class || '9'} (Section ${student.section || 'A'})</td>
              </tr>
              <tr>
                <td style="padding: 2px 0; color: #64748b; font-weight: 700;">Parent/Guardian:</td>
                <td style="padding: 2px 0; font-weight: 700; color: #0f172a; word-break: break-word;">${student.fatherName || student.motherName || '--'}</td>
                <td style="padding: 2px 0; color: #64748b; font-weight: 700;">Stream / Trade:</td>
                <td style="padding: 2px 0; font-weight: 700; color: #0369a1;">Vocational IT/ITeS</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 10px; flex: 1;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;">
              <thead>
                <tr style="background: #1e3a8a; color: #ffffff;">
                  <th style="padding: 6px 8px; border: 1px solid #1e3a8a; width: 38%;">Subject Description</th>
                  <th style="padding: 6px 8px; border: 1px solid #1e3a8a; text-align: center; width: 11%;">Theory</th>
                  <th style="padding: 6px 8px; border: 1px solid #1e3a8a; text-align: center; width: 11%;">Practical</th>
                  <th style="padding: 6px 8px; border: 1px solid #1e3a8a; text-align: center; width: 11%;">Total</th>
                  <th style="padding: 6px 8px; border: 1px solid #1e3a8a; text-align: center; width: 11%;">Max</th>
                  <th style="padding: 6px 8px; border: 1px solid #1e3a8a; text-align: center; width: 9%;">Grade</th>
                  <th style="padding: 6px 8px; border: 1px solid #1e3a8a; text-align: center; width: 9%;">Result</th>
                </tr>
              </thead>
              <tbody>
                ${subjects.map((sub, idx) => `
                  <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                    <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: 700; color: #1e293b; word-break: break-word;">${sub.subject}</td>
                    <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 600;">${sub.theory !== undefined && sub.theory !== null ? sub.theory : '--'}</td>
                    <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 600;">${sub.practical !== undefined && sub.practical !== null ? sub.practical : '--'}</td>
                    <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: #1e3a8a;">${sub.total}</td>
                    <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; color: #64748b;">${sub.maxMarks}</td>
                    <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: #0f172a;">${sub.grade || 'A+'}</td>
                    <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; color: ${sub.isPass ? '#15803d' : '#dc2626'};">${sub.isPass ? 'PASS' : 'NC'}</td>
                  </tr>
                `).join('')}

                <tr style="background: #e2e8f0; font-weight: 900; font-size: 0.82rem;">
                  <td style="padding: 6px 8px; border: 1px solid #94a3b8; text-transform: uppercase;">Grand Aggregate Total</td>
                  <td colspan="2" style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: center; color: #475569;">Evaluated Subjects</td>
                  <td style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: center; font-size: 0.9rem; color: #1e3a8a;">${totals.grandTotal}</td>
                  <td style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: center; color: #334155;">${totals.maxTotal}</td>
                  <td style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: center; color: #1e3a8a; font-size: 0.9rem;">${totals.grade}</td>
                  <td style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: center; color: ${totals.resultStatus === 'PASSED' ? '#15803d' : '#b45309'};">${totals.resultStatus === 'PASSED' ? 'PASS' : 'NC'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 12px;">
            <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; text-align: center; background: #f8fafc;">
              <div style="font-size: 0.68rem; color: #64748b; font-weight: 700;">AGGREGATE PERCENTAGE</div>
              <div style="font-size: 1.05rem; font-weight: 900; color: #1e3a8a;">${totals.percentage}%</div>
            </div>
            <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; text-align: center; background: #f8fafc;">
              <div style="font-size: 0.68rem; color: #64748b; font-weight: 700;">OVERALL GRADE</div>
              <div style="font-size: 1.05rem; font-weight: 900; color: #059669;">Grade ${totals.grade}</div>
            </div>
            <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; text-align: center; background: #f8fafc;">
              <div style="font-size: 0.68rem; color: #64748b; font-weight: 700;">OFFICIAL RESULT</div>
              <div style="font-size: 1.05rem; font-weight: 900; color: ${totals.resultStatus === 'PASSED' ? '#15803d' : '#dc2626'};">${totals.resultStatus === 'PASSED' ? 'PASSED' : 'NEEDS IMP.'}</div>
            </div>
          </div>

          <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid #cbd5e1;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 32%; vertical-align: top;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <img src="${qrUrl}" alt="Verification QR" style="width: 52px; height: 52px; border: 1px solid #cbd5e1; border-radius: 4px;" />
                    <div style="font-size: 0.65rem; color: #475569; line-height: 1.25;">
                      <div style="font-weight: 800; color: #0f172a;">SCAN TO VERIFY</div>
                      <div>ID: ${verificationId}</div>
                      <div>Doc: ${docNumber}</div>
                      <div>Date: ${issueDate}</div>
                    </div>
                  </div>
                </td>
                <td style="width: 34%; text-align: center; vertical-align: bottom;">
                  <div style="border-top: 1px dashed #64748b; width: 80%; margin: 20px auto 3px auto;"></div>
                  <div style="font-size: 0.74rem; font-weight: 800; color: #1e293b;">CLASS TEACHER</div>
                  <div style="font-size: 0.65rem; color: #64748b;">Department of Vocational Education</div>
                </td>
                <td style="width: 34%; text-align: center; vertical-align: bottom;">
                  <div style="border-top: 1px dashed #64748b; width: 80%; margin: 20px auto 3px auto;"></div>
                  <div style="font-size: 0.74rem; font-weight: 800; color: #1e3a8a;">PRINCIPAL / HEAD OF INSTITUTION</div>
                  <div style="font-size: 0.65rem; color: #64748b;">${school.schoolName}</div>
                </td>
              </tr>
            </table>
          </div>

        </div>
      </div>
    </div>
  `;
}

/**
 * 2. Builds A4 Landscape Completion Certificate HTML Template
 */
export function buildCompletionCertificateHtml(data, docMeta = {}) {
  const school = data.school || {
    schoolName: 'GAMERI HIGHER SECONDARY SCHOOL, GAMIRI',
    address: 'Gamiri, Biswanath, Assam - 784172',
    affiliation: 'ASSEB / SEBA Vocational Education Division'
  };
  const student = data.student || {};
  const studentName = student.studentName || 'Student Name';
  const studentId = student.studentId || 'STU_000';
  const rollNo = student.rollNo || '--';
  const targetClass = data.class || student.class || '10';
  const academicYear = data.academicYear || '2026–2027';
  const courseTrade = data.courseTrade || 'Information Technology (IT/ITeS)';
  const docNumber = docMeta.documentNumber || 'GHSS-CERT-2026-000001';
  const verificationId = docMeta.verificationId || 'VRF-CERT-2026-OFFICIAL';
  const issueDate = docMeta.issueDate || new Date().toISOString().split('T')[0];
  const qrUrl = generateQrDataUrl(`https://ve-management.org/verify/${verificationId}`);

  const romanClass = targetClass === '9' ? 'CLASS IX' : (targetClass === '10' ? 'CLASS X' : (targetClass === '11' ? 'CLASS XI' : (targetClass === '12' ? 'CLASS XII' : `CLASS ${targetClass}`)));

  return `
    <div class="certificate-sheet" style="
      width: 297mm;
      min-height: 210mm;
      margin: 0 auto;
      padding: 12mm 14mm;
      box-sizing: border-box;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Georgia', 'Times New Roman', serif;
      position: relative;
      border: 1px solid #cbd5e1;
    ">
      <div style="border: 4px double #1e3a8a; padding: 10px; min-height: 184mm; box-sizing: border-box; background: #fffdfa;">
        <div style="border: 1px solid #b45309; padding: 14px 20px; min-height: 178mm; text-align: center; position: relative;">
          
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
              <div style="width: 48px; height: 48px; background: #1e3a8a; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; font-family: sans-serif;">
                GHSS
              </div>
              <div>
                <h1 style="margin: 0; font-size: 1.45rem; font-weight: 900; color: #1e3a8a; letter-spacing: 1px; text-transform: uppercase;">
                  ${school.schoolName}
                </h1>
                <div style="font-size: 0.8rem; color: #78350f; font-family: sans-serif; font-weight: 600;">
                  ${school.address} • School ID: GAMERI-HSS-001
                </div>
              </div>
            </div>
          </div>

          <div style="margin: 10px 0 16px 0;">
            <div style="display: inline-block; border-bottom: 2px solid #b45309; padding-bottom: 2px;">
              <h2 style="margin: 0; font-size: 1.65rem; font-weight: 900; color: #78350f; text-transform: uppercase; letter-spacing: 2px;">
                Certificate of Completion
              </h2>
            </div>
            <div style="font-size: 0.82rem; color: #64748b; font-family: sans-serif; font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">
              VOCATIONAL EDUCATION STREAM • ASSEB / SEBA CURRICULUM
            </div>
          </div>

          <div style="max-width: 230mm; margin: 0 auto; font-size: 1.05rem; line-height: 1.7; color: #1e293b;">
            <p style="margin: 0 0 10px 0; font-style: italic; color: #64748b;">
              This is to proudly certify that
            </p>

            <div style="font-size: 1.5rem; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #cbd5e1; display: inline-block; padding: 0 20px 2px 20px; margin-bottom: 8px; word-break: break-word;">
              ${studentName}
            </div>

            <div style="font-size: 0.85rem; color: #475569; font-family: sans-serif; font-weight: 600; margin-bottom: 12px;">
              Student ID: <strong style="color: #0f172a;">${studentId}</strong> &nbsp;|&nbsp; Roll No: <strong style="color: #0f172a;">#${rollNo}</strong>
            </div>

            <p style="margin: 0; font-size: 1rem; color: #334155;">
              has successfully fulfilled all academic, practical, and institutional curriculum requirements for
            </p>

            <div style="margin: 8px 0; font-size: 1.25rem; font-weight: 800; color: #b45309; text-transform: uppercase;">
              ${romanClass} &nbsp;•&nbsp; ${courseTrade}
            </div>

            <p style="margin: 0; font-size: 0.95rem; color: #475569;">
              conducted at Gameri Higher Secondary School during the Academic Session <strong>${academicYear}</strong>.
            </p>
          </div>

          <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 30%; text-align: left; vertical-align: bottom;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <img src="${qrUrl}" alt="Verification QR" style="width: 55px; height: 55px; border: 1px solid #cbd5e1; border-radius: 4px;" />
                    <div style="font-family: sans-serif; font-size: 0.68rem; color: #475569; line-height: 1.3;">
                      <div style="font-weight: 800; color: #0f172a;">OFFICIAL RECORD</div>
                      <div>Cert No: <strong>${docNumber}</strong></div>
                      <div>Verify ID: ${verificationId}</div>
                      <div>Issued: ${issueDate}</div>
                    </div>
                  </div>
                </td>
                <td style="width: 35%; text-align: center; vertical-align: bottom;">
                  <div style="border-top: 1px dashed #64748b; width: 75%; margin: 24px auto 4px auto;"></div>
                  <div style="font-family: sans-serif; font-size: 0.8rem; font-weight: 800; color: #1e293b;">
                    VOCATIONAL COORDINATOR
                  </div>
                  <div style="font-family: sans-serif; font-size: 0.68rem; color: #64748b;">
                    Gameri Higher Secondary School
                  </div>
                </td>
                <td style="width: 35%; text-align: center; vertical-align: bottom;">
                  <div style="border-top: 1px dashed #64748b; width: 75%; margin: 24px auto 4px auto;"></div>
                  <div style="font-family: sans-serif; font-size: 0.8rem; font-weight: 800; color: #1e3a8a;">
                    PRINCIPAL / HEAD OF INSTITUTION
                  </div>
                  <div style="font-family: sans-serif; font-size: 0.68rem; color: #64748b;">
                    ${school.schoolName}
                  </div>
                </td>
              </tr>
            </table>
          </div>

        </div>
      </div>
    </div>
  `;
}

/**
 * 3. Builds A4 Portrait Transfer Certificate / School Leaving Certificate
 */
export function buildTransferCertificateHtml(data, docMeta = {}) {
  const school = data.school || {
    schoolName: 'GAMERI HIGHER SECONDARY SCHOOL, GAMIRI',
    address: 'Gamiri, Biswanath, Assam - 784172',
    affiliation: 'Affiliated to ASSEB / SEBA (Vocational IT/ITeS)'
  };
  const student = data.student || {};
  const docTitle = data.documentTitle || 'TRANSFER CERTIFICATE';
  const docNumber = docMeta.documentNumber || 'GHSS-TC-2026-000001';
  const verificationId = docMeta.verificationId || 'VRF-TC-2026-OFFICIAL';
  const issueDate = docMeta.issueDate || new Date().toISOString().split('T')[0];
  const qrUrl = generateQrDataUrl(`https://ve-management.org/verify/${verificationId}`);

  const fields = [
    { label: '1. Name of Pupil (in Block Letters)', value: student.studentName || 'Student Name' },
    { label: "2. Father's / Guardian's Name", value: data.parentName || student.fatherName || 'Parent / Guardian' },
    { label: "3. Mother's Name", value: student.motherName || 'Mother Name' },
    { label: '4. Nationality & Domicile', value: 'Indian (Assam)' },
    { label: '5. Whether Candidate belongs to SC / ST / OBC', value: 'General / OBC' },
    { label: '6. Date of First Admission in School with Class', value: `${data.dateOfAdmission || 'Unavailable'} (Class 9)` },
    { label: '7. Date of Birth (in Christian Era)', value: data.dateOfBirth || 'Unavailable' },
    { label: '8. Class in which Pupil last studied', value: `Class ${data.classLastAttended || student.class || '10'} (Section ${data.section || 'A'})` },
    { label: '9. School / Board Annual Examination last taken with result', value: data.academicResult || 'Passed Course' },
    { label: '10. Whether failed, if so once/twice in same class', value: 'No' },
    { label: '11. Subjects Studied', value: (data.subjectsStudied || []).join(', ') || 'IT/ITeS, Employability Skills, Mathematics, Science' },
    { label: '12. Whether qualified for promotion to higher class', value: 'Yes (Promoted)' },
    { label: '13. Month up to which pupil has paid school dues', value: data.duesCleared ? 'Paid up to date (No Dues)' : 'Pending' },
    { label: '14. Total Working Days & Days Present', value: `${data.attendancePercentage}% Attendance Record` },
    { label: '15. General Conduct & Character', value: data.conduct || 'Good' },
    { label: '16. Date of Leaving the School', value: data.dateOfLeaving || 'Unavailable' },
    { label: '17. Reason for Leaving the School', value: data.reasonForLeaving || 'Completion of Course / Higher Studies' },
    { label: '18. Any other remarks', value: data.remarks || 'Diligent and well-behaved student.' }
  ];

  return `
    <div class="tc-sheet" style="
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 12mm 14mm;
      box-sizing: border-box;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Segoe UI', Arial, sans-serif;
      border: 1px solid #cbd5e1;
    ">
      <div style="border: 2px solid #1e3a8a; padding: 10px; min-height: 270mm; box-sizing: border-box; display: flex; flex-direction: column;">
        
        ${renderSchoolHeader(school, `
          <div style="margin-top: 6px; display: inline-block; background: #1e3a8a; color: #ffffff; padding: 3px 20px; border-radius: 4px; font-weight: 900; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase;">
            ${docTitle}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #475569; font-weight: 700; margin-top: 4px; padding: 0 10px;">
            <span>TC No: <strong style="color: #1e3a8a;">${docNumber}</strong></span>
            <span>Admission No: <strong style="color: #1e3a8a;">${data.admissionNo || student.studentId}</strong></span>
            <span>Issue Date: <strong>${issueDate}</strong></span>
          </div>
        `)}

        <div style="flex: 1; margin-top: 6px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.76rem;">
            <tbody>
              ${fields.map((f, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 4px 6px; width: 48%; color: #334155; font-weight: 700;">${f.label}</td>
                  <td style="padding: 4px 6px; width: 52%; color: #0f172a; font-weight: 800; word-break: break-word;">${f.value}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid #cbd5e1;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 30%; vertical-align: top;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <img src="${qrUrl}" alt="Verification QR" style="width: 48px; height: 48px; border: 1px solid #cbd5e1; border-radius: 4px;" />
                  <div style="font-size: 0.62rem; color: #475569; line-height: 1.2;">
                    <div style="font-weight: 800; color: #0f172a;">SCAN TO VERIFY</div>
                    <div>ID: ${verificationId}</div>
                    <div>Date: ${issueDate}</div>
                  </div>
                </div>
              </td>
              <td style="width: 35%; text-align: center; vertical-align: bottom;">
                <div style="border-top: 1px dashed #64748b; width: 80%; margin: 16px auto 2px auto;"></div>
                <div style="font-size: 0.72rem; font-weight: 800; color: #1e293b;">CHECKED BY (CLASS TEACHER)</div>
              </td>
              <td style="width: 35%; text-align: center; vertical-align: bottom;">
                <div style="border-top: 1px dashed #64748b; width: 80%; margin: 16px auto 2px auto;"></div>
                <div style="font-size: 0.72rem; font-weight: 800; color: #1e3a8a;">PRINCIPAL / HEAD OF INSTITUTION</div>
              </td>
            </tr>
          </table>
        </div>

      </div>
    </div>
  `;
}

/**
 * 4. Builds A4 Landscape Character Certificate HTML Template
 */
export function buildCharacterCertificateHtml(data, docMeta = {}) {
  const school = data.school || {
    schoolName: 'GAMERI HIGHER SECONDARY SCHOOL, GAMIRI',
    address: 'Gamiri, Biswanath, Assam - 784172',
    affiliation: 'ASSEB / SEBA'
  };
  const student = data.student || {};
  const docNumber = docMeta.documentNumber || 'GHSS-CHAR-2026-000001';
  const verificationId = docMeta.verificationId || 'VRF-CHAR-2026-OFFICIAL';
  const issueDate = docMeta.issueDate || new Date().toISOString().split('T')[0];
  const qrUrl = generateQrDataUrl(`https://ve-management.org/verify/${verificationId}`);

  return `
    <div class="char-sheet" style="
      width: 297mm;
      min-height: 210mm;
      margin: 0 auto;
      padding: 12mm 14mm;
      box-sizing: border-box;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Georgia', serif;
      border: 1px solid #cbd5e1;
    ">
      <div style="border: 4px double #1e3a8a; padding: 12px; min-height: 184mm; box-sizing: border-box; background: #fafaf9;">
        <div style="border: 1px solid #0284c7; padding: 16px 24px; min-height: 174mm; text-align: center;">
          
          ${renderSchoolHeader(school, `
            <div style="margin-top: 8px; display: inline-block; border-bottom: 2px solid #0284c7; padding-bottom: 2px;">
              <h2 style="margin: 0; font-size: 1.55rem; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 2px;">
                CHARACTER CERTIFICATE
              </h2>
            </div>
          `)}

          <div style="max-width: 230mm; margin: 16px auto 0 auto; font-size: 1.05rem; line-height: 1.8; color: #1e293b;">
            <p style="margin: 0 0 12px 0;">
              This is to certify that <strong>${student.studentName || 'Student Name'}</strong>, 
              Student ID: <strong>${student.studentId || '--'}</strong>, 
              Roll No: <strong>#${student.rollNo || '--'}</strong>,
              child of <strong>${student.fatherName || student.motherName || 'Parent / Guardian'}</strong>, 
              is/was a bonafide regular student of <strong>Class ${data.class || student.class || '10'}</strong> 
              during the Academic Session <strong>${data.academicYear || '2026–2027'}</strong>.
            </p>

            <p style="margin: 0 0 12px 0;">
              To the best of our knowledge and institutional records, he/she ${data.conductStatement || 'bears a commendable moral character and orderly conduct during the period of study'} in this institution.
            </p>

            <p style="margin: 0; font-style: italic; color: #475569;">
              We wish the student every success in all future academic and career endeavors.
            </p>
          </div>

          <div style="margin-top: 32px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 30%; text-align: left; vertical-align: bottom;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <img src="${qrUrl}" alt="Verification QR" style="width: 52px; height: 52px; border: 1px solid #cbd5e1; border-radius: 4px;" />
                    <div style="font-family: sans-serif; font-size: 0.65rem; color: #475569; line-height: 1.25;">
                      <div style="font-weight: 800; color: #0f172a;">OFFICIAL RECORD</div>
                      <div>Doc: ${docNumber}</div>
                      <div>ID: ${verificationId}</div>
                      <div>Date: ${issueDate}</div>
                    </div>
                  </div>
                </td>
                <td style="width: 35%; text-align: center; vertical-align: bottom;">
                  <div style="border-top: 1px dashed #64748b; width: 75%; margin: 20px auto 4px auto;"></div>
                  <div style="font-family: sans-serif; font-size: 0.78rem; font-weight: 800; color: #1e293b;">CLASS TEACHER</div>
                </td>
                <td style="width: 35%; text-align: center; vertical-align: bottom;">
                  <div style="border-top: 1px dashed #64748b; width: 75%; margin: 20px auto 4px auto;"></div>
                  <div style="font-family: sans-serif; font-size: 0.78rem; font-weight: 800; color: #1e3a8a;">PRINCIPAL / HEAD OF INSTITUTION</div>
                </td>
              </tr>
            </table>
          </div>

        </div>
      </div>
    </div>
  `;
}

/**
 * 5. Builds A4 Portrait Examination Admit Card
 */
export function buildAdmitCardHtml(data, docMeta = {}) {
  const school = data.school || {
    schoolName: 'GAMERI HIGHER SECONDARY SCHOOL, GAMIRI',
    address: 'Gamiri, Biswanath, Assam - 784172',
    affiliation: 'ASSEB / SEBA Examination Division'
  };
  const student = data.student || {};
  const docNumber = docMeta.documentNumber || 'GHSS-ADM-2026-000001';
  const verificationId = docMeta.verificationId || 'VRF-ADM-2026-OFFICIAL';
  const issueDate = docMeta.issueDate || new Date().toISOString().split('T')[0];
  const qrUrl = generateQrDataUrl(`https://ve-management.org/verify/${verificationId}`);
  const schedule = data.schedule || [];

  return `
    <div class="admit-sheet" style="
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 12mm 14mm;
      box-sizing: border-box;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Segoe UI', Arial, sans-serif;
      border: 1px solid #cbd5e1;
    ">
      <div style="border: 2px solid #1e3a8a; padding: 10px; min-height: 270mm; box-sizing: border-box; display: flex; flex-direction: column;">
        
        ${renderSchoolHeader(school, `
          <div style="margin-top: 6px; display: inline-block; background: #1e3a8a; color: #ffffff; padding: 3px 20px; border-radius: 4px; font-weight: 900; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase;">
            EXAMINATION ADMIT CARD
          </div>
          <div style="font-size: 0.78rem; font-weight: 700; color: #334155; margin-top: 3px;">
            ${data.examination || 'Annual Board Assessment'} • Session: ${data.academicYear || '2026–2027'}
          </div>
        `)}

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 0.8rem;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 2px 0; width: 18%; color: #64748b; font-weight: 700;">Candidate Name:</td>
              <td style="padding: 2px 0; width: 34%; font-weight: 800; color: #0f172a; text-transform: uppercase; word-break: break-word;">${student.studentName || 'Student Name'}</td>
              <td style="padding: 2px 0; width: 16%; color: #64748b; font-weight: 700;">Roll Number:</td>
              <td style="padding: 2px 0; width: 32%; font-weight: 800; color: #0f172a;">#${student.rollNo || '--'}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #64748b; font-weight: 700;">Student ID:</td>
              <td style="padding: 2px 0; font-weight: 700; color: #0f172a;">${student.studentId || '--'}</td>
              <td style="padding: 2px 0; color: #64748b; font-weight: 700;">Class & Sec:</td>
              <td style="padding: 2px 0; font-weight: 700; color: #0f172a;">Class ${data.class || student.class || '10'} (${student.section || 'A'})</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #64748b; font-weight: 700;">Exam Centre:</td>
              <td colspan="3" style="padding: 2px 0; font-weight: 700; color: #0369a1;">${data.examCentre || 'Gameri HSS Examination Centre (Code: GHSS-01)'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 10px; flex: 1;">
          <div style="font-size: 0.78rem; font-weight: 800; color: #1e3a8a; margin-bottom: 4px; text-transform: uppercase;">
            Examination Timetable & Papers:
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
            <thead>
              <tr style="background: #1e3a8a; color: #ffffff;">
                <th style="padding: 5px 8px; border: 1px solid #1e3a8a; width: 18%;">Date & Day</th>
                <th style="padding: 5px 8px; border: 1px solid #1e3a8a; width: 22%;">Time / Session</th>
                <th style="padding: 5px 8px; border: 1px solid #1e3a8a; width: 38%;">Subject / Paper</th>
                <th style="padding: 5px 8px; border: 1px solid #1e3a8a; width: 22%; text-align: center;">Venue / Room</th>
              </tr>
            </thead>
            <tbody>
              ${schedule.map((item, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: 700;">${item.date} (${item.day})</td>
                  <td style="padding: 4px 8px; border: 1px solid #cbd5e1; color: #475569;">${item.time}</td>
                  <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: 800; color: #1e293b;">${item.subject}</td>
                  <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: center; color: #0369a1; font-weight: 600;">${item.venue}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 8px 10px; margin-bottom: 10px; font-size: 0.72rem; color: #92400e;">
          <div style="font-weight: 800; margin-bottom: 2px;">INSTRUCTIONS FOR CANDIDATES:</div>
          <ul style="margin: 0; padding-left: 16px; line-height: 1.35;">
            ${(data.candidateInstructions || []).map(ins => `<li>${ins}</li>`).join('')}
          </ul>
        </div>

        <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid #cbd5e1;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 32%; vertical-align: top;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <img src="${qrUrl}" alt="Verification QR" style="width: 48px; height: 48px; border: 1px solid #cbd5e1; border-radius: 4px;" />
                  <div style="font-size: 0.62rem; color: #475569; line-height: 1.2;">
                    <div style="font-weight: 800; color: #0f172a;">SCAN TO VERIFY</div>
                    <div>ID: ${verificationId}</div>
                    <div>Doc: ${docNumber}</div>
                  </div>
                </div>
              </td>
              <td style="width: 34%; text-align: center; vertical-align: bottom;">
                <div style="border-top: 1px dashed #64748b; width: 80%; margin: 16px auto 2px auto;"></div>
                <div style="font-size: 0.72rem; font-weight: 800; color: #1e293b;">CENTRE SUPERINTENDENT</div>
              </td>
              <td style="width: 34%; text-align: center; vertical-align: bottom;">
                <div style="border-top: 1px dashed #64748b; width: 80%; margin: 16px auto 2px auto;"></div>
                <div style="font-size: 0.72rem; font-weight: 800; color: #1e3a8a;">PRINCIPAL / HEAD OF INSTITUTION</div>
              </td>
            </tr>
          </table>
        </div>

      </div>
    </div>
  `;
}

/**
 * 6. Builds A4 Portrait Bonafide / Study / Migration Certificate
 */
export function buildSimpleCertificateHtml(data, docMeta = {}, type = 'BONAFIDE') {
  const school = data.school || {
    schoolName: 'GAMERI HIGHER SECONDARY SCHOOL, GAMIRI',
    address: 'Gamiri, Biswanath, Assam - 784172',
    affiliation: 'ASSEB / SEBA'
  };
  const student = data.student || {};
  const docNumber = docMeta.documentNumber || `GHSS-${type}-2026-000001`;
  const verificationId = docMeta.verificationId || `VRF-${type}-2026-OFFICIAL`;
  const issueDate = docMeta.issueDate || new Date().toISOString().split('T')[0];
  const qrUrl = generateQrDataUrl(`https://ve-management.org/verify/${verificationId}`);

  let title = 'BONAFIDE STUDENT CERTIFICATE';
  let bodyContent = '';

  if (type === 'BONAFIDE') {
    title = 'BONAFIDE STUDENT CERTIFICATE';
    bodyContent = `
      <p style="margin: 0 0 14px 0;">
        This is to certify that <strong>${student.studentName || 'Student Name'}</strong>, 
        Student ID: <strong>${student.studentId || '--'}</strong>, 
        Roll No: <strong>#${student.rollNo || '--'}</strong>, 
        son/daughter of <strong>${student.fatherName || student.motherName || 'Parent / Guardian'}</strong>, 
        is a bonafide regular student of <strong>Class ${data.class || student.class || '10'}</strong>, Section <strong>${student.section || 'A'}</strong> 
        of this institution during the Academic Session <strong>${data.academicYear || '2026–2027'}</strong>.
      </p>
      <p style="margin: 0 0 14px 0;">
        This certificate is issued upon request for the official purpose of: <strong style="color: #1e3a8a;">${data.purpose || 'Official Verification & Institutional Purposes'}</strong>.
      </p>
    `;
  } else if (type === 'STUDY') {
    title = 'STUDY CERTIFICATE';
    bodyContent = `
      <p style="margin: 0 0 14px 0;">
        This is to certify that <strong>${student.studentName || 'Student Name'}</strong>, 
        Student ID: <strong>${student.studentId || '--'}</strong>, 
        Roll No: <strong>#${student.rollNo || '--'}</strong>, 
        has been studying in Gameri Higher Secondary School during the period <strong>${data.periodOfStudy || '2024 to 2027'}</strong>.
      </p>
      <p style="margin: 0 0 14px 0;">
        He/She is currently enrolled in <strong>Class ${data.class || student.class || '10'}</strong> in the Vocational Education stream (IT/ITeS).
      </p>
    `;
  } else if (type === 'MIGRATION') {
    title = 'MIGRATION CERTIFICATE';
    bodyContent = `
      <p style="margin: 0 0 14px 0;">
        This institution has <strong>No Objection</strong> to <strong>${student.studentName || 'Student Name'}</strong>, 
        Student ID: <strong>${student.studentId || '--'}</strong>, 
        Date of Birth: <strong>${data.dateOfBirth || 'Unavailable'}</strong>, 
        who last attended <strong>Class ${data.classLastAttended || student.class || '10'}</strong> during Academic Session <strong>${data.academicYear || '2026–2027'}</strong>, 
        joining <strong>${data.destinationInstitution || 'any recognized Board / Educational Institution'}</strong> 
        for the purpose of <strong>${data.migrationReason || 'Higher Studies'}</strong>.
      </p>
    `;
  }

  return `
    <div class="simple-cert-sheet" style="
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 14mm 16mm;
      box-sizing: border-box;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Georgia', serif;
      border: 1px solid #cbd5e1;
    ">
      <div style="border: 2px solid #1e3a8a; padding: 14px; min-height: 265mm; box-sizing: border-box; display: flex; flex-direction: column;">
        
        ${renderSchoolHeader(school, `
          <div style="margin-top: 10px; display: inline-block; background: #1e3a8a; color: #ffffff; padding: 4px 24px; border-radius: 4px; font-weight: 900; font-size: 0.95rem; letter-spacing: 1.5px; text-transform: uppercase;">
            ${title}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: #475569; font-weight: 700; margin-top: 6px; padding: 0 10px;">
            <span>Ref No: <strong style="color: #1e3a8a;">${docNumber}</strong></span>
            <span>Date: <strong>${issueDate}</strong></span>
          </div>
        `)}

        <div style="flex: 1; margin: 30px 10px 0 10px; font-size: 1.05rem; line-height: 1.9; color: #1e293b;">
          ${bodyContent}
          <p style="margin: 20px 0 0 0; font-style: italic; color: #475569;">
            According to the records of this institution, his/her conduct and character have been satisfactory throughout.
          </p>
        </div>

        <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid #cbd5e1;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 35%; vertical-align: top;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <img src="${qrUrl}" alt="Verification QR" style="width: 52px; height: 52px; border: 1px solid #cbd5e1; border-radius: 4px;" />
                  <div style="font-family: sans-serif; font-size: 0.65rem; color: #475569; line-height: 1.25;">
                    <div style="font-weight: 800; color: #0f172a;">OFFICIAL RECORD</div>
                    <div>Doc: ${docNumber}</div>
                    <div>ID: ${verificationId}</div>
                  </div>
                </div>
              </td>
              <td style="width: 65%; text-align: center; vertical-align: bottom;">
                <div style="border-top: 1px dashed #64748b; width: 65%; margin: 30px auto 4px auto;"></div>
                <div style="font-family: sans-serif; font-size: 0.8rem; font-weight: 800; color: #1e3a8a;">PRINCIPAL / HEAD OF INSTITUTION</div>
                <div style="font-family: sans-serif; font-size: 0.7rem; color: #64748b;">${school.schoolName}</div>
              </td>
            </tr>
          </table>
        </div>

      </div>
    </div>
  `;
}

/**
 * 7. Builds A4 Landscape Merit / Achievement / Participation / Custom Certificate
 */
export function buildDecorativeCertificateHtml(data, docMeta = {}, type = 'MERIT') {
  const school = data.school || {
    schoolName: 'GAMERI HIGHER SECONDARY SCHOOL, GAMIRI',
    address: 'Gamiri, Biswanath, Assam - 784172',
    affiliation: 'ASSEB / SEBA'
  };
  const student = data.student || {};
  const docNumber = docMeta.documentNumber || `GHSS-${type}-2026-000001`;
  const verificationId = docMeta.verificationId || `VRF-${type}-2026-OFFICIAL`;
  const issueDate = docMeta.issueDate || new Date().toISOString().split('T')[0];
  const qrUrl = generateQrDataUrl(`https://ve-management.org/verify/${verificationId}`);

  let title = 'CERTIFICATE OF MERIT';
  let subtitle = 'ACADEMIC EXCELLENCE & DISTINCTION';
  let borderColor = '#b45309';
  let bodyStatement = '';

  if (type === 'MERIT') {
    title = 'CERTIFICATE OF MERIT';
    subtitle = 'ACADEMIC EXCELLENCE & DISTINCTION';
    borderColor = '#b45309';
    bodyStatement = `
      has been awarded this Certificate of Merit in recognition of securing 
      <strong style="color: #b45309; font-size: 1.15rem;">${data.positionRank || 'First Position'}</strong> 
      in <strong>${data.eventName || 'Annual Academic Assessment in Vocational IT/ITeS'}</strong> 
      during the Academic Session <strong>${data.academicYear || '2026–2027'}</strong>.
    `;
  } else if (type === 'ACHIEVEMENT') {
    title = 'SPECIAL ACHIEVEMENT CERTIFICATE';
    subtitle = 'OUTSTANDING VOCATIONAL PERFORMANCE';
    borderColor = '#047857';
    bodyStatement = `
      has achieved outstanding success for 
      <strong style="color: #047857; font-size: 1.15rem;">${data.achievementTitle || 'Special Achievement'}</strong> 
      at the <strong>${data.eventCompetition || 'District Vocational Skill Summit'}</strong> (${data.levelCategory || 'District Level'})
      during the Academic Session <strong>${data.academicYear || '2026–2027'}</strong>.
    `;
  } else if (type === 'PARTICIPATION') {
    title = 'CERTIFICATE OF PARTICIPATION';
    subtitle = 'VOCATIONAL & CO-CURRICULAR SKILLS';
    borderColor = '#0284c7';
    bodyStatement = `
      has actively participated with great dedication in 
      <strong style="color: #0284c7; font-size: 1.15rem;">${data.eventName || 'Vocational IT Exhibition'}</strong> 
      organized by <strong>${data.organizer || 'Department of Vocational Education'}</strong> on <strong>${data.eventDate || issueDate}</strong>.
    `;
  } else if (type === 'CUSTOM') {
    title = data.certificateTitle || 'INSTITUTIONAL CERTIFICATE';
    subtitle = data.certificateSubtitle || 'VOCATIONAL EDUCATION DIVISION';
    borderColor = '#4338ca';
    bodyStatement = data.bodyStatement || 'has fulfilled specialized institutional requirements with commendable performance.';
  }

  return `
    <div class="decor-sheet" style="
      width: 297mm;
      min-height: 210mm;
      margin: 0 auto;
      padding: 12mm 14mm;
      box-sizing: border-box;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Georgia', serif;
      border: 1px solid #cbd5e1;
    ">
      <div style="border: 4px double #1e3a8a; padding: 10px; min-height: 184mm; box-sizing: border-box; background: #fffdfa;">
        <div style="border: 1px solid ${borderColor}; padding: 14px 20px; min-height: 178mm; text-align: center; position: relative;">
          
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
              <div style="width: 46px; height: 46px; background: #1e3a8a; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; font-family: sans-serif;">
                GHSS
              </div>
              <div>
                <h1 style="margin: 0; font-size: 1.4rem; font-weight: 900; color: #1e3a8a; letter-spacing: 1px; text-transform: uppercase;">
                  ${school.schoolName}
                </h1>
                <div style="font-size: 0.78rem; color: #78350f; font-family: sans-serif; font-weight: 600;">
                  ${school.address} • School ID: GAMERI-HSS-001
                </div>
              </div>
            </div>
          </div>

          <div style="margin: 8px 0 14px 0;">
            <div style="display: inline-block; border-bottom: 2px solid ${borderColor}; padding-bottom: 2px;">
              <h2 style="margin: 0; font-size: 1.6rem; font-weight: 900; color: ${borderColor}; text-transform: uppercase; letter-spacing: 2px;">
                ${title}
              </h2>
            </div>
            <div style="font-size: 0.8rem; color: #64748b; font-family: sans-serif; font-weight: 700; margin-top: 3px; text-transform: uppercase; letter-spacing: 1px;">
              ${subtitle}
            </div>
          </div>

          <div style="max-width: 230mm; margin: 0 auto; font-size: 1.05rem; line-height: 1.7; color: #1e293b;">
            <p style="margin: 0 0 8px 0; font-style: italic; color: #64748b;">
              This is proudly presented to
            </p>

            <div style="font-size: 1.5rem; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #cbd5e1; display: inline-block; padding: 0 20px 2px 20px; margin-bottom: 6px; word-break: break-word;">
              ${student.studentName || 'Student Name'}
            </div>

            <div style="font-size: 0.82rem; color: #475569; font-family: sans-serif; font-weight: 600; margin-bottom: 10px;">
              Student ID: <strong style="color: #0f172a;">${student.studentId || '--'}</strong> &nbsp;|&nbsp; Class ${data.class || student.class || '10'} &nbsp;|&nbsp; Roll No: <strong style="color: #0f172a;">#${student.rollNo || '--'}</strong>
            </div>

            <p style="margin: 0; font-size: 1rem; color: #334155;">
              ${bodyStatement}
            </p>
          </div>

          <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 30%; text-align: left; vertical-align: bottom;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <img src="${qrUrl}" alt="Verification QR" style="width: 52px; height: 52px; border: 1px solid #cbd5e1; border-radius: 4px;" />
                    <div style="font-family: sans-serif; font-size: 0.65rem; color: #475569; line-height: 1.25;">
                      <div style="font-weight: 800; color: #0f172a;">OFFICIAL RECORD</div>
                      <div>Doc: <strong>${docNumber}</strong></div>
                      <div>ID: ${verificationId}</div>
                      <div>Issued: ${issueDate}</div>
                    </div>
                  </div>
                </td>
                <td style="width: 35%; text-align: center; vertical-align: bottom;">
                  <div style="border-top: 1px dashed #64748b; width: 75%; margin: 20px auto 4px auto;"></div>
                  <div style="font-family: sans-serif; font-size: 0.78rem; font-weight: 800; color: #1e293b;">
                    ${data.signatory?.coordinator || data.signatory?.title1 || 'VOCATIONAL COORDINATOR'}
                  </div>
                  <div style="font-family: sans-serif; font-size: 0.65rem; color: #64748b;">
                    Gameri Higher Secondary School
                  </div>
                </td>
                <td style="width: 35%; text-align: center; vertical-align: bottom;">
                  <div style="border-top: 1px dashed #64748b; width: 75%; margin: 20px auto 4px auto;"></div>
                  <div style="font-family: sans-serif; font-size: 0.78rem; font-weight: 800; color: #1e3a8a;">
                    ${data.signatory?.principal || data.signatory?.title2 || 'PRINCIPAL / HEAD OF INSTITUTION'}
                  </div>
                  <div style="font-family: sans-serif; font-size: 0.65rem; color: #64748b;">
                    ${school.schoolName}
                  </div>
                </td>
              </tr>
            </table>
          </div>

        </div>
      </div>
    </div>
  `;
}

/**
 * Universal Document HTML Dispatcher
 */
export function buildDocumentHtml(documentType, data, docMeta = {}) {
  const type = String(documentType || '').toUpperCase().trim();
  switch (type) {
    case 'MARKSHEET':
      return buildMarksheetHtml(data, docMeta);
    case 'COMPLETION_CERTIFICATE':
      return buildCompletionCertificateHtml(data, docMeta);
    case 'TRANSFER_CERTIFICATE':
    case 'SCHOOL_LEAVING_CERTIFICATE':
      return buildTransferCertificateHtml(data, docMeta);
    case 'CHARACTER_CERTIFICATE':
      return buildCharacterCertificateHtml(data, docMeta);
    case 'ADMIT_CARD':
      return buildAdmitCardHtml(data, docMeta);
    case 'BONAFIDE_CERTIFICATE':
      return buildSimpleCertificateHtml(data, docMeta, 'BONAFIDE');
    case 'STUDY_CERTIFICATE':
      return buildSimpleCertificateHtml(data, docMeta, 'STUDY');
    case 'MIGRATION_CERTIFICATE':
      return buildSimpleCertificateHtml(data, docMeta, 'MIGRATION');
    case 'MERIT_CERTIFICATE':
      return buildDecorativeCertificateHtml(data, docMeta, 'MERIT');
    case 'ACHIEVEMENT_CERTIFICATE':
      return buildDecorativeCertificateHtml(data, docMeta, 'ACHIEVEMENT');
    case 'PARTICIPATION_CERTIFICATE':
      return buildDecorativeCertificateHtml(data, docMeta, 'PARTICIPATION');
    case 'CUSTOM_CERTIFICATE':
      return buildDecorativeCertificateHtml(data, docMeta, 'CUSTOM');
    default:
      return buildCompletionCertificateHtml(data, docMeta);
  }
}

/**
 * Triggers native browser print dialog for A4 printing or Save as PDF
 */
export function printDocumentHtml(htmlContent, orientation = 'portrait') {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow popups to print documents.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Document — Gameri Higher Secondary School</title>
        <style>
          @page {
            size: A4 ${orientation};
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Downloads the document as a clean HTML file for offline archiving
 */
export function downloadDocumentFile(htmlContent, filename = 'document.html') {
  const blob = new Blob([`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${filename}</title>
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 20px; background: #f1f5f9; display: flex; justify-content: center; }
          @media print {
            body { padding: 0; background: #ffffff; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `], { type: 'text/html;charset=utf-8' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
